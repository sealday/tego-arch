import {createHash, randomUUID} from 'node:crypto';
import {mkdir, readFile, rename, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {fileURLToPath} from 'node:url';

export const maxSuccessAgeMs = 120 * 24 * 60 * 60 * 1000;

const acceptedOutcomes = new Set(['healthy', 'auth-required', 'retired']);
const outcomes = new Set([
  ...acceptedOutcomes,
  'redirect-changed',
  'error',
]);
const reviewStatuses = new Set([
  'healthy',
  'auth-required',
  'retired',
  'stale',
]);
const redirectStatuses = new Set([301, 302, 303, 307, 308]);
const transientResponseStatuses = new Set([429, 500, 502, 503, 504]);
const transientRetryDelayMs = 250;
const userAgent =
  'Mozilla/5.0 (compatible; TegoArchLinkCheck/1.0; +https://github.com/sealday/tego-arch)';

function transportLocator(locator) {
  const value = new URL(locator);
  value.hash = '';
  return value.href;
}

function sortedStrings(values) {
  return [...values].sort((left, right) => left.localeCompare(right, 'en'));
}

function formatDiagnostic(locator, sourceIds, message) {
  return `data/source-link-health.json: transport ${JSON.stringify(
    locator,
  )} sources ${JSON.stringify(sortedStrings(sourceIds))}: ${message}`;
}

function sourceTransports(source, citedUrls = []) {
  if (!source.canonical_locator.startsWith('https://')) {
    return [];
  }
  const values = [
    {
      transport_locator:
        source.query_insensitive === true
          ? source.transport_locator
          : transportLocator(source.transport_locator ?? source.canonical_locator),
      expected_final_transport_locator:
        source.expected_final_transport_locator,
      expected_final_approved_at: source.expected_final_approved_at,
      expected_final_approval_note: source.expected_final_approval_note,
      primary_transport: true,
    },
  ];
  for (const alias of source.locator_aliases ?? []) {
    const aliasTransport = transportLocator(
      alias.transport_locator ?? alias.locator,
    );
    const cited = citedUrls.some((citationUrl) => {
      if (!citationUrl.startsWith('https://')) return false;
      if (source.query_insensitive === true) {
        const citation = new URL(citationUrl);
        citation.hash = '';
        citation.search = '';
        const aliasUrl = new URL(aliasTransport);
        aliasUrl.search = '';
        return citation.href === aliasUrl.href;
      }
      return transportLocator(citationUrl) === aliasTransport;
    });
    if (!cited) continue;
    values.push({
      transport_locator:
        source.query_insensitive === true
          ? alias.transport_locator
          : transportLocator(alias.transport_locator ?? alias.locator),
      expected_final_transport_locator:
        alias.expected_final_transport_locator,
      expected_final_approved_at: alias.expected_final_approved_at,
      expected_final_approval_note: alias.expected_final_approval_note,
      primary_transport: false,
    });
  }
  return values.filter(
    ({transport_locator}) =>
      typeof transport_locator === 'string' &&
      transport_locator.startsWith('https://'),
  );
}

function collectTargets(ledger) {
  const groups = new Map();
  const superseded = new Set(
    (ledger.superseded_transports ?? []).flatMap((authority) =>
      (authority.source_ids ?? []).map(
        (sourceId) => `${sourceId}\0${authority.transport_locator}`,
      ),
    ),
  );
  const citationsBySource = new Map();
  for (const document of Object.values(ledger.documents ?? {})) {
    for (const citation of document.citations ?? []) {
      const values = citationsBySource.get(citation.source_id) ?? [];
      values.push(citation.citation_url);
      citationsBySource.set(citation.source_id, values);
    }
  }
  for (const source of ledger.sources ?? []) {
    for (const transport of sourceTransports(
      source,
      citationsBySource.get(source.id) ?? [],
    )) {
      const locator = transportLocator(transport.transport_locator);
      if (superseded.has(`${source.id}\0${locator}`)) continue;
      const current = groups.get(locator) ?? {
        transport_locator: locator,
        expected_final_transport_locator:
          transport.expected_final_transport_locator,
        expected_final_approved_at: transport.expected_final_approved_at,
        expected_final_approval_note: transport.expected_final_approval_note,
        source_ids: [],
        link_policy: source.link_policy,
        conflicts: [],
        primary_transport: false,
      };
      const fields = [
        'link_policy',
        'expected_final_transport_locator',
        'expected_final_approved_at',
        'expected_final_approval_note',
      ];
      for (const field of fields) {
        const incoming =
          field === 'link_policy' ? source.link_policy : transport[field];
        if (current[field] !== incoming) {
          current.conflicts.push(field);
        }
      }
      current.source_ids.push(source.id);
      current.primary_transport ||= transport.primary_transport;
      groups.set(locator, current);
    }
  }
  return [...groups.values()]
    .map((target) => ({
      ...target,
      source_ids: sortedStrings(new Set(target.source_ids)),
      conflicts: sortedStrings(new Set(target.conflicts)),
    }))
    .sort((left, right) =>
      left.transport_locator.localeCompare(right.transport_locator, 'en'),
    );
}

export function buildLinkTargets(ledger) {
  return collectTargets(ledger).map(
    ({conflicts: _conflicts, primary_transport: _primary, ...target}) => target,
  );
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validAttempt(value, {success = false, full = false} = {}) {
  if (
    !isRecord(value) ||
    typeof value.at !== 'string' ||
    Number.isNaN(Date.parse(value.at)) ||
    typeof value.outcome !== 'string' ||
    !outcomes.has(value.outcome) ||
    (success && !acceptedOutcomes.has(value.outcome)) ||
    !(
      value.final_transport_locator === null ||
      (typeof value.final_transport_locator === 'string' &&
        value.final_transport_locator.startsWith('https://'))
    ) ||
    !(
      value.http_status === null ||
      (Number.isInteger(value.http_status) &&
        value.http_status >= 100 &&
        value.http_status <= 599)
    )
  ) {
    return false;
  }
  if (
    full &&
    (typeof value.login_wall_detected !== 'boolean' ||
      !Array.isArray(value.redirects) ||
      !value.redirects.every(
        (redirect) =>
          isRecord(redirect) &&
          redirectStatuses.has(redirect.status) &&
          typeof redirect.from === 'string' &&
          redirect.from.startsWith('https://') &&
          typeof redirect.to === 'string' &&
          redirect.to.startsWith('https://'),
      ) ||
      !(
        value.error === undefined ||
        (typeof value.error === 'string' && value.error.length > 0)
      ))
  ) {
    return false;
  }
  return true;
}

function sameObservation(left, right) {
  return ['at', 'outcome', 'final_transport_locator', 'http_status'].every(
    (field) => left?.[field] === right?.[field],
  );
}

function sourceIdsKey(sourceIds) {
  return JSON.stringify(sortedStrings(sourceIds));
}

const supersededReason = 'ledger transport target changed for exact source_ids';

function normalizedResultSha256(result) {
  return createHash('sha256')
    .update(`${JSON.stringify(result)}\n`)
    .digest('hex');
}

function authorityKey(transportLocatorValue, sourceIds) {
  return `${transportLocatorValue}\0${sourceIdsKey(sourceIds)}`;
}

function newerObservation(left, right) {
  if (!left) return right;
  if (!right) return left;
  const difference = Date.parse(left.at) - Date.parse(right.at);
  if (difference !== 0) return difference > 0 ? left : right;
  return JSON.stringify(left).localeCompare(JSON.stringify(right), 'en') >= 0
    ? left
    : right;
}

function mergeResultObservations(left, right) {
  if (!left) return structuredClone(right);
  const excludedFields = new Set([
    'last_attempt',
    'last_success',
    'attempt_history',
    'merge_conflicts',
  ]);
  const identityFields = new Set(['transport_locator', 'source_ids']);
  const sameLastAttempt = isDeepStrictEqual(
    left.last_attempt,
    right.last_attempt,
  );
  const comparableFields = new Set([
    ...Object.keys(left),
    ...Object.keys(right),
  ]);
  const conflicts = [
    ...(left.merge_conflicts ?? []),
    ...(right.merge_conflicts ?? []),
    ...[...comparableFields].filter(
      (field) =>
        !excludedFields.has(field) &&
        (identityFields.has(field) || sameLastAttempt) &&
        !isDeepStrictEqual(left[field], right[field]),
    ),
  ];
  const newerAttempt = newerObservation(left.last_attempt, right.last_attempt);
  let newer;
  if (sameLastAttempt) {
    const comparable = (result) =>
      JSON.stringify(
        Object.fromEntries(
          [...comparableFields]
            .filter((field) => !excludedFields.has(field))
            .sort((a, b) => a.localeCompare(b, 'en'))
            .map((field) => [field, result[field]]),
        ),
      );
    newer = comparable(left).localeCompare(comparable(right), 'en') <= 0
      ? left
      : right;
  } else {
    newer = newerAttempt === left.last_attempt ? left : right;
  }
  const historyByObservation = new Map();
  for (const attempt of [...left.attempt_history, ...right.attempt_history]) {
    const key = JSON.stringify([
      attempt.at,
      attempt.outcome,
      attempt.final_transport_locator,
      attempt.http_status,
    ]);
    const current = historyByObservation.get(key);
    if (
      !current ||
      JSON.stringify(attempt).localeCompare(JSON.stringify(current), 'en') > 0
    ) {
      historyByObservation.set(key, attempt);
    }
  }
  return {
    ...structuredClone(newer),
    last_success: structuredClone(
      newerObservation(left.last_success, right.last_success) ?? null,
    ),
    attempt_history: [...historyByObservation.values()].sort((a, b) => {
      const difference = Date.parse(a.at) - Date.parse(b.at);
      return difference || JSON.stringify(a).localeCompare(JSON.stringify(b), 'en');
    }),
    ...(conflicts.length > 0
      ? {merge_conflicts: sortedStrings(new Set(conflicts))}
      : {}),
  };
}

function collectSupersededResults(ledger, caches, now) {
  const authorities = new Map(
    (ledger.superseded_transports ?? []).map((authority) => [
      authorityKey(authority.transport_locator, authority.source_ids),
      authority,
    ]),
  );
  const archivedResults = new Map();
  const archiveMetadata = new Map();
  for (const cache of caches) {
    for (const entry of cache?.superseded_results ?? []) {
      if (!entry?.result) continue;
      const key = authorityKey(
        entry.result.transport_locator,
        entry.result.source_ids ?? [],
      );
      archivedResults.set(
        key,
        mergeResultObservations(archivedResults.get(key), entry.result),
      );
      const currentMetadata = archiveMetadata.get(key);
      if (
        !currentMetadata ||
        JSON.stringify(entry).localeCompare(JSON.stringify(currentMetadata), 'en') < 0
      ) {
        archiveMetadata.set(key, structuredClone(entry));
      }
    }
  }
  for (const cache of caches) {
    for (const result of cache?.results ?? []) {
      const key = authorityKey(result.transport_locator, result.source_ids ?? []);
      if (!authorities.has(key)) continue;
      archivedResults.set(
        key,
        mergeResultObservations(archivedResults.get(key), result),
      );
    }
  }
  return [...archivedResults.entries()].map(([key, result]) => {
    const authority = authorities.get(key);
    const metadata = archiveMetadata.get(key);
    return {
      superseded_at:
        authority?.superseded_at ?? metadata?.superseded_at ?? now.toISOString(),
      replacement_transport_locator:
        authority?.replacement_transport_locator ??
        metadata?.replacement_transport_locator,
      reason: authority?.reason ?? metadata?.reason ?? supersededReason,
      result,
    };
  }).sort((left, right) =>
    left.result.transport_locator.localeCompare(
      right.result.transport_locator,
      'en',
    ),
  );
}

function ambiguousMigrationResults(ledger, targets, results) {
  const targetsBySourceIds = new Map();
  for (const target of targets) {
    const key = sourceIdsKey(target.source_ids);
    const matches = targetsBySourceIds.get(key) ?? [];
    matches.push(target);
    targetsBySourceIds.set(key, matches);
  }
  const authorities = new Set(
    (ledger.superseded_transports ?? []).map((authority) =>
      authorityKey(authority.transport_locator, authority.source_ids),
    ),
  );
  return results.filter((result) => {
    const matches = targetsBySourceIds.get(sourceIdsKey(result.source_ids ?? []));
    const target = matches?.find(
      ({transport_locator: locator}) => locator === result.transport_locator,
    );
    return (
      matches?.some(({primary_transport}) => primary_transport) &&
      (!target || target.primary_transport === false) &&
      !authorities.has(
        authorityKey(result.transport_locator, result.source_ids ?? []),
      )
    );
  });
}

export function validateLinkHealthCacheStructure(ledger, cache) {
  const targets = collectTargets(ledger);
  const errors = [];
  for (const target of targets) {
    if (target.conflicts.length > 0) {
      errors.push(
        formatDiagnostic(
          target.transport_locator,
          target.source_ids,
          `ledger sources conflict on ${target.conflicts.join(', ')}`,
        ),
      );
    }
  }
  if (
    !isRecord(cache) ||
    cache.schema_version !== 1 ||
    typeof cache.generated_at !== 'string' ||
    Number.isNaN(Date.parse(cache.generated_at)) ||
    !Array.isArray(cache.results)
  ) {
    return {
      errors: [
        ...errors,
        'data/source-link-health.json: expected schema_version 1, generated_at, and results[]',
      ].sort(),
    };
  }
  if (
    cache.superseded_results !== undefined &&
    !Array.isArray(cache.superseded_results)
  ) {
    errors.push('data/source-link-health.json: superseded_results must be an array');
  }

  const expected = new Map(
    targets.map((target) => [target.transport_locator, target]),
  );
  const ledgerSourceIds = new Set((ledger.sources ?? []).map(({id}) => id));
  const superseded = Array.isArray(cache.superseded_results)
    ? cache.superseded_results
    : [];
  const authorities = new Map(
    (ledger.superseded_transports ?? []).map((authority) => [
      authorityKey(authority.transport_locator, authority.source_ids),
      authority,
    ]),
  );
  const observedAuthorityKeys = new Set();
  const archivedByTransport = new Map();
  for (const archive of superseded) {
    const result = archive?.result;
    const locator = result?.transport_locator ?? '<invalid>';
    const sourceIds = Array.isArray(result?.source_ids)
      ? result.source_ids.filter((value) => typeof value === 'string')
      : [];
    const prefix = (message) =>
      errors.push(formatDiagnostic(locator, sourceIds, `superseded result ${message}`));
    if (
      !isRecord(archive) ||
      typeof archive.superseded_at !== 'string' ||
      Number.isNaN(Date.parse(archive.superseded_at)) ||
      typeof archive.reason !== 'string' ||
      archive.reason.length === 0 ||
      typeof archive.replacement_transport_locator !== 'string' ||
      !archive.replacement_transport_locator.startsWith('https://') ||
      !isRecord(result)
    ) {
      prefix('archive metadata and result are required');
      continue;
    }
    if (
      transportLocator(archive.replacement_transport_locator) !==
      archive.replacement_transport_locator
    ) {
      prefix('replacement_transport_locator must omit fragments');
    }
    if (
      typeof result.transport_locator !== 'string' ||
      !result.transport_locator.startsWith('https://') ||
      transportLocator(result.transport_locator) !== result.transport_locator
    ) {
      prefix('must have a canonical HTTPS transport_locator');
      continue;
    }
    if (expected.has(result.transport_locator)) {
      prefix('transport overlaps current ledger target');
    }
    const count = archivedByTransport.get(result.transport_locator) ?? 0;
    archivedByTransport.set(result.transport_locator, count + 1);
    if (count > 0) prefix('is duplicated');
    if (
      !Array.isArray(result.source_ids) ||
      result.source_ids.length === 0 ||
      !result.source_ids.every((value) => typeof value === 'string') ||
      new Set(result.source_ids).size !== result.source_ids.length ||
      JSON.stringify(result.source_ids) !==
        JSON.stringify(sortedStrings(result.source_ids))
    ) {
      prefix('source_ids must be unique sorted strings');
    } else if (result.source_ids.some((id) => !ledgerSourceIds.has(id))) {
      prefix('source_ids are orphaned from the ledger');
    }
    if (!validAttempt(result.last_attempt, {full: true})) {
      prefix('last_attempt is invalid');
    } else if (
      Date.parse(archive.superseded_at) < Date.parse(result.last_attempt.at)
    ) {
      prefix('superseded_at cannot precede archived last_attempt');
    }
    if (
      result.last_success !== null &&
      !validAttempt(result.last_success, {success: true})
    ) {
      prefix('last_success is invalid');
    }
    if (
      !Array.isArray(result.attempt_history) ||
      result.attempt_history.length === 0 ||
      !result.attempt_history.every((item) => validAttempt(item))
    ) {
      prefix('attempt_history must contain valid attempts');
    } else {
      if (!sameObservation(result.attempt_history.at(-1), result.last_attempt)) {
        prefix('attempt_history must end with last_attempt');
      }
      if (
        result.attempt_history.some(
          (item, index, values) =>
            index > 0 && Date.parse(item.at) < Date.parse(values[index - 1].at),
        )
      ) {
        prefix('attempt_history must be chronological');
      }
      if (
        validAttempt(result.last_success, {success: true}) &&
        !result.attempt_history.some((item) =>
          sameObservation(item, result.last_success),
        )
      ) {
        prefix('last_success must be preserved in attempt_history');
      }
    }
    if (!reviewStatuses.has(result.review_status)) {
      prefix('review_status is invalid');
    }
    if (
      Array.isArray(result.merge_conflicts) &&
      result.merge_conflicts.length > 0
    ) {
      prefix(
        `has conflicting duplicate result fields ${result.merge_conflicts.join(', ')}`,
      );
    }
    const key = authorityKey(result.transport_locator, result.source_ids ?? []);
    const authority = authorities.get(key);
    if (!authority) {
      prefix('has no source-ledger migration authority');
    } else {
      observedAuthorityKeys.add(key);
      if (
        archive.superseded_at !== authority.superseded_at ||
        archive.replacement_transport_locator !==
          authority.replacement_transport_locator ||
        archive.reason !== authority.reason
      ) {
        prefix('metadata does not match source-ledger migration authority');
      }
      if (normalizedResultSha256(result) !== authority.result_sha256) {
        prefix('result_sha256 does not match source-ledger migration authority');
      }
    }
  }
  for (const [key, authority] of authorities) {
    if (observedAuthorityKeys.has(key)) continue;
    errors.push(
      formatDiagnostic(
        authority.transport_locator,
        authority.source_ids,
        'required superseded archive is missing',
      ),
    );
  }
  const archiveByTransport = new Map(
    superseded
      .filter((archive) => isRecord(archive?.result))
      .map((archive) => [archive.result.transport_locator, archive]),
  );
  for (const archive of superseded) {
    if (!isRecord(archive) || !isRecord(archive.result)) continue;
    const archivedSourceKey = sourceIdsKey(archive.result.source_ids ?? []);
    const visited = new Set([archive.result.transport_locator]);
    let replacement = archive.replacement_transport_locator;
    let validChain = false;
    while (typeof replacement === 'string' && !visited.has(replacement)) {
      visited.add(replacement);
      const replacementTarget = expected.get(replacement);
      if (replacementTarget) {
        validChain = sourceIdsKey(replacementTarget.source_ids) === archivedSourceKey;
        break;
      }
      const replacementArchive = archiveByTransport.get(replacement);
      if (
        !replacementArchive ||
        sourceIdsKey(replacementArchive.result.source_ids ?? []) !==
          archivedSourceKey
      ) {
        break;
      }
      replacement = replacementArchive.replacement_transport_locator;
    }
    if (!validChain) {
      errors.push(
        formatDiagnostic(
          archive.result.transport_locator ?? '<invalid>',
          archive.result.source_ids ?? [],
          'superseded result replacement chain must terminate at a current target for the same exact source_ids',
        ),
      );
    }
  }
  const byTransport = new Map();
  for (const entry of cache.results) {
    const locator =
      isRecord(entry) && typeof entry.transport_locator === 'string'
        ? entry.transport_locator
        : '<invalid>';
    const sourceIds =
      isRecord(entry) && Array.isArray(entry.source_ids)
        ? entry.source_ids.filter((value) => typeof value === 'string')
        : [];
    const prefix = (message) =>
      errors.push(formatDiagnostic(locator, sourceIds, message));
    if (
      !isRecord(entry) ||
      typeof entry.transport_locator !== 'string' ||
      !entry.transport_locator.startsWith('https://')
    ) {
      prefix('result must have an HTTPS transport_locator');
      continue;
    }
    const canonical = transportLocator(entry.transport_locator);
    if (canonical !== entry.transport_locator) {
      prefix('transport_locator must omit fragments');
    }
    const count = byTransport.get(entry.transport_locator) ?? 0;
    byTransport.set(entry.transport_locator, count + 1);
    if (count > 0) {
      prefix('duplicate result');
    }
    const target = expected.get(entry.transport_locator);
    if (!target) {
      prefix('orphan result');
    }
    if (
      !Array.isArray(entry.source_ids) ||
      !entry.source_ids.every((value) => typeof value === 'string') ||
      new Set(entry.source_ids).size !== entry.source_ids.length ||
      JSON.stringify(entry.source_ids) !==
        JSON.stringify(sortedStrings(entry.source_ids))
    ) {
      prefix('source_ids must be unique sorted strings');
    } else if (
      target &&
      JSON.stringify(entry.source_ids) !== JSON.stringify(target.source_ids)
    ) {
      prefix(
        `source_ids do not match ledger grouping ${JSON.stringify(
          target.source_ids,
        )}`,
      );
    }
    if (!validAttempt(entry.last_attempt, {full: true})) {
      prefix('last_attempt is invalid');
    }
    if (
      entry.last_success !== null &&
      !validAttempt(entry.last_success, {success: true})
    ) {
      prefix('last_success is invalid');
    }
    if (
      validAttempt(entry.last_attempt, {full: true}) &&
      validAttempt(entry.last_success, {success: true}) &&
      Date.parse(entry.last_success.at) > Date.parse(entry.last_attempt.at)
    ) {
      prefix('last_success cannot be newer than last_attempt');
    }
    if (
      target &&
      validAttempt(entry.last_success, {success: true}) &&
      !acceptedForPolicy(target.link_policy, entry.last_success)
    ) {
      prefix(
        `last_success outcome ${JSON.stringify(
          entry.last_success.outcome,
        )} is incompatible with ${target.link_policy} policy`,
      );
    }
    if (
      target &&
      validAttempt(entry.last_attempt, {full: true}) &&
      acceptedForPolicy(target.link_policy, entry.last_attempt) &&
      !sameObservation(entry.last_attempt, entry.last_success)
    ) {
      prefix('policy-accepted last_attempt must equal last_success');
    }
    if (
      !Array.isArray(entry.attempt_history) ||
      entry.attempt_history.length === 0 ||
      !entry.attempt_history.every((item) => validAttempt(item))
    ) {
      prefix('attempt_history must contain valid attempts');
    } else if (
      validAttempt(entry.last_attempt, {full: true}) &&
      !sameObservation(entry.attempt_history.at(-1), entry.last_attempt)
    ) {
      prefix('attempt_history must end with last_attempt');
    }
    if (
      Array.isArray(entry.attempt_history) &&
      entry.attempt_history.every((item) => validAttempt(item)) &&
      entry.attempt_history.some(
        (item, index, values) =>
          index > 0 && Date.parse(item.at) < Date.parse(values[index - 1].at),
      )
    ) {
      prefix('attempt_history must be chronological');
    }
    if (
      validAttempt(entry.last_success, {success: true}) &&
      Array.isArray(entry.attempt_history) &&
      !entry.attempt_history.some((item) =>
        sameObservation(item, entry.last_success),
      )
    ) {
      prefix('last_success must be preserved in attempt_history');
    }
    if (!reviewStatuses.has(entry.review_status)) {
      prefix('review_status is invalid');
    }
    if (
      Array.isArray(entry.merge_conflicts) &&
      entry.merge_conflicts.length > 0
    ) {
      prefix(
        `has conflicting duplicate result fields ${entry.merge_conflicts.join(', ')}`,
      );
    }
  }
  for (const target of targets) {
    if (!byTransport.has(target.transport_locator)) {
      errors.push(
        formatDiagnostic(
          target.transport_locator,
          target.source_ids,
          'missing result',
        ),
      );
    }
  }
  const latestAttemptAt = cache.results
    .map((entry) => entry?.last_attempt?.at)
    .filter(
      (value) =>
        typeof value === 'string' && !Number.isNaN(Date.parse(value)),
    )
    .reduce(
      (latest, value) =>
        Date.parse(value) > Date.parse(latest) ? value : latest,
      cache.generated_at,
    );
  if (Date.parse(cache.generated_at) < Date.parse(latestAttemptAt)) {
    errors.push(
      'data/source-link-health.json: generated_at must not be older than latest last_attempt.at',
    );
  }
  return {errors: errors.sort((left, right) => left.localeCompare(right, 'en'))};
}

function acceptedForPolicy(policy, attempt) {
  if (policy === 'auth-required') {
    return (
      attempt.outcome === 'auth-required' &&
      ((attempt.http_status === 401 || attempt.http_status === 403) ||
        (attempt.http_status >= 200 &&
          attempt.http_status <= 299 &&
          attempt.login_wall_detected === true))
    );
  }
  if (policy === 'retired') {
    return (
      attempt.outcome === 'retired' &&
      (attempt.http_status === 404 || attempt.http_status === 410)
    );
  }
  return (
    attempt.outcome === 'healthy' &&
    Number.isInteger(attempt.http_status) &&
    attempt.http_status >= 200 &&
    attempt.http_status <= 299 &&
    attempt.login_wall_detected !== true
  );
}

export function evaluateLinkHealthVerdict(
  ledger,
  cache,
  {now = new Date()} = {},
) {
  const failures = [];
  const results = new Map(
    Array.isArray(cache?.results)
      ? cache.results.map((entry) => [entry.transport_locator, entry])
      : [],
  );
  for (const target of collectTargets(ledger)) {
    const entry = results.get(target.transport_locator);
    if (!entry || !validAttempt(entry.last_attempt)) {
      continue;
    }
    const fail = (message) =>
      failures.push(
        formatDiagnostic(target.transport_locator, target.source_ids, message),
      );
    if (entry.review_status === 'stale') {
      fail('review status is stale');
    }
    const expectedReviewStatus = acceptedForPolicy(
      target.link_policy,
      entry.last_attempt,
    )
      ? entry.last_attempt.outcome
      : 'stale';
    if (entry.review_status !== expectedReviewStatus) {
      fail(
        `review status ${JSON.stringify(
          entry.review_status,
        )} must be ${JSON.stringify(expectedReviewStatus)}`,
      );
    }
    if (!acceptedForPolicy(target.link_policy, entry.last_attempt)) {
      fail(
        `outcome ${JSON.stringify(
          entry.last_attempt.outcome,
        )} is incompatible with ${target.link_policy} policy`,
      );
    }
    if (
      entry.last_attempt.final_transport_locator &&
      transportLocator(entry.last_attempt.final_transport_locator) !==
        transportLocator(target.expected_final_transport_locator)
    ) {
      fail(
        `unapproved redirect to ${JSON.stringify(
          entry.last_attempt.final_transport_locator,
        )}`,
      );
    }
    if (
      !entry.last_success ||
      now.getTime() - Date.parse(entry.last_success.at) > maxSuccessAgeMs
    ) {
      fail('last success is missing or stale beyond 120 days');
    }
  }
  return {
    failures: failures.sort((left, right) => left.localeCompare(right, 'en')),
  };
}

function retryDelay(response, now) {
  const value = response.headers.get('retry-after');
  if (!value) return transientRetryDelayMs;
  const seconds = Number(value);
  const milliseconds = Number.isFinite(seconds)
    ? seconds * 1000
    : Date.parse(value) - now.getTime();
  if (!Number.isFinite(milliseconds)) return transientRetryDelayMs;
  return Math.min(5000, Math.max(0, milliseconds));
}

function isTransientRequestError(error) {
  if (!(error instanceof Error)) return false;
  if (error.name === 'TimeoutError' || error.name === 'AbortError') return true;
  const cause =
    error.cause instanceof Error ||
    (typeof error.cause === 'object' && error.cause !== null)
      ? error.cause
      : null;
  const detail = [
    error.message,
    cause?.message,
    cause?.code,
  ].filter(Boolean).join(' ');
  return /fetch failed|network|timed? ?out|socket|econnreset|econnrefused|etimedout|eai_again/i.test(
    detail,
  );
}

async function requestWithRetries(url, method, options) {
  let response;
  for (let retry = 0; retry <= 2; retry += 1) {
    try {
      response = await options.fetchImpl(url, {
        method,
        redirect: 'manual',
        headers:
          method === 'GET'
            ? {'Range': 'bytes=0-65535', 'User-Agent': userAgent}
            : {'User-Agent': userAgent},
        signal: AbortSignal.timeout(options.timeoutMs),
      });
      if (
        retry === 2 ||
        !transientResponseStatuses.has(response.status)
      ) {
        return response;
      }
      await options.sleep(retryDelay(response, options.now));
    } catch (error) {
      if (retry === 2 || !isTransientRequestError(error)) {
        throw error;
      }
      await options.sleep(transientRetryDelayMs);
    }
  }
  return response;
}

async function requestFollowingRedirects(startUrl, method, options) {
  let current = transportLocator(startUrl);
  const redirects = [];
  const visited = new Set([current]);
  for (let hop = 0; ; hop += 1) {
    const response = await requestWithRetries(current, method, options);
    if (!redirectStatuses.has(response.status)) {
      return {response, finalUrl: current, redirects};
    }
    const location = response.headers.get('location');
    if (!location) {
      throw new Error(`redirect ${response.status} has no Location`);
    }
    if (hop >= 5) {
      throw new Error('redirect limit exceeded');
    }
    const next = transportLocator(new URL(location, current).href);
    if (!next.startsWith('https://')) {
      throw new Error(`HTTPS downgrade rejected: ${next}`);
    }
    if (visited.has(next)) {
      throw new Error(`redirect loop detected: ${next}`);
    }
    redirects.push({status: response.status, from: current, to: next});
    visited.add(next);
    current = next;
  }
}

function loginWall(url, html) {
  const path = new URL(url).pathname.toLowerCase();
  const sourceOrAssetPath =
    /\.(?:c|cc|cpp|cs|css|go|h|hpp|java|js|jsx|json|kt|md|mjs|php|py|rb|rs|sh|swift|ts|tsx|txt|xml|ya?ml)$/i.test(
      path,
    );
  return (
    (!sourceOrAssetPath &&
      /(?:^|[/_-])(login|signin|sign-in|auth)(?:[/_.-]|$)/.test(path)) ||
    /<input\b[^>]*\btype\s*=\s*["']?password\b/i.test(html) ||
    /<form\b[^>]*(?:action|id|class|name)\s*=\s*["'][^"']*(?:login|signin|sign-in|auth)[^"']*["']/i.test(
      html,
    ) ||
    /<(?:h1|h2|title)\b[^>]*>\s*(?:sign[\s-]*in|log[\s-]*in)\b/i.test(
      html,
    ) ||
    /(?:access denied|authentication required)[\s\S]{0,300}(?:sign[\s-]*in|required login)/i.test(
      html,
    )
  );
}

async function readBodyPrefix(response, maximumBytes = 65536) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (size < maximumBytes) {
      const {done, value} = await reader.read();
      if (done) break;
      const remaining = maximumBytes - size;
      chunks.push(value.subarray(0, remaining));
      size += Math.min(value.byteLength, remaining);
      if (value.byteLength > remaining) break;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function clearlyNonHtmlAsset(url, contentType) {
  if (!contentType) return false;
  const type = contentType.split(';', 1)[0].trim().toLowerCase();
  const pathname = new URL(url).pathname.toLowerCase();
  const extension = pathname.match(/\.([a-z0-9]+)$/)?.[1];
  if (!extension) return false;
  const expectedTypes = {
    pdf: ['application/pdf'],
    json: ['application/json', 'application/ld+json'],
    png: ['image/png'],
    jpg: ['image/jpeg'],
    jpeg: ['image/jpeg'],
    gif: ['image/gif'],
    svg: ['image/svg+xml'],
    webp: ['image/webp'],
    ico: ['image/x-icon', 'image/vnd.microsoft.icon'],
    mp3: ['audio/mpeg'],
    mp4: ['video/mp4'],
    webm: ['audio/webm', 'video/webm'],
    wasm: ['application/wasm'],
    zip: ['application/zip'],
    gz: ['application/gzip'],
    tgz: ['application/gzip'],
  };
  return expectedTypes[extension]?.includes(type) ?? false;
}

function compactAttempt(attempt) {
  const copy = {...attempt};
  delete copy.redirects;
  delete copy.error;
  return copy;
}

export async function checkSourceLink(
  target,
  {
    previousResult,
    fetchImpl = fetch,
    sleep = async (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)),
    now = new Date(),
    timeoutMs = 10000,
  } = {},
) {
  const requestOptions = {fetchImpl, sleep, now, timeoutMs};
  let observation;
  let usedGet = false;
  try {
    observation = await requestFollowingRedirects(
      target.transport_locator,
      'HEAD',
      requestOptions,
    );
    const headStatus = observation.response.status;
    const activeHeadFailure =
      target.link_policy !== 'retired' &&
      (headStatus === 404 || (headStatus >= 500 && headStatus <= 599));
    if ([403, 405].includes(headStatus) || activeHeadFailure) {
      usedGet = true;
      observation = await requestFollowingRedirects(
        target.transport_locator,
        'GET',
        requestOptions,
      );
    } else {
      const type = observation.response.headers
        .get('content-type')
        ?.toLowerCase();
      if (
        observation.response.status >= 200 &&
        observation.response.status <= 299 &&
        !clearlyNonHtmlAsset(observation.finalUrl, type)
      ) {
        usedGet = true;
        observation = await requestFollowingRedirects(
          target.transport_locator,
          'GET',
          requestOptions,
        );
      }
    }
    const {response, finalUrl, redirects} = observation;
    let html = '';
    if (
      usedGet &&
      response.status >= 200 &&
      response.status <= 299
    ) {
      html = await readBodyPrefix(response);
    }
    const login_wall_detected =
      usedGet &&
      response.status >= 200 &&
      response.status <= 299 &&
      loginWall(finalUrl, html);
    let outcome;
    let error = null;
    if (
      target.link_policy === 'auth-required' &&
      ([401, 403].includes(response.status) || login_wall_detected)
    ) {
      outcome = 'auth-required';
    } else if (
      target.link_policy === 'retired' &&
      [404, 410].includes(response.status)
    ) {
      outcome = 'retired';
    } else if (
      response.status >= 200 &&
      response.status <= 299 &&
      !login_wall_detected
    ) {
      outcome =
        transportLocator(finalUrl) ===
        transportLocator(target.expected_final_transport_locator)
          ? 'healthy'
          : 'redirect-changed';
      if (outcome === 'redirect-changed') {
        error = `final transport changed to ${finalUrl}`;
      }
    } else {
      outcome = 'error';
      error = login_wall_detected
        ? 'unexpected login wall'
        : `unexpected HTTP ${response.status}`;
    }
    const last_attempt = {
      at: now.toISOString(),
      outcome,
      final_transport_locator: finalUrl,
      http_status: response.status,
      login_wall_detected,
      redirects,
      ...(error ? {error} : {}),
    };
    return combineResult(target, previousResult, last_attempt);
  } catch (error) {
    return combineResult(target, previousResult, {
      at: now.toISOString(),
      outcome: 'error',
      final_transport_locator: null,
      http_status: null,
      login_wall_detected: false,
      redirects: observation?.redirects ?? [],
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function combineResult(target, previousResult, lastAttempt) {
  const success = acceptedForPolicy(target.link_policy, lastAttempt);
  const previousSuccess = previousResult?.last_success ?? null;
  const last_success = success ? compactAttempt(lastAttempt) : previousSuccess;
  const attempt_history = [
    ...(previousResult?.attempt_history ?? []),
    compactAttempt(lastAttempt),
  ];
  const result = {
    transport_locator: target.transport_locator,
    source_ids: target.source_ids,
    last_attempt: lastAttempt,
    last_success,
    attempt_history,
    review_status: success ? lastAttempt.outcome : 'stale',
  };
  if (
    previousSuccess?.final_transport_locator &&
    lastAttempt.final_transport_locator &&
    transportLocator(previousSuccess.final_transport_locator) !==
      transportLocator(lastAttempt.final_transport_locator)
  ) {
    result.change_note = `final transport differs from previous success ${previousSuccess.final_transport_locator}`;
  }
  return result;
}

async function runScheduled(items, globalLimit, perOriginLimit, operation) {
  const pending = [...items];
  const activeByOrigin = new Map();
  let active = 0;
  return new Promise((resolve, reject) => {
    const results = [];
    const schedule = () => {
      if (pending.length === 0 && active === 0) {
        resolve(results);
        return;
      }
      let advanced = true;
      while (active < globalLimit && advanced) {
        advanced = false;
        const index = pending.findIndex((item) => {
          const origin = new URL(item.transport_locator).origin;
          return (activeByOrigin.get(origin) ?? 0) < perOriginLimit;
        });
        if (index === -1) break;
        const [item] = pending.splice(index, 1);
        const origin = new URL(item.transport_locator).origin;
        active += 1;
        activeByOrigin.set(origin, (activeByOrigin.get(origin) ?? 0) + 1);
        advanced = true;
        operation(item)
          .then((value) => results.push(value), reject)
          .finally(() => {
            active -= 1;
            activeByOrigin.set(origin, activeByOrigin.get(origin) - 1);
            schedule();
          });
      }
    };
    schedule();
  });
}

export async function checkLiveLinks(
  ledger,
  {
    previousCache,
    fetchImpl = fetch,
    sleep,
    now = new Date(),
    timeoutMs = 10000,
    globalConcurrency = 6,
    perOriginConcurrency = 2,
  } = {},
) {
  const targets = collectTargets(ledger);
  const checked = await checkTargets(ledger, targets, {
    previousCache,
    fetchImpl,
    sleep,
    now,
    timeoutMs,
    globalConcurrency,
    perOriginConcurrency,
  });
  const structure = validateLinkHealthCacheStructure(ledger, checked.cache);
  return {
    cache: checked.cache,
    errors: [...structure.errors, ...checked.errors].sort((left, right) =>
      left.localeCompare(right, 'en'),
    ),
  };
}

async function checkTargets(
  ledger,
  targets,
  {
    previousCache,
    fetchImpl,
    sleep,
    now,
    timeoutMs,
    globalConcurrency,
    perOriginConcurrency,
  },
) {
  const previous = new Map(
    (previousCache?.results ?? []).map((entry) => [
      entry.transport_locator,
      entry,
    ]),
  );
  const ambiguous = ambiguousMigrationResults(
    ledger,
    targets,
    [...previous.values()],
  );
  const ambiguousTransports = new Set(
    ambiguous.map(({transport_locator}) => transport_locator),
  );
  const results = await runScheduled(
    targets.filter(
      ({transport_locator: locator}) => !ambiguousTransports.has(locator),
    ),
    globalConcurrency,
    perOriginConcurrency,
    (target) =>
      checkSourceLink(target, {
        previousResult: previous.get(target.transport_locator),
        fetchImpl,
        sleep,
        now,
        timeoutMs,
      }),
  );
  results.push(...ambiguous.map((result) => structuredClone(result)));
  results.sort((left, right) =>
    left.transport_locator.localeCompare(right.transport_locator, 'en'),
  );
  const cache = {
    schema_version: 1,
    generated_at: now.toISOString(),
    results,
    superseded_results: collectSupersededResults(
      ledger,
      previousCache ? [previousCache] : [],
      now,
    ),
  };
  return {
    cache,
    errors: [
      ...evaluateLinkHealthVerdict(ledger, cache, {now}).failures,
      ...ambiguous.map((result) =>
        formatDiagnostic(
          result.transport_locator,
          result.source_ids,
          'ambiguous transport migration requires source-ledger authority',
        ),
      ),
    ],
  };
}

export async function checkLiveLinkBatch(
  ledger,
  {
    batchIndex = 0,
    batchSize = 30,
    previousCache,
    fetchImpl = fetch,
    sleep,
    now = new Date(),
    timeoutMs = 10000,
    globalConcurrency = 6,
    perOriginConcurrency = 2,
  } = {},
) {
  if (
    !Number.isInteger(batchIndex) ||
    batchIndex < 0 ||
    !Number.isInteger(batchSize) ||
    batchSize < 1
  ) {
    throw new TypeError('batchIndex must be >= 0 and batchSize must be >= 1');
  }
  const allTargets = collectTargets(ledger);
  const start = batchIndex * batchSize;
  const targets = allTargets.slice(start, start + batchSize);
  const checked = await checkTargets(ledger, targets, {
    previousCache,
    fetchImpl,
    sleep,
    now,
    timeoutMs,
    globalConcurrency,
    perOriginConcurrency,
  });
  const complete = start + targets.length >= allTargets.length;
  return {
    ...checked,
    batchIndex,
    batchSize,
    nextBatchIndex: complete ? null : batchIndex + 1,
    complete,
    totalTargets: allTargets.length,
  };
}

export function mergeLinkHealthCaches(
  ledger,
  caches,
  {now = new Date()} = {},
) {
  if (!Array.isArray(caches) || caches.length === 0) {
    throw new TypeError('at least one link-health cache is required');
  }
  const targets = collectTargets(ledger);
  const expectedTransports = new Set(
    targets.map(({transport_locator}) => transport_locator),
  );
  const latest = new Map();
  for (const cache of caches) {
    for (const result of cache?.results ?? []) {
      if (
        !expectedTransports.has(result.transport_locator) &&
        ambiguousMigrationResults(ledger, targets, [result]).length === 0
      ) {
        continue;
      }
      const current = latest.get(result.transport_locator);
      latest.set(
        result.transport_locator,
        mergeResultObservations(current, result),
      );
    }
  }
  const cache = {
    schema_version: 1,
    generated_at: now.toISOString(),
    results: [...latest.values()].sort((left, right) =>
      left.transport_locator.localeCompare(right.transport_locator, 'en'),
    ),
    superseded_results: collectSupersededResults(ledger, caches, now),
  };
  const structure = validateLinkHealthCacheStructure(ledger, cache);
  const verdict =
    structure.errors.length === 0
      ? evaluateLinkHealthVerdict(ledger, cache, {now})
      : {failures: []};
  const ambiguous = ambiguousMigrationResults(
    ledger,
    targets,
    [...latest.values()],
  );
  return {
    cache,
    errors: [
      ...structure.errors,
      ...verdict.failures,
      ...ambiguous.map((result) =>
        formatDiagnostic(
          result.transport_locator,
          result.source_ids,
          'ambiguous transport migration requires source-ledger authority',
        ),
      ),
    ],
  };
}

export function mergePublicLedgerHealth(governedLedger, cache) {
  const {
    superseded_transports: _supersededTransports,
    ...publicLedger
  } = governedLedger;
  const targets = buildLinkTargets(governedLedger);
  const results = new Map(
    cache.results.map((entry) => [entry.transport_locator, entry]),
  );
  const checksBySource = new Map();
  for (const target of targets) {
    const result = results.get(target.transport_locator);
    if (!result) continue;
    const check = {
      transport_locator: target.transport_locator,
      status: result.review_status,
      last_attempt_at: result.last_attempt.at,
      last_success_at: result.last_success?.at ?? null,
      http_status: result.last_attempt.http_status,
      final_transport_locator: result.last_attempt.final_transport_locator,
    };
    for (const id of target.source_ids) {
      const current = checksBySource.get(id) ?? [];
      current.push(check);
      checksBySource.set(id, current);
    }
  }
  const priority = {
    healthy: 0,
    retired: 1,
    'auth-required': 2,
    stale: 3,
  };
  return {
    ...publicLedger,
    sources: governedLedger.sources.map((source) => {
      const health_checks = checksBySource.get(source.id) ?? [];
      const health_summary =
        health_checks
          .map(({status}) => status)
          .sort((left, right) => priority[right] - priority[left])[0] ??
        'healthy';
      return {...source, health_summary, health_checks};
    }),
  };
}

async function atomicWrite(filePath, value) {
  await mkdir(path.dirname(filePath), {recursive: true});
  const temporary = `${filePath}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
    await rename(temporary, filePath);
  } catch (error) {
    await rm(temporary, {force: true});
    throw error;
  }
}

function usage() {
  return 'Usage: node scripts/source-link-health.mjs (--check-cache | --live [--output <path>] | --refresh)';
}

function parseArgs(args) {
  const modes = args.filter((arg) =>
    ['--check-cache', '--live', '--refresh'].includes(arg),
  );
  const outputIndex = args.indexOf('--output');
  if (
    modes.length !== 1 ||
    args.some(
      (arg, index) =>
        !['--check-cache', '--live', '--refresh', '--output'].includes(arg) &&
        index !== outputIndex + 1,
    ) ||
    (outputIndex !== -1 &&
      (modes[0] !== '--live' ||
        outputIndex + 1 >= args.length ||
        args[outputIndex + 1].startsWith('--'))) ||
    (outputIndex === -1 && args.length !== 1) ||
    (outputIndex !== -1 && args.length !== 3)
  ) {
    throw new Error(usage());
  }
  return {
    mode: modes[0],
    output: outputIndex === -1 ? null : args[outputIndex + 1],
  };
}

async function runCli() {
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }
  const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const ledger = JSON.parse(
    await readFile(path.join(root, 'data/source-ledger.json'), 'utf8'),
  );
  const cachePath = path.join(root, 'data/source-link-health.json');
  const previousCache = JSON.parse(await readFile(cachePath, 'utf8'));
  if (parsed.mode === '--check-cache') {
    const structure = validateLinkHealthCacheStructure(ledger, previousCache);
    const verdict =
      structure.errors.length === 0
        ? evaluateLinkHealthVerdict(ledger, previousCache)
        : {failures: []};
    const errors = [...structure.errors, ...verdict.failures];
    if (errors.length > 0) {
      console.error(errors.join('\n'));
      process.exitCode = 1;
    }
    return;
  }
  const checked = await checkLiveLinks(ledger, {previousCache});
  if (parsed.mode === '--refresh') {
    await atomicWrite(cachePath, checked.cache);
  } else if (parsed.output) {
    await atomicWrite(path.resolve(parsed.output), checked.cache);
  }
  if (checked.errors.length > 0) {
    console.error(checked.errors.join('\n'));
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await runCli();
}
