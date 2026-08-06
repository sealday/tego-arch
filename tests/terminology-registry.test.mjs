import assert from 'node:assert/strict';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  loadTerminologyRegistry,
  parseTerminologyRegistry,
} from '../scripts/terminology-registry.mjs';

const validEntry = {
  id: 'quality-attribute',
  canonical_zh: '质量属性',
  english: 'Quality Attribute',
  acronym: null,
  kind: 'translated-term',
  first_use: '质量属性（Quality Attribute）',
  subsequent_use: ['质量属性'],
  allowed_aliases: [],
  forbidden_aliases: ['quality attribute', 'Quality Attribute'],
  note: '描述系统在运行或演化中的关键特性，不简称为“质量”。',
  order: 10,
};

test('accepts and indexes a canonical terminology registry', () => {
  const result = parseTerminologyRegistry({schema_version: 1, terms: [validEntry]});
  assert.deepEqual(result.errors, []);
  assert.equal(result.byId.get('quality-attribute').canonical_zh, '质量属性');
  assert.equal(result.byAlias.get('quality attribute').id, 'quality-attribute');
});

test('collects exact-key, duplicate, alias-conflict, and display-contract errors', () => {
  const result = parseTerminologyRegistry({
    schema_version: 1,
    terms: [
      {...validEntry, extra: true},
      {...validEntry, id: 'second-term'},
      {...validEntry, id: 'third-term', order: 30, allowed_aliases: ['Quality Attribute']},
    ],
  });
  assert.ok(result.errors.some((error) => error.includes('unknown or missing fields')));
  assert.ok(result.errors.some((error) => error.includes('duplicate')));
  assert.ok(result.errors.some((error) => error.includes('both allowed and forbidden')));
});

test('rejects invalid top-level keys, schema versions, and terms values', () => {
  const extra = parseTerminologyRegistry({schema_version: 1, terms: [], extra: true}, 'extra.json');
  assert.deepEqual(extra.registry, {schema_version: 1, terms: []});
  assert.match(extra.errors[0], /extra\.json: expected exactly schema_version and terms/);

  const schema = parseTerminologyRegistry({schema_version: 2, terms: []}, 'schema.json');
  assert.match(schema.errors[0], /schema_version must equal 1/);

  const terms = parseTerminologyRegistry({schema_version: 1, terms: null}, 'terms.json');
  assert.match(terms.errors[0], /terms must be an array/);
});

test('rejects a NUL-joined key that only resembles the required top-level keys', () => {
  const result = parseTerminologyRegistry({'schema_version\0terms': []}, 'nul-key.json');
  assert.deepEqual(result.errors, ['nul-key.json: expected exactly schema_version and terms']);
});

test('collects invalid field types without throwing and skips invalid alias containers', () => {
  const result = parseTerminologyRegistry({
    schema_version: 1,
    terms: [
      {...validEntry, id: 'null-first-use', first_use: null},
      {...validEntry, id: 'null-subsequent', order: 20, subsequent_use: null},
      {...validEntry, id: 'null-forbidden', order: 30, forbidden_aliases: null},
    ],
  }, 'invalid-fields.json');

  assert.equal(result.errors.filter((error) => error.includes('invalid field values')).length, 3);
  assert.equal(result.registry.terms.length, 3);
  assert.equal(result.byAlias.get('quality attribute').id, 'null-first-use');
});

test('rejects illegal ids, prototype ids, kinds, and orders', () => {
  const result = parseTerminologyRegistry({
    schema_version: 1,
    terms: [
      {...validEntry, id: 'Not-Kebab'},
      {...validEntry, id: 'constructor', order: 20},
      {...validEntry, id: 'bad-kind', kind: 'translation', order: 30},
      {...validEntry, id: 'bad-order', order: 0},
    ],
  });

  assert.equal(result.errors.filter((error) => error.includes('non-prototype kebab-case')).length, 2);
  assert.equal(result.errors.filter((error) => error.includes('invalid field values')).length, 2);
  assert.equal(result.byId.has('constructor'), false);
});

test('reports an exact duplicate id and keeps the first indexed term', () => {
  const first = {...validEntry};
  const second = {
    ...validEntry,
    canonical_zh: '品质属性',
    first_use: '品质属性（Quality Attribute）',
    subsequent_use: ['品质属性'],
    order: 20,
  };

  const result = parseTerminologyRegistry({schema_version: 1, terms: [first, second]});
  assert.ok(result.errors.some((error) => error.includes('duplicate id "quality-attribute"')));
  assert.equal(result.byId.get('quality-attribute').canonical_zh, '质量属性');
});

test('reports duplicate malformed orders independent of entry order', () => {
  const malformed = (id) => ({...validEntry, id, extra: true});
  const valid = (id) => ({...validEntry, id});
  const arrangements = [
    [malformed('malformed-first'), valid('valid-second')],
    [valid('valid-first'), malformed('malformed-second')],
    [malformed('malformed-first'), malformed('malformed-second')],
  ];

  for (const terms of arrangements) {
    const result = parseTerminologyRegistry({schema_version: 1, terms});
    assert.equal(
      result.errors.filter((error) => error.includes('duplicate order "10"')).length,
      1,
    );
  }
});

test('accepts the three permitted exact first-use display forms', () => {
  const forms = [
    {...validEntry, id: 'english-only'},
    {
      ...validEntry,
      id: 'english-acronym',
      acronym: 'QA',
      first_use: '质量属性（Quality Attribute，QA）',
      order: 20,
    },
    {
      ...validEntry,
      id: 'canonical-only',
      english: null,
      acronym: null,
      first_use: '质量属性',
      order: 30,
    },
  ];

  for (const entry of forms) {
    const result = parseTerminologyRegistry({schema_version: 1, terms: [entry]});
    assert.deepEqual(result.errors, []);
  }
});

test('rejects an acronym without an English term', () => {
  const result = parseTerminologyRegistry({
    schema_version: 1,
    terms: [{
      ...validEntry,
      english: null,
      acronym: 'QA',
      first_use: '质量属性（QA）',
    }],
  });

  assert.ok(result.errors.some((error) => error.includes('acronym requires english')));
});

test('rejects reordered, half-width, missing, and extra first-use text', () => {
  const invalidForms = [
    '质量属性（QA，Quality Attribute）',
    '质量属性(Quality Attribute, QA)',
    '质量属性（Quality Attribute）',
    '前缀质量属性（Quality Attribute，QA）',
  ];
  const terms = invalidForms.map((first_use, index) => ({
    ...validEntry,
    id: `invalid-display-${index + 1}`,
    acronym: 'QA',
    first_use,
    order: (index + 1) * 10,
  }));

  const result = parseTerminologyRegistry({schema_version: 1, terms});
  assert.equal(result.errors.filter((error) => error.includes('first_use must exactly equal')).length, 4);
});

test('normalizes aliases with NFC and case folding and reports cross-term conflicts', () => {
  const first = {
    ...validEntry,
    id: 'cafe-first',
    allowed_aliases: ['Caf\u00e9'],
  };
  const second = {
    ...validEntry,
    id: 'cafe-second',
    canonical_zh: '咖啡馆',
    english: null,
    first_use: '咖啡馆',
    subsequent_use: ['咖啡馆'],
    allowed_aliases: ['CAFE\u0301'],
    forbidden_aliases: [],
    order: 20,
  };

  const result = parseTerminologyRegistry({schema_version: 1, terms: [first, second]});
  assert.equal(result.byAlias.get('caf\u00e9').id, 'cafe-first');
  assert.ok(result.errors.some((error) => error.includes('conflicts with "cafe-first"')));
});

test('sorts registry terms and errors deterministically', () => {
  const result = parseTerminologyRegistry({
    schema_version: 1,
    terms: [
      {...validEntry, id: 'third', order: 30},
      {...validEntry, id: 'first', order: 10},
      {...validEntry, id: 'second', order: 20},
    ],
  });

  assert.deepEqual(result.registry.terms.map(({id}) => id), ['first', 'second', 'third']);
  assert.deepEqual(result.errors, [...result.errors].sort((left, right) => left.localeCompare(right, 'en')));
});

test('loads a valid registry and returns structured errors for read and JSON failures', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'terminology-registry-'));
  try {
    await mkdir(path.join(root, 'data'));
    await writeFile(
      path.join(root, 'data/terminology.json'),
      JSON.stringify({schema_version: 1, terms: [validEntry]}),
    );
    const loaded = await loadTerminologyRegistry(root);
    assert.deepEqual(loaded.errors, []);
    assert.equal(loaded.byId.get('quality-attribute').english, 'Quality Attribute');

    await writeFile(path.join(root, 'data/terminology.json'), '{invalid json');
    const invalidJson = await loadTerminologyRegistry(root);
    assert.deepEqual(invalidJson.registry, {schema_version: 1, terms: []});
    assert.match(invalidJson.errors[0], /data\/terminology\.json: invalid JSON/);

    await rm(path.join(root, 'data/terminology.json'));
    const missing = await loadTerminologyRegistry(root);
    assert.deepEqual(missing.registry, {schema_version: 1, terms: []});
    assert.match(missing.errors[0], /data\/terminology\.json: unable to read/);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
