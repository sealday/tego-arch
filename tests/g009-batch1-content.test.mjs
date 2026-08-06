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

const firstAttemptAt = '2026-08-06T15:21:26.049Z';
const reviewedAttemptAt = '2026-08-06T15:24:41.578Z';

function expectedHealthResult({id, transport_locator, http_status}) {
  const observation = (at) => ({
    at,
    outcome: 'healthy',
    final_transport_locator: transport_locator,
    http_status,
    login_wall_detected: false,
  });
  return {
    transport_locator,
    source_ids: [id],
    last_attempt: {...observation(reviewedAttemptAt), redirects: []},
    last_success: observation(reviewedAttemptAt),
    attempt_history: [observation(firstAttemptAt), observation(reviewedAttemptAt)],
    review_status: 'healthy',
  };
}

const expectedHealthResults = expectedSources
  .map(({id, transport_locator}) =>
    expectedHealthResult({
      id,
      transport_locator,
      http_status: id.startsWith('src-sei-') ? 200 : 206,
    }),
  )
  .sort((left, right) => left.transport_locator.localeCompare(right.transport_locator, 'en'));

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
  const results = linkHealth.results
    .filter(({source_ids}) => source_ids.some((sourceId) => expectedSourceIds.has(sourceId)))
    .sort((left, right) => left.transport_locator.localeCompare(right.transport_locator, 'en'));
  assert.deepEqual(results, expectedHealthResults);
});
