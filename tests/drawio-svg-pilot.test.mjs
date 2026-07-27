import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const pagePath = '../content/modeling/mod-02-c4-context-container.mdx';
const drawioPath = '../diagrams/mod-02-c4-context-container.drawio';
const svgPath = '../static/img/diagrams/mod-02-c4-context-container.svg';

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

  const [drawio, svg] = await Promise.all([
    source(drawioPath),
    source(svgPath),
  ]);

  assert.match(drawio, /<mxfile\b/u);
  assert.match(drawio, /<diagram\b[^>]*name="Context → Container"/u);
  assert.match(svg, /<svg\b/u);
  assert.match(svg, /\bviewBox="0 0 1200 760"/u);
  assert.doesNotMatch(svg, /\bwidth="\d+(?:px)?"/u);
  assert.doesNotMatch(svg, /\bheight="\d+(?:px)?"/u);

  for (const label of [
    'Context：费用申报系统边界',
    'Container：展开费用申报系统',
    '员工',
    '费用申报系统',
    '银行支付服务',
    'Web 应用',
    '申报 API',
    '申报数据库',
    '支付任务执行器',
  ]) {
    assert.match(drawio, new RegExp(label, 'u'));
    assert.match(svg, new RegExp(label, 'u'));
  }
});
