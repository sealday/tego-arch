import {readFile} from 'node:fs/promises';
import path from 'node:path';

const entryKeys = [
  'id', 'canonical_zh', 'english', 'acronym', 'kind', 'first_use',
  'subsequent_use', 'allowed_aliases', 'forbidden_aliases', 'note', 'order',
];
const kinds = new Set([
  'translated-term', 'proper-noun', 'acronym', 'standard', 'code-literal',
]);
const prototypeNames = new Set(['__proto__', 'constructor', 'prototype']);
const normalizeAlias = (value) => value.normalize('NFC').trim().toLocaleLowerCase('en');
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const exactKeys = (value, keys) => isRecord(value)
  && Object.keys(value).sort().join('\0') === [...keys].sort().join('\0');
const isNonEmpty = (value) => typeof value === 'string' && value.trim() !== '';
const isNullableText = (value) => value === null || isNonEmpty(value);
const isTextArray = (value) => Array.isArray(value)
  && value.every((item) => isNonEmpty(item));

export function parseTerminologyRegistry(value, file = 'data/terminology.json') {
  const errors = [];
  const terms = [];
  const byId = new Map();
  const byAlias = new Map();
  const orders = new Set();
  if (!exactKeys(value, ['schema_version', 'terms'])) {
    return {
      registry: {schema_version: 1, terms: []}, byId, byAlias,
      errors: [`${file}: expected exactly schema_version and terms`],
    };
  }
  if (value.schema_version !== 1 || !Array.isArray(value.terms)) {
    return {
      registry: {schema_version: 1, terms: []}, byId, byAlias,
      errors: [`${file}: schema_version must equal 1 and terms must be an array`],
    };
  }
  for (const [index, entry] of value.terms.entries()) {
    const label = `${file}: term ${index + 1}`;
    if (!exactKeys(entry, entryKeys)) {
      errors.push(`${label} has unknown or missing fields`);
      if (isRecord(entry) && Number.isInteger(entry.order) && entry.order > 0) {
        orders.add(entry.order);
      }
      continue;
    }
    const validId = isNonEmpty(entry.id)
      && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)
      && !prototypeNames.has(entry.id);
    if (!validId) errors.push(`${label} id must be non-prototype kebab-case`);
    if (validId && byId.has(entry.id)) errors.push(`${label} has duplicate id "${entry.id}"`);
    if (!isNonEmpty(entry.canonical_zh)
      || !isNullableText(entry.english)
      || !isNullableText(entry.acronym)
      || !kinds.has(entry.kind)
      || !isNonEmpty(entry.first_use)
      || !isTextArray(entry.subsequent_use)
      || !isTextArray(entry.allowed_aliases)
      || !isTextArray(entry.forbidden_aliases)
      || !isNonEmpty(entry.note)
      || !Number.isInteger(entry.order)
      || entry.order <= 0) {
      errors.push(`${label} has invalid field values`);
    }
    if (orders.has(entry.order)) errors.push(`${label} has duplicate order "${entry.order}"`);
    orders.add(entry.order);
    if (!entry.first_use.includes(entry.canonical_zh)
      || (entry.english !== null && !entry.first_use.includes(entry.english))
      || (entry.acronym !== null && !entry.first_use.includes(entry.acronym))) {
      errors.push(`${label} first_use must contain canonical_zh, english, and acronym when present`);
    }
    const allowed = [
      entry.canonical_zh, ...entry.subsequent_use, ...entry.allowed_aliases,
    ].filter(Boolean);
    const forbidden = entry.forbidden_aliases;
    const allowedKeys = new Set(allowed.map(normalizeAlias));
    for (const alias of forbidden) {
      if (allowedKeys.has(normalizeAlias(alias))) {
        errors.push(`${label} alias "${alias}" is both allowed and forbidden`);
      }
    }
    const normalized = {...entry};
    terms.push(normalized);
    if (validId && !byId.has(entry.id)) byId.set(entry.id, normalized);
    const lookupAliases = [entry.english, entry.acronym, ...allowed, ...forbidden].filter(Boolean);
    for (const alias of lookupAliases) {
      const key = normalizeAlias(alias);
      const existing = byAlias.get(key);
      if (existing && existing.id !== entry.id) {
        errors.push(`${label} alias "${alias}" conflicts with "${existing.id}"`);
      } else if (!existing) {
        byAlias.set(key, normalized);
      }
    }
  }
  terms.sort((left, right) => left.order - right.order);
  errors.sort((left, right) => left.localeCompare(right, 'en'));
  return {registry: {schema_version: 1, terms}, byId, byAlias, errors};
}

export async function loadTerminologyRegistry(root) {
  const file = path.join(root, 'data/terminology.json');
  const source = await readFile(file, 'utf8');
  return parseTerminologyRegistry(JSON.parse(source), 'data/terminology.json');
}
