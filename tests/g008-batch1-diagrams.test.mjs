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
    labels: [
      '申报 API',
      '提交用例',
      '审批策略',
      '付款编排',
      '持久化端口',
      'Web 应用',
      '申报数据库',
      '支付任务执行器',
    ],
  },
  {
    article: 'content/modeling/mod-03-c4-component-dynamic-deployment.mdx',
    route: '/modeling/mod-03#deployment',
    drawio: 'diagrams/mod-03-c4-deployment.drawio',
    svg: 'static/img/diagrams/mod-03-c4-deployment.svg',
    labels: [
      '生产环境',
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
      ...diagram.labels.flatMap((label) => ['--label', label]),
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

    const validation = runValidator(diagram);
    assert.equal(
      validation.status,
      0,
      `${diagram.route} validator\n${validation.stdout}${validation.stderr}`,
    );
  });
}
