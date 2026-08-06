import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [ledger, linkHealth] = await Promise.all([
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/source-link-health.json', import.meta.url), 'utf8').then(JSON.parse),
]);

const expectedSources = new Map([
  ['src-microsoft-n-tier-architecture', 'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier'],
  ['src-fowler-presentation-domain-data-layering', 'https://martinfowler.com/bliki/PresentationDomainDataLayering.html'],
  ['src-aws-hexagonal-layered-overview', 'https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/overview.html'],
  ['src-archunit-user-guide', 'https://www.archunit.org/userguide/html/000_Index.html'],
]);

test('governs the four approved STY-01 sources', () => {
  const records = new Map(ledger.sources.map((source) => [source.id, source]));
  for (const [id, locator] of expectedSources) {
    const record = records.get(id);
    assert.equal(record?.canonical_locator, locator, id);
    assert.ok(record.version, `${id} version`);
    assert.ok(record.license_evidence_url, `${id} license evidence`);
    assert.ok(record.usage_boundary, `${id} usage boundary`);
  }
  assert.equal(records.get('src-microsoft-n-tier-architecture').version.includes('ef79621488119c618cd3ebeb8f81443f023cc452'), true);
  assert.equal(records.get('src-archunit-user-guide').version.includes('v1.5.0'), true);
});

test('keeps every STY-01 transport in the reviewed health cache', () => {
  const results = new Map(linkHealth.results.flatMap((result) =>
    result.source_ids.map((sourceId) => [sourceId, result])));
  for (const id of expectedSources.keys()) {
    const result = results.get(id);
    assert.ok(result, `${id} health result`);
    assert.equal(result.last_attempt.outcome, 'healthy', `${id} current transport`);
    assert.equal(result.review_status, 'healthy', `${id} review status`);
  }
});
