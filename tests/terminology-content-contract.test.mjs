import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const titleContracts = [
  [
    'content/principles/pr-13-persistence-ignorance.mdx',
    '持久化无知（Persistence Ignorance）',
  ],
  [
    'content/principles/pr-16-secure-by-design.mdx',
    '安全内建（Secure by Design）',
  ],
  [
    'content/principles/pr-12-open-closed-interface-segregation.mdx',
    '开闭原则（Open/Closed Principle）与接口隔离原则（Interface Segregation Principle）',
  ],
  [
    'content/patterns/rel-02-retry-backoff-jitter.mdx',
    '重试（Retry）、指数退避（Exponential Backoff）与抖动（Jitter）',
  ],
  [
    'content/modeling/mod-11-ddd-context-map.mdx',
    '领域驱动设计上下文映射（DDD Context Map）',
  ],
  [
    'content/modeling/mod-10-domain-storytelling.mdx',
    '领域叙事（Domain Storytelling）协作建模',
  ],
];

test('uses Chinese-primary titles for the Task 7 terminology contracts', async () => {
  for (const [file, expectedTitle] of titleContracts) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    const actualTitle = source.match(/^title:\s*(.+)$/mu)?.[1];
    assert.equal(actualTitle, expectedTitle, file);
  }
});
