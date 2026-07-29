import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  findMarkdownHeadings,
  readContentDocuments,
} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {
  extractExternalLinks,
  visibleMdxLines,
} from '../scripts/source-ledger.mjs';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const expected = new Map([
  ['PR-15', ['principles/pr-15-conway-law-team-boundaries.mdx', '/principles/pr-15', 'P1']],
  ['PR-16', ['principles/pr-16-secure-by-design.mdx', '/principles/pr-16', 'P2']],
  ['PR-17', ['principles/pr-17-classification-boundaries.mdx', '/principles/pr-17', 'P2']],
]);

const h2 = [
  '学习问题',
  '一页摘要',
  '事实边界',
  '架构图',
  '控制权与任务流',
  '关键源码导读',
  '架构决策与权衡',
  '生产化分析',
  '可迁移经验',
  '来源',
];

const migrationH3 = [
  '可直接复用的机制',
  '只能有限类比的部分',
  '不应照搬的部分',
];

const relationships = new Map([
  ['PR-15', ['PR-02', 'PR-03', 'PR-08', 'PR-14']],
  ['PR-16', ['PR-07', 'PR-09', 'PR-10']],
  ['PR-17', ['PR-08', 'PR-14']],
]);

const primary = new Map([
  ['PR-15', 'src-melconway-committees-1968'],
  ['PR-16', 'src-cisa-secure-by-design-2023'],
  ['PR-17', 'src-gilbert-lynch-cap-2002'],
]);

const routeByTopic = new Map([
  ['PR-02', '/principles/pr-02'],
  ['PR-03', '/principles/pr-03'],
  ['PR-07', '/principles/pr-07'],
  ['PR-08', '/principles/pr-08'],
  ['PR-09', '/principles/pr-09'],
  ['PR-10', '/principles/pr-10'],
  ['PR-14', '/principles/pr-14'],
]);

const decisionContracts = new Map([
  ['PR-15', [
    ['descriptive law', '事实边界', /描述性规律[^。；\n]*(?:不是|不等于)[^。；\n]*规范命令/u],
    ['communication structure', '一页摘要', /沟通结构[^。；\n]*系统设计/u],
    ['reverse Conway condition', '架构决策与权衡', /反向康威[^。；\n]*(?:有条件|干预策略)/u],
    ['reorganization cost', '生产化分析', /团队重组[^。；\n]*(?:成本|代价)/u],
    ['no service-per-team slogan', '生产化分析', /每个服务一个团队[^。；\n]*(?:误用|不成立|并不)/u],
  ]],
  ['PR-16', [
    ['whole lifecycle', '一页摘要', /需求[^。；\n]*设计[^。；\n]*实现[^。；\n]*(?:部署|运营)/u],
    ['threat model inputs', '控制权与任务流', /资产[^。；\n]*攻击者目标[^。；\n]*信任边界[^。；\n]*滥用路径/u],
    ['default deny and least privilege', '架构决策与权衡', /默认拒绝[^。；\n]*最小权限/u],
    ['independent defense layers', '架构决策与权衡', /纵深防御[^。；\n]*(?:独立失效|不同失效)/u],
    ['exception expiry', '生产化分析', /风险接受[^。；\n]*例外期限[^。；\n]*(?:责任所有者|撤销条件)/u],
  ]],
  ['PR-17', [
    ['classification criteria', '一页摘要', /核心问题[^。；\n]*适用尺度[^。；\n]*输入[^。；\n]*输出[^。；\n]*失效条件/u],
    ['CAP home', '架构决策与权衡', /CAP[^。；\n]*分布式(?:系统|理论)/u],
    ['Strangler home', '架构决策与权衡', /Strangler(?: Fig)?[^。；\n]*迁移模式/u],
    ['GRASP home', '架构决策与权衡', /GRASP[^。；\n]*责任分配/u],
    ['primary versus cross-link', '架构图', /主归属[^。；\n]*(?:交叉关系|相关链接)/u],
  ]],
]);

const [documents, ledger] = await Promise.all([
  readContentDocuments(contentRoot),
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8')
    .then(JSON.parse),
]);
const byId = new Map(
  documents
    .filter(({metadata}) => typeof metadata.topic_id === 'string')
    .map((document) => [document.metadata.topic_id, document]),
);
const realCaseRoutes = new Set(
  documents
    .filter(({metadata}) => metadata.content_type === 'case')
    .map(({metadata}) => metadata.slug),
);

function requiredDocument(id) {
  const document = byId.get(id);
  assert.ok(document, `${id} must be published`);
  return document;
}

function section(body, heading) {
  const headings = findMarkdownHeadings(body).filter(({level}) => level === 2);
  const index = headings.findIndex(({text}) => text === heading);
  assert.notEqual(index, -1, `missing ## ${heading}`);
  const start = body.indexOf('\n', headings[index].offset);
  const end = headings[index + 1]?.offset ?? body.length;
  return body.slice(start === -1 ? end : start + 1, end);
}

function withoutInlineCodeSpans(text) {
  let visible = '';
  let cursor = 0;
  while (cursor < text.length) {
    const openingStart = text.indexOf('`', cursor);
    if (openingStart === -1) {
      visible += text.slice(cursor);
      break;
    }
    visible += text.slice(cursor, openingStart);
    let openingEnd = openingStart;
    while (text[openingEnd] === '`') {
      openingEnd += 1;
    }
    const fenceLength = openingEnd - openingStart;
    let closingStart = openingEnd;
    while (closingStart < text.length) {
      const candidateStart = text.indexOf('`', closingStart);
      if (candidateStart === -1) {
        closingStart = -1;
        break;
      }
      let candidateEnd = candidateStart;
      while (text[candidateEnd] === '`') {
        candidateEnd += 1;
      }
      if (candidateEnd - candidateStart === fenceLength) {
        closingStart = candidateStart;
        break;
      }
      closingStart = candidateEnd;
    }
    if (closingStart === -1) {
      visible += text.slice(openingStart);
      break;
    }
    cursor = closingStart + fenceLength;
  }
  return visible;
}

function isBackslashEscaped(text, index) {
  let backslashes = 0;
  while (text[index - backslashes - 1] === '\\') {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}

function hasVisibleDiagramImage(document, source) {
  const body = visibleMdxLines(document).join('\n');
  const openingPattern =
    /<div className="architecture-diagram-scroll"[^>]*>/gu;
  for (const opening of body.matchAll(openingPattern)) {
    const start = opening.index + opening[0].length;
    const end = body.indexOf('</div>', start);
    if (end === -1) {
      continue;
    }
    const wrapper = withoutInlineCodeSpans(body.slice(start, end));
    const imagePattern =
      /!\[[^\]\n]*\]\(\s*(?<source>[^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/gu;
    if (
      [...wrapper.matchAll(imagePattern)].some(
        (match) =>
          !isBackslashEscaped(wrapper, match.index) &&
          match.groups.source === source,
      )
    ) {
      return true;
    }
  }
  return false;
}

test('requires original illustrations as diagram-wrapper Markdown images', () => {
  const source = '/img/diagrams/pr-15-conway-feedback-loop.svg';
  const image = `![团队边界与交付反馈](${source})`;
  const wrapper = (content) =>
    `<div className="architecture-diagram-scroll">\n${content}\n</div>`;

  assert.equal(hasVisibleDiagramImage({body: wrapper(image)}, source), true);
  const rejectedBodies = [
    wrapper(''),
    `${wrapper('')}\n${image}`,
    wrapper(`[团队边界与交付反馈](${source})`),
    wrapper(`\`${image}\``),
    wrapper(`\\${image}`),
  ];
  assert.deepEqual(
    rejectedBodies.map((body) => hasVisibleDiagramImage({body}, source)),
    rejectedBodies.map(() => false),
  );
});

test('publishes PR-15 through PR-17 with the closing principle contract', () => {
  for (const [id, [file, slug, priority]] of expected) {
    const document = requiredDocument(id);
    assert.equal(document.file, file);
    assert.equal(document.metadata.slug, slug);
    assert.equal(document.metadata.content_type, 'principle');
    assert.equal(document.metadata.priority, priority);
    assert.equal(document.metadata.status, 'reviewed');
    assert.equal(document.metadata.review_policy, 'quarterly-version-sensitive');
    assert.deepEqual(document.metadata.adjacent_topics, relationships.get(id));
    assert.deepEqual(
      document.headings.filter(({level}) => level === 2).map(({text}) => text),
      h2,
    );
    assert.deepEqual(
      document.headings.filter(({level}) => level === 3).map(({text}) => text),
      migrationH3,
    );
    const questions = section(document.body, '学习问题')
      .split(/\r?\n/u)
      .filter((line) => /^ {0,3}[-*+]\s+\S.*[?？]\s*$/u.test(line));
    assert.ok(questions.length >= 4 && questions.length <= 6, `${id} learning questions`);
    assert.equal(
      document.body.match(/说明性场景/gu)?.length ?? 0,
      1,
      `${id} one illustrative scenario`,
    );
    assert.match(document.body, /\*\*来源事实：\*\*/u, `${id} fact label`);
    assert.match(document.body, /\*\*推断：\*\*/u, `${id} inference label`);
    assert.match(document.body, /\*\*本站分析：\*\*/u, `${id} site-analysis label`);
    assert.match(
      document.body,
      /<details className="evidence-card">[\s\S]*?<summary>[\s\S]*?<\/summary>[\s\S]*?<\/details>/u,
      `${id} evidence card`,
    );
  }
});

test('governs sources and visible closing-batch relationships', () => {
  for (const [id, [file]] of expected) {
    const document = requiredDocument(id);
    const governed = ledger.documents[`content/${file}`];
    assert.ok(governed, `${id} governed ledger entry`);
    const manifestPrimary = governed.citations.filter(({manifest_primary}) => manifest_primary);
    assert.equal(manifestPrimary.length, 1, `${id} has exactly one manifest primary`);
    assert.equal(manifestPrimary[0].source_id, primary.get(id), `${id} primary identity`);

    const visibleExternal = new Set(
      extractExternalLinks(document).filter((url) => url.startsWith('https://')),
    );
    for (const citation of governed.citations) {
      if (citation.usage_mode === 'original-illustration') {
        assert.match(
          citation.citation_url,
          /^\/img\/[^?#\s]+\.svg$/u,
          `${id} local illustration ${citation.source_id}`,
        );
        assert.ok(
          hasVisibleDiagramImage(document, citation.citation_url),
          `${id} visible illustration ${citation.source_id}`,
        );
        continue;
      }
      assert.ok(visibleExternal.has(citation.citation_url), `${id} visible ${citation.source_id}`);
    }
  }

  for (const [id] of expected) {
    const document = requiredDocument(id);
    const links = new Set(extractInternalLinks(document));
    assert.ok(links.has('/principles'), `${id} links parent index`);
    for (const adjacent of relationships.get(id)) {
      assert.ok(links.has(routeByTopic.get(adjacent)), `${id} visibly links ${adjacent}`);
    }
    assert.ok(
      [...links].some((link) => realCaseRoutes.has(link)),
      `${id} links one real case`,
    );
  }
});

for (const [id, contracts] of decisionContracts) {
  test(`keeps ${id} closing decision boundaries explicit`, () => {
    const body = requiredDocument(id).body;
    for (const [label, heading, pattern] of contracts) {
      assert.match(section(body, heading), pattern, `${id}: ${label}`);
    }
  });
}

test('rejects closing-batch overclaims and duplicate taxonomy routes', () => {
  const pr15 = requiredDocument('PR-15').body;
  const pr16 = requiredDocument('PR-16').body;
  const links = new Set([
    ...extractInternalLinks(requiredDocument('PR-15')),
    ...extractInternalLinks(requiredDocument('PR-16')),
    ...extractInternalLinks(requiredDocument('PR-17')),
  ]);

  assert.doesNotMatch(pr15, /组织图就是架构图/u);
  assert.doesNotMatch(pr15, /重组本身会消除耦合/u);
  assert.doesNotMatch(pr16, /通过渗透测试即可关闭设计风险/u);
  assert.doesNotMatch(pr16, /安全团队独自拥有安全/u);
  assert.equal(links.has('/principles/cap'), false);
  assert.equal(links.has('/patterns/strangler'), false);
});
