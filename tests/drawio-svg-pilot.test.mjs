import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const pagePath = '../content/modeling/mod-02-c4-context-container.mdx';
const drawioPath = '../diagrams/mod-02-c4-context-container.drawio';
const svgPath = '../static/img/diagrams/mod-02-c4-context-container.svg';
const cssPath = '../src/css/custom.css';
const validatorPath = fileURLToPath(
  new URL(
    '../.codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs',
    import.meta.url,
  ),
);

function source(relativePath) {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

test('publishes the MOD-02 Draw.io source and responsive SVG pair', async () => {
  const page = await source(pagePath);

  assert.doesNotMatch(page, /```mermaid/u);
  assert.match(
    page,
    /!\[[^\]]+\]\(\/img\/diagrams\/mod-02-c4-context-container\.svg\)/u,
  );
  assert.match(
    page,
    /<div className="architecture-diagram-scroll">[\s\S]*mod-02-c4-context-container\.svg[\s\S]*<\/div>/u,
  );

  const [drawio, svg, css] = await Promise.all([
    source(drawioPath),
    source(svgPath),
    source(cssPath),
  ]);

  assert.match(drawio, /<mxfile\b/u);
  assert.match(drawio, /<diagram\b[^>]*name="Context → Container"/u);
  assert.match(svg, /<svg\b/u);
  assert.match(svg, /\bviewBox="0 0 1200 840"/u);
  const svgRoot = svg.match(/<svg\b[^>]*>/u)?.[0] ?? '';
  assert.doesNotMatch(svgRoot, /\bwidth=/u);
  assert.doesNotMatch(svgRoot, /\bheight=/u);
  assert.doesNotMatch(svg, /class="edge-label-background"/u);
  assert.match(svg, /class="edge-label"/u);
  assert.match(svg, /data-clearance="8"/u);
  assert.match(drawio, /html=0/u);
  assert.doesNotMatch(drawio, /labelBackgroundColor=/u);
  assert.match(
    css,
    /\.architecture-diagram-scroll\s*\{[^}]*overflow-x:\s*auto;/su,
  );
  assert.match(
    css,
    /\.architecture-diagram-scroll img\s*\{[^}]*width:\s*50rem;[^}]*max-width:\s*none;/su,
  );

  const majorLabels = [
    'Context：费用申报系统边界',
    'Container：展开费用申报系统',
    '员工',
    '费用申报系统',
    '银行支付服务',
    'Web 应用',
    '申报 API',
    '申报数据库',
    '支付任务执行器',
  ];

  for (const label of majorLabels) {
    assert.match(drawio, new RegExp(label, 'u'));
    assert.match(svg, new RegExp(label, 'u'));
  }

  const validator = spawnSync(
    process.execPath,
    [
      validatorPath,
      fileURLToPath(new URL(drawioPath, import.meta.url)),
      fileURLToPath(new URL(svgPath, import.meta.url)),
      ...majorLabels.flatMap((label) => ['--label', label]),
    ],
    {encoding: 'utf8'},
  );

  assert.equal(validator.status, 0, validator.stderr);
});
