import assert from 'node:assert/strict';
import test from 'node:test';
import {parseTerminologyRegistry} from '../scripts/terminology-registry.mjs';

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
