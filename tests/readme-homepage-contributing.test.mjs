import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = async (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const readBinary = async (path) =>
  readFile(new URL(`../${path}`, import.meta.url));

const assertPng = (image, label) => {
  assert.ok(image.length > 50 * 1024, `${label} must exceed 50 KB`);
  assert.deepEqual(
    [...image.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
    `${label} must be a PNG`,
  );
  assert.equal(image.toString('ascii', 12, 16), 'IHDR');
  assert.equal(image.readUInt32BE(16), 1672, `${label} width`);
  assert.equal(image.readUInt32BE(20), 941, `${label} height`);
};

test('ships one readable 16:9 future-directions roadmap', async () => {
  const image = await readBinary(
    'static/img/illustrations/tego-arch-future-directions.png',
  );

  assertPng(image, 'future roadmap');
});

test('ships matching light and dark judgment-path editorial assets', async () => {
  const [light, dark] = await Promise.all([
    readBinary('static/img/illustrations/tego-arch-judgment-path-light.png'),
    readBinary('static/img/illustrations/tego-arch-judgment-path-dark.png'),
  ]);

  assertPng(light, 'light judgment path');
  assertPng(dark, 'dark judgment path');
  assert.equal(light.readUInt32BE(16), dark.readUInt32BE(16));
  assert.equal(light.readUInt32BE(20), dark.readUInt32BE(20));
});

test('ships matching light and dark use-modes editorial assets', async () => {
  const [light, dark] = await Promise.all([
    readBinary('static/img/illustrations/tego-arch-use-modes-light.png'),
    readBinary('static/img/illustrations/tego-arch-use-modes-dark.png'),
  ]);

  assertPng(light, 'light use modes');
  assertPng(dark, 'dark use modes');
  assert.equal(light.readUInt32BE(16), dark.readUInt32BE(16));
  assert.equal(light.readUInt32BE(20), dark.readUInt32BE(20));
});

test('publishes separate code, content, and third-party license boundaries', async () => {
  const [codeLicense, contentLicense, notice] = await Promise.all([
    read('LICENSE'),
    read('LICENSE-CONTENT.md'),
    read('NOTICE.md'),
  ]);

  assert.match(codeLicense, /Apache License\s+Version 2\.0, January 2004/u);
  assert.match(codeLicense, /http:\/\/www\.apache\.org\/licenses\//u);

  assert.match(contentLicense, /Creative Commons Attribution 4\.0 International/u);
  assert.match(contentLicense, /https:\/\/creativecommons\.org\/licenses\/by\/4\.0\//u);
  assert.match(contentLicense, /文章与原创插图/u);
  assert.match(contentLicense, /署名/u);
  assert.match(contentLicense, /说明修改/u);

  assert.match(notice, /第三方/u);
  assert.match(notice, /不重新授权/u);
  assert.match(notice, /商标/u);
  assert.match(notice, /source ledger/u);
});

test('README positions the project, shows the roadmap, and closes the contribution loop', async () => {
  const readme = await read('README.md');

  assert.match(readme, /面向有经验的高级工程师/u);
  assert.match(readme, /从实现到架构决策/u);
  assert.match(
    readme,
    /static\/img\/illustrations\/tego-arch-initial-release-roadmap\.png/u,
  );
  assert.match(
    readme,
    /static\/img\/illustrations\/tego-arch-future-directions\.png/u,
  );
  assert.match(readme, /^## 初版方向$/mu);
  assert.match(readme, /^## 未来三个方向$/mu);
  assert.match(readme, /^## 本地开发$/mu);
  assert.match(readme, /^## 参与贡献$/mu);
  assert.match(readme, /^## 许可证与第三方材料$/mu);
  assert.match(readme, /2026-08-05.*视觉快照.*不是实时状态/su);
  assert.match(
    readme,
    /最新.*精确进度、当前故事和停止条件.*只在.*docs\/content-backlog\.md/su,
  );
  assert.match(readme, /精确进度.*docs\/content-backlog\.md/su);
  assert.match(
    readme,
    /完整知识体系是共同基础[\s\S]*不构成固定的交付顺序或发布日期/u,
  );
  for (const [title, term] of [
    ['架构决策速查', 'Architecture Decision Quick Reference'],
    ['精选学习路径', 'Curated Learning Paths'],
    ['Tego 参考架构', 'Tego Reference Architecture'],
  ]) {
    assert.match(readme, new RegExp(`^### ${title}$[\\s\\S]*${term}`, 'mu'));
  }
  assert.doesNotMatch(
    readme,
    /初版之后|后续产物|下一步，让完整内容变得更轻|便携小抄|精华学习路线|Tego 实践与规划/u,
  );
  assert.match(readme, /Node\.js.*>=24\.0/su);
  assert.match(readme, /npm ci/u);
  assert.match(readme, /npm run start/u);
  assert.match(readme, /npm run verify/u);
  assert.match(readme, /data\/source-ledger\.json/u);
  assert.match(readme, /LICENSE-CONTENT\.md/u);
  assert.match(readme, /NOTICE\.md/u);
});

test('homepage presents architecture judgment and the release roadmap', async () => {
  const homepage = await read('src/pages/index.tsx');

  assert.match(homepage, /在复杂系统里[\s\S]*做清醒的选择/u);
  assert.match(homepage, /开始建立判断坐标/u);
  assert.match(homepage, /了解研究方法/u);
  assert.match(homepage, /tego-arch-initial-release-roadmap\.png/u);
  assert.match(homepage, /一张持续展开的架构坐标/u);
  assert.match(homepage, /tego-arch-future-directions\.png/u);
  assert.match(homepage, /label="04 \/ 未来方向"/u);
  assert.match(homepage, /title="让完整体系进入不同使用场景"/u);
  assert.match(homepage, /三个方向并行演进，不代表固定顺序或发布日期/u);
  for (const text of [
    '架构决策速查',
    'Architecture Decision Quick Reference',
    '精选学习路径',
    'Curated Learning Paths',
    'Tego 参考架构',
    'Tego Reference Architecture',
  ]) {
    assert.match(homepage, new RegExp(text, 'u'));
  }
  assert.doesNotMatch(
    homepage,
    /初版之后|后续产物|下一步，让完整内容变得更轻|便携小抄|精华学习路线|Tego 实践与规划/u,
  );
  assert.match(homepage, /https:\/\/github\.com\/sealday\/tego-arch#参与贡献/u);
  assert.match(
    homepage,
    /<Hero\s*\/>\s*<main>\s*<RoadmapSection\s*\/>\s*<EntrySection\s*\/>\s*<ResearchHighlights\s*\/>\s*<FutureDirectionsSection\s*\/>\s*<ContributionBand\s*\/>/u,
  );
  assert.doesNotMatch(homepage, /Migration|migrationGroups|learningSteps|expansionPorts/u);
  assert.match(homepage, /styles\.hero/u);
  assert.match(homepage, /styles\.roadmapMedia/u);
  assert.match(homepage, /styles\.entryList/u);
  assert.match(homepage, /styles\.researchGrid/u);
  assert.match(homepage, /styles\.futureList/u);
});

test('website footer exposes the dual-license and third-party boundaries', async () => {
  const config = await read('docusaurus.config.ts');

  const footerLinks = [
    ['代码 · Apache-2.0', '/blob/main/LICENSE'],
    ['内容 · CC BY 4.0', '/blob/main/LICENSE-CONTENT.md'],
    ['第三方材料', '/blob/main/NOTICE.md'],
  ];

  for (const [label, destination] of footerLinks) {
    const linkObject = String.raw`\{\s*label: '${label.replaceAll('.', String.raw`\.`)}',\s*href: ` +
      '`' + String.raw`\$\{repositoryUrl\}${destination.replaceAll('.', String.raw`\.`)}` +
      '`' + String.raw`,?\s*\}`;
    assert.match(config, new RegExp(linkObject, 'u'));
  }

  assert.match(config, /Tego Arch contributors/u);
});
