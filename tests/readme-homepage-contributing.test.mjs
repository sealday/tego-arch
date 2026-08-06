import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {inflateSync} from 'node:zlib';

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

const paethPredictor = (left, above, upperLeft) => {
  const prediction = left + above - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const aboveDistance = Math.abs(prediction - above);
  const upperLeftDistance = Math.abs(prediction - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
};

const decodeRgbPng = (image, label) => {
  assertPng(image, label);
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  assert.equal(image[24], 8, `${label} must use 8-bit channels`);
  assert.equal(image[25], 2, `${label} must use RGB color`);
  assert.equal(image[26], 0, `${label} must use standard PNG compression`);
  assert.equal(image[27], 0, `${label} must use standard PNG filtering`);
  assert.equal(image[28], 0, `${label} must be non-interlaced`);

  const idatChunks = [];
  for (let offset = 8; offset < image.length;) {
    const length = image.readUInt32BE(offset);
    const type = image.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') idatChunks.push(image.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  assert.ok(idatChunks.length > 0, `${label} must contain IDAT data`);

  const bytesPerPixel = 3;
  const stride = width * bytesPerPixel;
  const scanlines = inflateSync(Buffer.concat(idatChunks));
  assert.equal(scanlines.length, height * (stride + 1), `${label} scanline length`);
  const pixels = Buffer.alloc(width * height * bytesPerPixel);

  for (let y = 0; y < height; y += 1) {
    const scanlineOffset = y * (stride + 1);
    const filter = scanlines[scanlineOffset];
    assert.ok(filter <= 4, `${label} has unsupported PNG filter ${filter}`);
    for (let x = 0; x < stride; x += 1) {
      const encoded = scanlines[scanlineOffset + 1 + x];
      const outputOffset = y * stride + x;
      const left = x >= bytesPerPixel ? pixels[outputOffset - bytesPerPixel] : 0;
      const above = y > 0 ? pixels[outputOffset - stride] : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel
        ? pixels[outputOffset - stride - bytesPerPixel]
        : 0;
      const predictor = [0, left, above, Math.floor((left + above) / 2), paethPredictor(left, above, upperLeft)][filter];
      pixels[outputOffset] = (encoded + predictor) & 0xff;
    }
  }

  return {width, height, pixels};
};

const assertSolidPngEdges = (image, expected, label) => {
  const {width, height, pixels} = decodeRgbPng(image, label);
  const pixelAt = (x, y) => [...pixels.subarray((y * width + x) * 3, (y * width + x) * 3 + 3)];
  const edges = [
    ['top', Array.from({length: width}, (_, x) => [x, 0])],
    ['right', Array.from({length: height}, (_, y) => [width - 1, y])],
    ['bottom', Array.from({length: width}, (_, x) => [x, height - 1])],
    ['left', Array.from({length: height}, (_, y) => [0, y])],
  ];
  const failures = edges.flatMap(([edge, coordinates]) => {
    const mismatches = coordinates.filter(([x, y]) => !pixelAt(x, y).every((channel, index) => channel === expected[index]));
    if (mismatches.length === 0) return [];
    const [x, y] = mismatches[0];
    return [`${edge}: ${mismatches.length} mismatch(es), first at (${x}, ${y}) is rgb(${pixelAt(x, y).join(', ')})`];
  });
  assert.deepEqual(failures, [], `${label} edges must all be rgb(${expected.join(', ')})`);
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
  assertSolidPngEdges(light, [247, 242, 232], 'light judgment path');
  assertSolidPngEdges(dark, [31, 29, 26], 'dark judgment path');
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

test('homepage presents architecture judgment and reader-facing usage modes', async () => {
  const homepage = await read('src/pages/index.tsx');

  assert.match(homepage, /在复杂系统里[\s\S]*做清醒的选择/u);
  assert.match(homepage, /开始建立判断坐标/u);
  assert.match(homepage, /了解研究方法/u);
  for (const path of [
    'tego-arch-judgment-path-light.png',
    'tego-arch-judgment-path-dark.png',
    'tego-arch-use-modes-light.png',
    'tego-arch-use-modes-dark.png',
  ]) {
    assert.match(homepage, new RegExp(path.replace('.', String.raw`\.`), 'u'));
  }
  assert.match(homepage, /label="01 \/ 判断路径"/u);
  assert.match(homepage, /title="建立架构判断的主线"/u);
  assert.match(
    homepage,
    /从基础与质量出发，经过建模、模式与治理，在案例和复盘中形成判断/u,
  );
  assert.match(homepage, /label="04 \/ 使用方式"/u);
  assert.match(homepage, /title="从理解架构到做出取舍"/u);
  assert.match(
    homepage,
    /需要判断时快速查，系统学习时沿路径走，也从真实架构中理解取舍/u,
  );
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
    /tego-arch-initial-release-roadmap\.png|tego-arch-future-directions\.png|让完整体系进入不同使用场景|三个方向并行演进，不代表固定顺序或发布日期/u,
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
