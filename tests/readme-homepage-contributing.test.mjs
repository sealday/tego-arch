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
