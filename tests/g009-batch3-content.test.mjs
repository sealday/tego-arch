import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [ledger, linkHealth, licenseInventory] = await Promise.all([
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/source-link-health.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../docs/source-license-inventory.md', import.meta.url), 'utf8'),
]);

const expectedNewSources = new Map([
  ['src-cockburn-hexagonal-architecture-2005', 'https://alistair.cockburn.us/hexagonal-architecture/'],
  ['src-palermo-onion-architecture-part-1', 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/'],
  ['src-palermo-onion-architecture-part-3', 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/'],
  ['src-martin-clean-architecture-2012', 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html'],
]);

test('governs the four original STY-02 sources as conservative identity families', () => {
  const records = new Map(ledger.sources.map((source) => [source.id, source]));
  for (const [id, locator] of expectedNewSources) {
    const record = records.get(id);
    assert.equal(record?.canonical_locator, locator, id);
    assert.equal(record.transport_locator, locator, `${id} transport`);
    assert.equal(record.license, 'LicenseRef-All-Rights-Reserved', `${id} license`);
    assert.equal(record.license_family_grouping, 'identity', `${id} grouping`);
    assert.equal(record.copyright_policy, 'facts-and-short-quotation', `${id} copyright policy`);
    assert.equal(record.checked_at, '2026-08-07', `${id} checked_at`);
    assert.ok(record.version, `${id} version`);
    assert.ok(record.license_evidence_url, `${id} license evidence`);
    assert.ok(record.usage_boundary, `${id} usage boundary`);
    assert.ok(licenseInventory.includes(locator), `${id} license inventory row`);
  }
});

test('bounds the reused AWS source for STY-01 comparison and STY-02 implementation context', () => {
  const record = ledger.sources.find(({id}) => id === 'src-aws-hexagonal-layered-overview');
  assert.equal(record?.canonical_locator, 'https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/overview.html');
  assert.deepEqual(record.allowed_evidence_roles, ['comparison', 'definition', 'implementation', 'learning']);
  assert.match(record.usage_boundary, /STY-01/u);
  assert.match(record.usage_boundary, /STY-02/u);
  assert.match(record.usage_boundary, /AWS-specific/u);
});

test('approves Cockburn trailing-slash transport normalization without changing source identity', () => {
  const record = ledger.sources.find(({id}) => id === 'src-cockburn-hexagonal-architecture-2005');
  assert.equal(record?.canonical_locator, 'https://alistair.cockburn.us/hexagonal-architecture/');
  assert.equal(record.transport_locator, 'https://alistair.cockburn.us/hexagonal-architecture/');
  assert.equal(record.expected_final_transport_locator, 'https://alistair.cockburn.us/hexagonal-architecture');
  assert.match(record.expected_final_approval_note, /2026-08-07 live 301 normalization/u);
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
