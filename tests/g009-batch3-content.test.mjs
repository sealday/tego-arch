import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {isDeepStrictEqual} from 'node:util';

import {
  validateInventoryLedgerConsistency,
  validateSourceLicenseInventory,
} from '../scripts/validate-source-license-inventory.mjs';

const [ledger, linkHealth, licenseInventory] = await Promise.all([
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/source-link-health.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../docs/source-license-inventory.md', import.meta.url), 'utf8'),
]);

const licenseScope = 'The named article/page and bibliographic facts only; prose, code, diagrams, images, marks, comments, linked works, and third-party material excluded';
const migrationPolicy = 'Facts summary and reviewed short quotation only; no adaptation or copied structure';

const expectedNewSources = new Map([
  ['src-cockburn-hexagonal-architecture-2005', {
    canonical_locator: 'https://alistair.cockburn.us/hexagonal-architecture/',
    transport_locator: 'https://alistair.cockburn.us/hexagonal-architecture/',
    query_insensitive: false,
    locator_aliases: [],
    tombstone: null,
    title: 'Hexagonal architecture the original 2005 article',
    author_or_org: 'Alistair Cockburn',
    published_at: '2005-09-04',
    registered_at: '2026-08-07',
    checked_at: '2026-08-07',
    version: 'HaT Technical Report 2005.02, version 0.9 dated 2005-09-04; page checked 2026-08-07',
    source_kind: 'paper',
    tier: 'primary',
    allowed_evidence_roles: ['comparison', 'definition', 'historical-context', 'implementation', 'learning'],
    license: 'LicenseRef-All-Rights-Reserved',
    license_scope: licenseScope,
    license_evidence_url: 'https://alistair.cockburn.us/hexagonal-architecture/',
    license_evidence_note: 'The Alistair Cockburn article at https://alistair.cockburn.us/hexagonal-architecture/ was checked on 2026-08-07; the page carries Copyright © Alistair Cockburn 2022 All Rights Reserved and exposes no reusable license for the work. Tego Arch retains attribution, a link, and original factual summary only.',
    license_family_id: 'https://alistair.cockburn.us/hexagonal-architecture/',
    license_family_grouping: 'identity',
    family_grouping_evidence_url: null,
    copyright_policy: 'facts-and-short-quotation',
    usage_boundary: 'Defines the original Ports and Adapters intent, purposeful ports, adapters, primary and secondary actors, and isolated application testing; source diagrams, code structure, and later interpretations are not copied.',
    link_policy: 'stable',
    expected_final_transport_locator: 'https://alistair.cockburn.us/hexagonal-architecture',
    expected_final_approved_at: '2026-08-07',
    expected_final_approval_note: 'Approved the 2026-08-07 live 301 normalization from the canonical trailing-slash transport to the author-hosted no-trailing-slash final transport.',
  }],
  ['src-palermo-onion-architecture-part-1', {
    canonical_locator: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    transport_locator: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    query_insensitive: false,
    locator_aliases: [],
    tombstone: null,
    title: 'The Onion Architecture : part 1',
    author_or_org: 'Jeffrey Palermo',
    published_at: '2008-07-29',
    registered_at: '2026-08-07',
    checked_at: '2026-08-07',
    version: 'Original article published 2008-07-29; page checked 2026-08-07',
    source_kind: 'engineering-blog',
    tier: 'primary',
    allowed_evidence_roles: ['comparison', 'definition', 'historical-context', 'learning'],
    license: 'LicenseRef-All-Rights-Reserved',
    license_scope: licenseScope,
    license_evidence_url: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    license_evidence_note: 'The Jeffrey Palermo article “The Onion Architecture : part 1” at https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/ was checked on 2026-08-07; the author-hosted page exposes no reusable license for this work. Tego Arch retains attribution, a link, and original factual summary only.',
    license_family_id: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    license_family_grouping: 'identity',
    family_grouping_evidence_url: null,
    copyright_policy: 'facts-and-short-quotation',
    usage_boundary: 'Defines Onion Architecture scope, inward coupling, the independent Domain Model, core-owned repository interfaces, and external infrastructure; maintenance claims remain attributed author experience.',
    link_policy: 'stable',
    expected_final_transport_locator: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    expected_final_approved_at: '2026-08-07',
    expected_final_approval_note: 'Reviewed canonical identity and current author-hosted transport on 2026-08-07.',
  }],
  ['src-palermo-onion-architecture-part-3', {
    canonical_locator: 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    transport_locator: 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    query_insensitive: false,
    locator_aliases: [],
    tombstone: null,
    title: 'The Onion Architecture : part 3',
    author_or_org: 'Jeffrey Palermo',
    published_at: '2008-08-04',
    registered_at: '2026-08-07',
    checked_at: '2026-08-07',
    version: 'Original article published 2008-08-04; page checked 2026-08-07',
    source_kind: 'engineering-blog',
    tier: 'primary',
    allowed_evidence_roles: ['comparison', 'definition', 'historical-context', 'learning'],
    license: 'LicenseRef-All-Rights-Reserved',
    license_scope: licenseScope,
    license_evidence_url: 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    license_evidence_note: 'The Jeffrey Palermo article “The Onion Architecture : part 3” at https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/ was checked on 2026-08-07; the author-hosted page exposes no reusable license for this work. Tego Arch retains attribution, a link, and original factual summary only.',
    license_family_id: 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    license_family_grouping: 'identity',
    family_grouping_evidence_url: null,
    copyright_policy: 'facts-and-short-quotation',
    usage_boundary: 'Defines the four Onion tenets and its contrast with traditional layered dependencies; C#, IoC product recommendations, source diagrams, and universal outcome claims are excluded.',
    link_policy: 'stable',
    expected_final_transport_locator: 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    expected_final_approved_at: '2026-08-07',
    expected_final_approval_note: 'Reviewed canonical identity and current author-hosted transport on 2026-08-07.',
  }],
  ['src-martin-clean-architecture-2012', {
    canonical_locator: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    transport_locator: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    query_insensitive: false,
    locator_aliases: [],
    tombstone: null,
    title: 'The Clean Architecture',
    author_or_org: 'Robert C. Martin',
    published_at: '2012-08-13',
    registered_at: '2026-08-07',
    checked_at: '2026-08-07',
    version: 'Original article published 2012-08-13; page checked 2026-08-07',
    source_kind: 'engineering-blog',
    tier: 'primary',
    allowed_evidence_roles: ['comparison', 'definition', 'historical-context', 'implementation', 'learning'],
    license: 'LicenseRef-All-Rights-Reserved',
    license_scope: licenseScope,
    license_evidence_url: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    license_evidence_note: 'The Robert C. Martin article “The Clean Architecture” at https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html was checked on 2026-08-07; the author-hosted page exposes no reusable license for this work. Tego Arch retains attribution, a link, and original factual summary only.',
    license_family_id: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    license_family_grouping: 'identity',
    family_grouping_evidence_url: null,
    copyright_policy: 'facts-and-short-quotation',
    usage_boundary: 'Defines the Dependency Rule, Entities, Use Cases, Interface Adapters, Frameworks and Drivers, boundary crossing, and simple boundary data; the source diagram and fixed four-circle layout are not copied or required.',
    link_policy: 'stable',
    expected_final_transport_locator: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    expected_final_approved_at: '2026-08-07',
    expected_final_approval_note: 'Reviewed canonical identity and current author-hosted transport on 2026-08-07.',
  }],
]);

const inventoryColumns = [
  'source_family',
  'current_urls',
  'author_or_org',
  'license_evidence_url',
  'license_evidence_note',
  'checked_at',
  'exact_license',
  'scope_exclusions',
  'migration_policy',
  'family_grouping',
  'grouping_evidence_url',
];

const expectedInventoryEntries = [...expectedNewSources.values()].map((source) => ({
  source_family: source.license_family_id,
  current_urls: [source.canonical_locator],
  author_or_org: source.author_or_org,
  license_evidence_url: source.license_evidence_url,
  license_evidence_note: source.license_evidence_note,
  checked_at: source.checked_at,
  exact_license: source.license,
  scope_exclusions: source.license_scope,
  migration_policy: migrationPolicy,
  family_grouping: source.license_family_grouping,
  grouping_evidence_url: 'not-applicable',
}));

function selectFields(record, expected) {
  return Object.fromEntries(Object.keys(expected).map((field) => [field, record?.[field]]));
}

function sourceContractErrors(sources) {
  const records = new Map(sources.map((source) => [source.id, source]));
  const errors = [];
  for (const [id, expected] of expectedNewSources) {
    const record = records.get(id);
    if (!record) {
      errors.push(`${id}: missing record`);
      continue;
    }
    for (const [field, value] of Object.entries(expected)) {
      if (isDeepStrictEqual(record[field], value)) continue;
      errors.push(`${id}: ${field}`);
    }
  }
  return errors;
}

function inventoryTable(entries) {
  const rows = entries.map((entry) => inventoryColumns.map((column) =>
    column === 'current_urls' ? entry.current_urls.join('<br>') : entry[column]));
  return [
    `| ${inventoryColumns.join(' | ')} |`,
    `| ${inventoryColumns.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

test('governs the four original STY-02 sources with complete exact records', () => {
  const records = new Map(ledger.sources.map((source) => [source.id, source]));
  for (const [id, expected] of expectedNewSources) {
    assert.deepEqual(selectFields(records.get(id), expected), expected, id);
  }
});

test('parses and matches all eleven inventory columns against ledger authority', () => {
  const inventory = validateSourceLicenseInventory(licenseInventory, []);
  const entries = new Map(inventory.entries.map((entry) => [entry.source_family, entry]));
  for (const expected of expectedInventoryEntries) {
    assert.deepEqual(selectFields(entries.get(expected.source_family), expected), expected);
  }

  const focusedInventory = validateSourceLicenseInventory(
    inventoryTable(expectedInventoryEntries),
    expectedInventoryEntries.flatMap(({current_urls}) => current_urls),
  );
  assert.deepEqual(focusedInventory.errors, []);
  assert.deepEqual(
    validateInventoryLedgerConsistency(
      focusedInventory.entries,
      ledger.sources,
      ledger.documents,
    ).errors,
    [],
  );
});

test('rejects copied or non-canonical ARR evidence notes', () => {
  const copied = structuredClone(expectedInventoryEntries);
  copied[2].license_evidence_note = copied[1].license_evidence_note;
  const copiedResult = validateSourceLicenseInventory(
    inventoryTable(copied),
    copied.flatMap(({current_urls}) => current_urls),
  );
  assert.match(copiedResult.errors.join('\n'), /ARR evidence note.*reused|ARR evidence note.*evidence URL/iu);

  const vague = structuredClone(expectedInventoryEntries);
  vague[0].license_evidence_note = 'A unique but non-canonical note about an unavailable reuse license.';
  const vagueResult = validateSourceLicenseInventory(
    inventoryTable(vague),
    vague.flatMap(({current_urls}) => current_urls),
  );
  assert.match(vagueResult.errors.join('\n'), /ARR evidence note.*author/iu);
  assert.match(vagueResult.errors.join('\n'), /ARR evidence note.*evidence URL/iu);
});

test('detects inventory scope drift from authoritative ledger records', () => {
  const drifted = structuredClone(expectedInventoryEntries);
  drifted[0].scope_exclusions = 'The named page only';
  const result = validateInventoryLedgerConsistency(drifted, ledger.sources, ledger.documents);
  assert.match(result.errors.join('\n'), /field "license_scope" differs/iu);
});

test('detects controlled evidence-role and usage-boundary mutations', () => {
  const roleMutation = structuredClone(ledger.sources);
  roleMutation.find(({id}) => id === 'src-palermo-onion-architecture-part-1')
    .allowed_evidence_roles = ['definition', 'historical-context', 'learning'];
  assert.match(sourceContractErrors(roleMutation).join('\n'), /allowed_evidence_roles/u);

  const boundaryMutation = structuredClone(ledger.sources);
  boundaryMutation.find(({id}) => id === 'src-martin-clean-architecture-2012')
    .usage_boundary = 'Generic architecture summary.';
  assert.match(sourceContractErrors(boundaryMutation).join('\n'), /usage_boundary/u);
});

test('bounds the reused AWS source for STY-01 comparison and STY-02 implementation context', () => {
  const record = ledger.sources.find(({id}) => id === 'src-aws-hexagonal-layered-overview');
  assert.equal(record?.canonical_locator, 'https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/overview.html');
  assert.deepEqual(record.allowed_evidence_roles, ['comparison', 'definition', 'implementation', 'learning']);
  assert.match(record.usage_boundary, /STY-01/u);
  assert.match(record.usage_boundary, /STY-02/u);
  assert.match(record.usage_boundary, /AWS-specific/u);
});

test('keeps every new STY-02 transport in the reviewed health cache', () => {
  const results = new Map(linkHealth.results.flatMap((result) =>
    result.source_ids.map((sourceId) => [sourceId, result])));
  for (const id of expectedNewSources.keys()) {
    const result = results.get(id);
    assert.ok(result, `${id} health result`);
    assert.equal(result.last_attempt.outcome, 'healthy', `${id} current transport`);
    assert.equal(result.review_status, 'healthy', `${id} review status`);
  }
});
