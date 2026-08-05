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

test('uses the approved decision-observatory narrative in exact order', async () => {
  const homepage = await read('src/pages/index.tsx');
  const orderedCopy = [
    '在复杂系统里 做清醒的选择',
    '一张持续展开的架构坐标',
    '从问题出发',
    '正在研究的系统',
    '下一步，让完整内容变得更轻',
    '这是一份开放的研究记录',
  ];

  let previous = -1;
  for (const copy of orderedCopy) {
    const position = homepage.indexOf(copy);
    assert.ok(position > previous, `${copy} must follow the preceding section`);
    previous = position;
  }

  for (const removed of [
    '从高级工程师到架构设计者。',
    '初版先完成一套完整的架构知识体系',
    '经典架构迁移地图',
    '五步读懂一个软件架构主题',
    '为上百个案例留下稳定入口',
  ]) {
    assert.doesNotMatch(homepage, new RegExp(removed, 'u'));
  }

  const visibleHeadings = [
    ...homepage.matchAll(/<Heading[^>]*>([^<]+)<\/Heading>/gu),
    ...homepage.matchAll(/<SectionIntro[^>]*\btitle="([^"]+)"/gu),
  ].map((match) => match[1].trim());
  assert.ok(visibleHeadings.length >= 6);
  for (const heading of visibleHeadings) {
    assert.doesNotMatch(heading, /[。.]+$/u);
  }
});

test('publishes three problem-led entrances and generated research highlights', async () => {
  const homepage = await read('src/pages/index.tsx');

  for (const [title, href] of [
    ['建立判断坐标', '/paths'],
    ['拆解真实系统', '/cases'],
    ['回到证据现场', '/references'],
  ]) {
    assert.match(homepage, new RegExp(`title: '${title}'[\\s\\S]*href: '${href}'`, 'u'));
  }

  assert.match(homepage, /const homepageCases = featuredCases\.slice\(0, 3\)/u);
  assert.doesNotMatch(homepage, /secondCollectionCases|groupCasesBySeries|migrationGroups/u);
  assert.match(homepage, /homepageCases\.slice\(1\)\.map/u);
});
