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

const expectedSources = new Map([
  ['src-sei-qaw-collection', 'https://www.sei.cmu.edu/library/quality-attribute-workshop-collection/'],
  ['src-sei-atam-collection', 'https://www.sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection/'],
  ['src-microsoft-architecture-styles', 'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/'],
  ['src-arc42-architecture-decisions', 'https://docs.arc42.org/section-9/'],
  ['src-arc42-quality-requirements-v9', 'https://docs.arc42.org/section-10/'],
]);

const expectedCitations = [
  ['src-sei-qaw-collection', false],
  ['src-sei-atam-collection', true],
  ['src-microsoft-architecture-styles', false],
  ['src-arc42-architecture-decisions', false],
  ['src-arc42-quality-requirements-v9', false],
];

test('governs five specific visible STY-00 sources', () => {
  assert.ok(document, 'STY-00 must remain published');
  const records = new Map(ledger.sources.map((source) => [source.id, source]));
  for (const [id, locator] of expectedSources) {
    assert.equal(records.get(id)?.canonical_locator, locator, id);
    assert.ok(document.source.includes(`](${locator})`), `${id} visible citation`);
  }
  const review = ledger.documents['content/styles/sty-00-comparison-framework.mdx'];
  assert.equal(review.reviewed_at, '2026-08-06');
  assert.deepEqual(
    review.citations.map(({source_id, manifest_primary}) => [source_id, manifest_primary]),
    expectedCitations,
  );
  assert.deepEqual(
    review.citations.filter(({manifest_primary}) => manifest_primary).map(({source_id}) => source_id),
    ['src-sei-atam-collection'],
  );
});

test('keeps every new remote source in the reviewed health cache', () => {
  const results = new Map(
    linkHealth.results.flatMap((result) =>
      result.source_ids.map((sourceId) => [sourceId, result]),
    ),
  );
  for (const id of [...expectedSources.keys()].slice(0, 4)) {
    const result = results.get(id);
    assert.ok(result, `${id} health result`);
    assert.equal(result.last_attempt.outcome, 'healthy', `${id} current transport`);
    assert.equal(result.review_status, 'healthy', `${id} review status`);
  }
});
