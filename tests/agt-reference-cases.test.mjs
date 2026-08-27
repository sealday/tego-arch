import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const registry = JSON.parse(readFileSync('tests/fixtures/agentic-topic-system.json', 'utf8'));

test('the three approved reference cases have unique routes and global catalog order', () => {
  assert.deepEqual(registry.cases.map(({backlog_id}) => backlog_id), ['CASE-21','CASE-22','CASE-23']);
  assert.deepEqual(registry.cases.map(({order}) => order), [19,20,21]);
  assert.equal(new Set(registry.cases.map(({route}) => route)).size, 3);
  assert.equal(new Set(registry.cases.map(({file}) => file)).size, 3);
  assert.ok(registry.cases.every(({visual}) => visual === 'Draw.io + SVG'));
});
