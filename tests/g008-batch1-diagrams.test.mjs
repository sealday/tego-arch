import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const diagrams = [
  {
    article: 'content/modeling/mod-03-c4-component-dynamic-deployment.mdx',
    route: '/modeling/mod-03#component',
    drawio: 'diagrams/mod-03-c4-component.drawio',
    svg: 'static/img/diagrams/mod-03-c4-component.svg',
    semanticLabels: [
      '申报 API Component 责任边界',
      '此图只展开一个申报 API Container，展示四个内部责任单元及直接依赖，不证明代码与图一致。',
      '申报 API',
      '提交用例',
      '审批策略',
      '付款编排',
      '持久化端口',
      'Web 应用',
      '申报数据库',
      '支付任务执行器',
      'CONTAINER',
      'COMPONENT',
      'DATA STORE',
      '提交请求',
      '校验审批',
      '创建付款任务',
      '保存任务',
      '读写申报',
      '发布待执行任务',
    ],
  },
  {
    article: 'content/modeling/mod-03-c4-component-dynamic-deployment.mdx',
    route: '/modeling/mod-03#deployment',
    drawio: 'diagrams/mod-03-c4-deployment.drawio',
    svg: 'static/img/diagrams/mod-03-c4-deployment.svg',
    semanticLabels: [
      '费用申报系统生产环境部署视图',
      '此图把费用申报系统的容器实例映射到生产环境节点，但不证明容量、冗余、韧性或故障切换能力。',
      '生产环境',
      '部署节点',
      '容器实例',
      '基础设施节点',
      '外部系统',
      '员工终端',
      'Web 节点',
      'API 节点',
      '数据库节点',
      '任务执行节点',
      'Web 应用实例',
      '申报 API 实例',
      '申报数据库实例',
      '支付任务执行器实例',
      '外部银行',
      '数据实例',
      '访问页面',
      '提交申报',
      '读写申报',
      '发布付款任务',
      '发起付款',
    ],
  },
];

const validatorPath = fileURLToPath(
  new URL(
    '../.codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs',
    import.meta.url,
  ),
);
const purposeAlt = new Map([
  [
    '/modeling/mod-03#component',
    /申报 API[^。\]]*(?:责任单元|容器依赖)/u,
  ],
  [
    '/modeling/mod-03#deployment',
    /(?:容器实例|生产节点)[^。\]]*(?:映射|外部银行)/u,
  ],
]);

function absolute(relativePath) {
  return fileURLToPath(new URL(`../${relativePath}`, import.meta.url));
}

function runValidator(diagram) {
  return spawnSync(
    process.execPath,
    [
      validatorPath,
      absolute(diagram.drawio),
      absolute(diagram.svg),
      ...diagram.semanticLabels.flatMap((label) => ['--label', label]),
    ],
    {encoding: 'utf8'},
  );
}

function architectureDiagramWrapperForSource(article, publicSvgPath) {
  const openings = article.matchAll(
    /<div className="architecture-diagram-scroll"[^>]*>/gu,
  );
  for (const opening of openings) {
    const contentStart = opening.index + opening[0].length;
    const contentEnd = article.indexOf('</div>', contentStart);
    if (contentEnd === -1) {
      continue;
    }
    const wrapper = article.slice(opening.index, contentEnd + '</div>'.length);
    if (wrapper.includes(`](${publicSvgPath})`)) {
      return wrapper;
    }
  }
  return null;
}

function decodeXmlText(value) {
  return value
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'")
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&amp;/gu, '&')
    .trim();
}

function drawioTextInventory(drawio) {
  return new Set(
    [...drawio.matchAll(/\bvalue="([^"]*)"/gu)]
      .map((match) => decodeXmlText(match[1]))
      .filter(Boolean),
  );
}

function svgTextInventory(svg) {
  return new Set(
    [...svg.matchAll(/<(?:title|desc|text)\b[^>]*>([^<]+)<\/(?:title|desc|text)>/gu)]
      .map((match) => decodeXmlText(match[1]))
      .filter(Boolean),
  );
}

function sortedInventory(values) {
  return [...values].sort((left, right) => left.localeCompare(right, 'zh-Hans'));
}

for (const diagram of diagrams) {
  test(`embeds the local architecture diagram for ${diagram.route}`, async () => {
    const article = await readFile(absolute(diagram.article), 'utf8');
    const publicSvgPath = `/${diagram.svg.replace(/^static\//u, '')}`;
    const escapedPath = publicSvgPath.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    const wrapper = architectureDiagramWrapperForSource(article, publicSvgPath);

    assert.ok(wrapper !== null, `${diagram.route} exact diagram scroll wrapper`);
    assert.match(wrapper, /\brole="region"/u);
    assert.match(wrapper, /\baria-label="[^"]*(?:责任边界|部署视图)[^"]*"/u);
    assert.match(wrapper, /\btabIndex=\{0\}/u);

    const image = wrapper.match(
      new RegExp(`!\\[([^\\]]+)\\]\\(${escapedPath}\\)`, 'u'),
    );
    assert.ok(image, `${diagram.route} uses ${publicSvgPath}`);
    assert.match(
      image[1],
      purposeAlt.get(diagram.route),
      `${diagram.route} purpose-oriented alt`,
    );
    assert.doesNotMatch(image[1], /(?:\.svg|diagram|架构图)$/iu);
  });

  test(`publishes the accessible Draw.io and SVG pair for ${diagram.route}`, async () => {
    const [drawio, svg] = await Promise.all([
      readFile(absolute(diagram.drawio), 'utf8'),
      readFile(absolute(diagram.svg), 'utf8'),
    ]);
    const svgRoot = svg.match(/<svg\b[^>]*>/u)?.[0] ?? '';
    const title = svg.match(/<title\b[^>]*\bid="([^"]+)"[^>]*>[^<]+<\/title>/u);
    const description = svg.match(/<desc\b[^>]*\bid="([^"]+)"[^>]*>[^<]+<\/desc>/u);

    assert.match(drawio, /^<mxfile\b/u);
    assert.match(svgRoot, /\brole="img"/u);
    assert.match(svgRoot, /\bviewBox="[^"]+"/u);
    assert.doesNotMatch(svgRoot, /\bwidth=/u);
    assert.doesNotMatch(svgRoot, /\bheight=/u);
    assert.ok(title, `${diagram.route} accessible SVG title`);
    assert.ok(description, `${diagram.route} accessible SVG description`);
    assert.match(
      svgRoot,
      new RegExp(
        `\\baria-labelledby="${title[1].replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}\\s+${description[1].replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}"`,
        'u',
      ),
    );
    const expectedInventory = sortedInventory(new Set(diagram.semanticLabels));
    assert.deepEqual(
      sortedInventory(drawioTextInventory(drawio)),
      expectedInventory,
      `${diagram.route} complete Draw.io semantic inventory`,
    );
    assert.deepEqual(
      sortedInventory(svgTextInventory(svg)),
      expectedInventory,
      `${diagram.route} complete SVG semantic inventory`,
    );

    const validation = runValidator(diagram);
    assert.equal(
      validation.status,
      0,
      `${diagram.route} validator\n${validation.stdout}${validation.stderr}`,
    );
  });
}

test('keeps the Deployment boundary and external bank visibly separated', async () => {
  const svg = await readFile(
    absolute('static/img/diagrams/mod-03-c4-deployment.svg'),
    'utf8',
  );
  const viewBox = svg.match(/\bviewBox="0 0 ([\d.]+) ([\d.]+)"/u);
  const boundary = svg.match(
    /data-boundary-id="production"[^>]*data-boundary-bounds="([\d. ]+)"/u,
  );
  const database = svg.match(
    /data-node-id="db-node"[^>]*data-node-bounds="([\d. ]+)"/u,
  );
  const bank = svg.match(
    /data-node-id="bank"[^>]*data-node-bounds="([\d. ]+)"/u,
  );

  assert.ok(viewBox && boundary && database && bank);
  const scale = 800 / Number(viewBox[1]);
  const [boundaryX, , boundaryWidth] = boundary[1].split(/\s+/u).map(Number);
  const [databaseX, , databaseWidth] = database[1].split(/\s+/u).map(Number);
  const [bankX, , bankWidth] = bank[1].split(/\s+/u).map(Number);
  const boundaryStroke = 3;
  const databaseStroke = 3;
  const bankStroke = 2;
  const boundaryInnerRight =
    boundaryX + boundaryWidth - boundaryStroke / 2;
  const boundaryOuterRight =
    boundaryX + boundaryWidth + boundaryStroke / 2;
  const databaseOuterRight =
    databaseX + databaseWidth + databaseStroke / 2;
  const bankOuterLeft = bankX - bankStroke / 2;
  const bankOuterRight = bankX + bankWidth + bankStroke / 2;

  assert.ok(
    (boundaryInnerRight - databaseOuterRight) * scale >= 12,
    'database node to production boundary clearance',
  );
  assert.ok(
    (bankOuterLeft - boundaryOuterRight) * scale >= 12,
    'production boundary to external bank clearance',
  );
  assert.ok(
    (Number(viewBox[1]) - bankOuterRight) * scale >= 12,
    'external bank to viewBox clearance',
  );
});
