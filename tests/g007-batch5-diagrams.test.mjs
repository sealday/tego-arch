import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const diagrams = [
  {
    article: 'content/principles/pr-15-conway-law-team-boundaries.mdx',
    route: '/principles/pr-15',
    drawio: 'diagrams/pr-15-conway-feedback-loop.drawio',
    svg: 'static/img/diagrams/pr-15-conway-feedback-loop.svg',
    labels: [
      '沟通路径',
      '团队边界',
      '系统边界',
      '交付反馈',
      '平台能力',
      '约束协作',
      '塑造边界',
      '产生反馈',
      '提出支撑需求',
      '降低认知负荷',
    ],
  },
  {
    article: 'content/principles/pr-17-classification-boundaries.mdx',
    route: '/principles/pr-17',
    drawio: 'diagrams/pr-17-classification-boundaries.drawio',
    svg: 'static/img/diagrams/pr-17-classification-boundaries.svg',
    labels: ['CAP', 'Strangler Fig', 'GRASP', '主归属', '交叉关系'],
  },
];

const validatorPath = fileURLToPath(
  new URL(
    '../.codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs',
    import.meta.url,
  ),
);
const purposeAlt = new Map([
  ['/principles/pr-15', /(?:沟通|团队)[^。\]]*(?:系统|边界|反馈)/u],
  ['/principles/pr-17', /(?:分类|主归属)[^。\]]*(?:边界|交叉关系|CAP|Strangler|GRASP)/u],
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

function architectureDiagramWrapper(article) {
  const opening = article.match(/<div className="architecture-diagram-scroll"[^>]*>/u);
  if (!opening || opening.index === undefined) {
    return null;
  }
  const contentStart = opening.index + opening[0].length;
  const contentEnd = article.indexOf('</div>', contentStart);
  if (contentEnd === -1) {
    return null;
  }
  return article.slice(contentStart, contentEnd);
}

for (const diagram of diagrams) {
  test(`embeds the local architecture diagram for ${diagram.route}`, async () => {
    const article = await readFile(absolute(diagram.article), 'utf8');
    const publicSvgPath = `/${diagram.svg.replace(/^static\//u, '')}`;
    const escapedPath = publicSvgPath.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    const wrapper = architectureDiagramWrapper(article);

    assert.ok(wrapper !== null, `${diagram.route} exact diagram scroll wrapper`);
    const image = wrapper.match(
      new RegExp(`!\\[([^\\]]+)\\]\\(${escapedPath}\\)`, 'u'),
    );

    assert.ok(image, `${diagram.route} uses ${publicSvgPath}`);
    assert.match(image[1], purposeAlt.get(diagram.route), `${diagram.route} purpose-oriented alt`);
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

    assert.match(drawio, /<mxfile\b/u);
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
