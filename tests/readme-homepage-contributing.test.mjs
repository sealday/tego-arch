import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = async (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8');

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
  assert.match(readme, /^## 初版方向$/mu);
  assert.match(readme, /^## 初版之后$/mu);
  assert.match(readme, /^## 本地开发$/mu);
  assert.match(readme, /^## 参与贡献$/mu);
  assert.match(readme, /^## 许可证与第三方材料$/mu);
  assert.match(readme, /2026-08-05.*视觉快照.*不是实时状态/su);
  assert.match(
    readme,
    /最新.*精确进度、当前故事和停止条件.*只在.*docs\/content-backlog\.md/su,
  );
  assert.match(readme, /精确进度.*docs\/content-backlog\.md/su);
  assert.match(readme, /便携小抄/u);
  assert.match(readme, /精华学习路线/u);
  assert.match(readme, /Tego 实践与规划/u);
  assert.match(readme, /Node\.js.*>=24\.0/su);
  assert.match(readme, /npm ci/u);
  assert.match(readme, /npm run start/u);
  assert.match(readme, /npm run verify/u);
  assert.match(readme, /data\/source-ledger\.json/u);
  assert.match(readme, /LICENSE-CONTENT\.md/u);
  assert.match(readme, /NOTICE\.md/u);
});

test('homepage leads with the transition to architecture design and the release roadmap', async () => {
  const [homepage, styles] = await Promise.all([
    read('src/pages/index.tsx'),
    read('src/pages/index.module.css'),
  ]);

  assert.match(homepage, /从高级工程师到架构设计者/u);
  assert.match(homepage, /面向有经验的高级工程师/u);
  assert.match(homepage, /tego-arch-initial-release-roadmap\.png/u);
  assert.match(homepage, /Tego Arch 初版发布路线图/u);
  assert.match(homepage, /docs\/content-backlog\.md/u);
  assert.match(homepage, /便携小抄/u);
  assert.match(homepage, /精华学习路线/u);
  assert.match(homepage, /Tego 实践与规划/u);
  assert.match(homepage, /https:\/\/github\.com\/sealday\/tego-arch#参与贡献/u);
  assert.equal([...homepage.matchAll(/<RoadmapSection\s*\/>/gu)].length, 1);
  assert.equal([...homepage.matchAll(/<FutureDeliverablesSection\s*\/>/gu)].length, 1);
  assert.match(
    homepage,
    /<Hero\s*\/>\s*<main>\s*<RoadmapSection\s*\/>\s*<FutureDeliverablesSection\s*\/>/u,
  );

  const futureSectionSource = homepage.match(
    /function FutureDeliverablesSection\(\): ReactNode \{[\s\S]*?\n\}\n\nexport default function Home/u,
  )?.[0];
  assert.ok(futureSectionSource);
  assert.doesNotMatch(futureSectionSource, /<Link\b|\bhref=|<button\b|\bto=/u);

  assert.match(
    homepage,
    /2026-08-05[\s\S]*视觉快照[\s\S]*不是实时状态[\s\S]*最新[\s\S]*精确进度[\s\S]*当前故事[\s\S]*停止条件[\s\S]*只在[\s\S]*docs\/content-backlog\.md/u,
  );
  assert.doesNotMatch(homepage, /7\s*\/\s*20|当前\s*G008/u);

  assert.match(styles, /\.roadmapSection/u);
  assert.match(styles, /\.roadmapImage/u);
  assert.match(styles, /\.futureGrid/u);
  assert.match(styles, /@media\s*\(max-width:\s*996px\)/u);
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
