import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {readContentDocuments} from '../scripts/content-metadata.mjs';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const documents = await readContentDocuments(contentRoot);
const document = documents.find(({file}) => file === 'styles/sty-00-comparison-framework.mdx');
const [ledger, linkHealth] = await Promise.all([
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/source-link-health.json', import.meta.url), 'utf8').then(JSON.parse),
]);

const expectedSources = [
  {
    id: 'src-sei-qaw-collection',
    canonical_locator: 'https://www.sei.cmu.edu/library/quality-attribute-workshop-collection/',
    transport_locator: 'https://www.sei.cmu.edu/library/quality-attribute-workshop-collection/',
    expected_final_transport_locator:
      'https://www.sei.cmu.edu/library/quality-attribute-workshop-collection/',
  },
  {
    id: 'src-sei-atam-collection',
    canonical_locator:
      'https://www.sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection/',
    transport_locator:
      'https://www.sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection/',
    expected_final_transport_locator:
      'https://www.sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection/',
  },
  {
    id: 'src-microsoft-architecture-styles',
    canonical_locator:
      'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/',
    transport_locator:
      'https://raw.githubusercontent.com/microsoftdocs/architecture-center/4fb4d75aa5ed8423caa0d6c35d40b32bbc3cc819/docs/guide/architecture-styles/index.md',
    expected_final_transport_locator:
      'https://raw.githubusercontent.com/microsoftdocs/architecture-center/4fb4d75aa5ed8423caa0d6c35d40b32bbc3cc819/docs/guide/architecture-styles/index.md',
  },
  {
    id: 'src-arc42-architecture-decisions',
    canonical_locator: 'https://docs.arc42.org/section-9/',
    transport_locator:
      'https://raw.githubusercontent.com/arc42/docs.arc42.org-site/bcbc20283a2a486305ce72e400e731a3ee30f7f4/_pages/section-9.md',
    expected_final_transport_locator:
      'https://raw.githubusercontent.com/arc42/docs.arc42.org-site/bcbc20283a2a486305ce72e400e731a3ee30f7f4/_pages/section-9.md',
  },
];

const expectedCitations = [
  {
    source_id: 'src-sei-qaw-collection',
    citation_url: 'https://www.sei.cmu.edu/library/quality-attribute-workshop-collection/',
    roles: ['method', 'learning'],
    manifest_primary: false,
  },
  {
    source_id: 'src-sei-atam-collection',
    citation_url:
      'https://www.sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection/',
    roles: ['definition', 'method', 'learning'],
    manifest_primary: true,
  },
  {
    source_id: 'src-microsoft-architecture-styles',
    citation_url:
      'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/',
    roles: ['comparison', 'definition', 'learning'],
    manifest_primary: false,
  },
  {
    source_id: 'src-arc42-architecture-decisions',
    citation_url: 'https://docs.arc42.org/section-9/',
    roles: ['method', 'learning'],
    manifest_primary: false,
  },
  {
    source_id: 'src-arc42-quality-requirements-v9',
    citation_url: 'https://docs.arc42.org/section-10/',
    roles: ['definition', 'method', 'learning'],
    manifest_primary: false,
  },
];

function observationFields({
  at,
  outcome,
  final_transport_locator,
  http_status,
  login_wall_detected,
}) {
  return {at, outcome, final_transport_locator, http_status, login_wall_detected};
}

function assertHealthyObservation(observation, transportLocator, message) {
  assert.equal(observation.outcome, 'healthy', `${message} outcome`);
  assert.equal(
    observation.final_transport_locator,
    transportLocator,
    `${message} final transport`,
  );
  assert.ok(Number.isInteger(observation.http_status), `${message} integer HTTP status`);
  assert.ok(
    observation.http_status >= 200 && observation.http_status <= 299,
    `${message} successful HTTP status`,
  );
}

test('governs five specific visible STY-00 sources', () => {
  assert.ok(document, 'STY-00 must remain published');
  const records = new Map(ledger.sources.map((source) => [source.id, source]));
  assert.deepEqual(
    expectedSources.map(({id}) => {
      const {canonical_locator, transport_locator, expected_final_transport_locator} =
        records.get(id) ?? {};
      return {id, canonical_locator, transport_locator, expected_final_transport_locator};
    }),
    expectedSources,
  );
  for (const {source_id, citation_url} of expectedCitations) {
    assert.ok(document.source.includes(`](${citation_url})`), `${source_id} visible citation`);
  }
  const review = ledger.documents['content/styles/sty-00-comparison-framework.mdx'];
  assert.equal(review.reviewed_at, '2026-08-06');
  assert.deepEqual(
    review.citations.map(({source_id, citation_url, roles, manifest_primary}) => ({
      source_id,
      citation_url,
      roles,
      manifest_primary,
    })),
    expectedCitations,
  );
});

test('keeps every new remote source in the reviewed health cache', () => {
  const expectedSourceIds = new Set(expectedSources.map(({id}) => id));
  const governedResults = linkHealth.results.filter(({source_ids}) =>
    source_ids.some((sourceId) => expectedSourceIds.has(sourceId)),
  );
  assert.equal(governedResults.length, expectedSources.length);
  const resultsByTransport = new Map(
    governedResults.map((result) => [result.transport_locator, result]),
  );
  for (const {id, transport_locator} of expectedSources) {
    const result = resultsByTransport.get(transport_locator);
    assert.ok(result, `${id} exact transport result`);
    assert.deepEqual(result.source_ids, [id], `${id} source binding`);
    assert.equal(result.review_status, 'healthy', `${id} review status`);
    assertHealthyObservation(result.last_attempt, transport_locator, `${id} last attempt`);
    assertHealthyObservation(result.last_success, transport_locator, `${id} last success`);
    assert.deepEqual(
      observationFields(result.last_success),
      observationFields(result.last_attempt),
      `${id} current healthy attempt is the latest success`,
    );
    assert.ok(result.attempt_history.length > 0, `${id} attempt history`);
    assert.deepEqual(
      observationFields(result.attempt_history.at(-1)),
      observationFields(result.last_attempt),
      `${id} history ends with the current attempt`,
    );
  }
});
