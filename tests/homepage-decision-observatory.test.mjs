import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = async (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('publishes the approved homepage design contract', async () => {
  const design = await read('DESIGN.md');

  for (const heading of [
    '## Source of truth',
    '## Brand',
    '## Product goals',
    '## Personas and jobs',
    '## Information architecture',
    '## Design principles',
    '## Visual language',
    '## Components',
    '## Accessibility',
    '## Responsive behavior',
    '## Interaction states',
    '## Content voice',
    '## Implementation constraints',
    '## Open questions',
  ]) {
    assert.match(design, new RegExp(`^${heading}$`, 'mu'));
  }

  assert.match(design, /Status: Active/u);
  assert.match(design, /在复杂系统里 做清醒的选择/u);
  assert.match(design, /科技感来自结构、关系、状态与信息秩序/u);
  assert.match(design, /标题不得以中文或英文句号结尾/u);
  assert.match(design, /1440 × 1000/u);
  assert.match(design, /390 × 844/u);
  assert.match(design, /不增加 npm 依赖/u);
});
