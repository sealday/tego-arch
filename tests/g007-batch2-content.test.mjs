import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  findMarkdownHeadings,
  readContentDocuments,
} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const expected = new Map([
  ['PR-06', ['principles/pr-06-kiss-yagni-dry.mdx', '/principles/pr-06']],
  [
    'PR-07',
    [
      'principles/pr-07-fail-fast-fail-safe-graceful-degradation.mdx',
      '/principles/pr-07',
    ],
  ],
  ['PR-08', ['principles/pr-08-evolutionary-design.mdx', '/principles/pr-08']],
]);
const h2 = [
  '学习问题',
  '要保护的性质',
  '冲突与适用上下文',
  '机制',
  '误用与反原则',
  '适用尺度',
  '相邻原则',
  '说明性场景',
  '来源',
];
const relationships = new Map([
  ['PR-06', ['PR-01', 'PR-02', 'PR-05', 'PR-08']],
  ['PR-07', ['PR-02', 'PR-04', 'PR-09', 'PR-10', 'QA-01']],
  ['PR-08', ['PR-01', 'PR-04', 'PR-05', 'PR-06', 'MTH-03', 'MTH-04']],
]);
const solePrimary = new Map([
  ['PR-06', 'src-martin-fowler-yagni-2015'],
  ['PR-07', 'src-aws-rel05-bp01-graceful-degradation'],
  ['PR-08', 'src-martin-fowler-parallel-change-2014'],
]);
const routeByTopic = new Map([
  ['PR-01', '/principles/pr-01'],
  ['PR-02', '/principles/pr-02'],
  ['PR-04', '/principles/pr-04'],
  ['PR-05', '/principles/pr-05'],
  ['PR-06', '/principles/pr-06'],
  ['PR-08', '/principles/pr-08'],
  ['PR-09', '/principles/pr-09'],
  ['PR-10', '/principles/pr-10'],
  ['QA-01', '/quality-attributes/qa-01'],
  ['MTH-03', '/methods/mth-03'],
  ['MTH-04', '/methods/mth-04'],
]);
const misconceptionContracts = new Map([
  [
    'PR-06',
    [
      [
        'DRY protects authoritative knowledge rather than every similar code shape',
        '机制',
        /DRY 关心权威知识，不是每一段形状相似的代码/u,
      ],
      [
        'YAGNI permits currently required engineering work',
        '冲突与适用上下文',
        /YAGNI 不禁止当前必需的重构、测试、可观测性、安全或合规工作/u,
      ],
      [
        'KISS preserves inherent domain and operational complexity',
        '冲突与适用上下文',
        /KISS 也不构成忽略领域固有复杂度或运行复杂度的理由/u,
      ],
      [
        'temporary duplication can be safer while variation is unknown',
        '机制',
        /在变化边界未知时，临时重复可能比错误抽象更安全/u,
      ],
      [
        'shared abstractions require ownership stable change reasons and removal or reassessment',
        '机制',
        /共享抽象[\s\S]*明确所有者、稳定的共同变化原因，以及删除或重新评估条件/u,
      ],
    ],
  ],
  [
    'PR-07',
    [
      [
        'Fail Fast is bounded locally rather than crashing everything',
        '要保护的性质',
        /Fail Fast 是局部且有界的[\s\S]*并不意味着“每个异常都让整个进程崩溃”/u,
      ],
      [
        'Fail Safe requires a named hazard and safe state',
        '要保护的性质',
        /Fail Safe 必须先命名危害与安全状态/u,
      ],
      [
        'Fail Safe is not silent error swallowing',
        '误用与反原则',
        /把这种静默吞错叫作 Fail Safe/u,
      ],
      [
        'degradation must preserve truthful semantics and visible status',
        '机制',
        /Graceful Degradation 必须同时保留真实语义和可见降级状态/u,
      ],
      [
        'one request path can mix all three policies at different boundaries',
        '机制',
        /一个请求路径可以在输入验证处 Fail Fast[\s\S]*副作用边界 Fail Safe[\s\S]*Graceful Degradation/u,
      ],
      [
        'AWS and SRE guidance does not define universal thresholds',
        '冲突与适用上下文',
        /AWS 与 Google SRE 的材料[\s\S]*不是适用于所有系统的通用阈值/u,
      ],
    ],
  ],
  [
    'PR-08',
    [
      [
        'compatibility distinguishes source wire and semantic behavior in applicable API contexts',
        '要保护的性质',
        /在其适用的 API 上下文中把向后兼容区分为源代码、线协议和语义行为/u,
      ],
      [
        'expand migrate contract is a temporary compatibility window',
        '要保护的性质',
        /expand\/migrate\/contract 创建的是临时兼容窗口，不是永久双支持/u,
      ],
      [
        'a replacement seam surrounds an identified volatile decision',
        '机制',
        /可替换接缝必须围绕一个已识别的易变决策/u,
      ],
      [
        'old and new paths have separate correctness load and adoption telemetry',
        '机制',
        /用遥测分别辨识旧、新路径的正确性、负载和采用率/u,
      ],
      [
        'old-path removal has an owner and measurable exit condition',
        '机制',
        /旧路径删除需要明确所有者和可测量退出条件/u,
      ],
      [
        'microservices plugins flags and indirection do not automatically create evolvability',
        '误用与反原则',
        /微服务、插件、功能开关和间接层不会自动产生可演化性/u,
      ],
      [
        'big-bang replacement is not incremental migration',
        '误用与反原则',
        /“大爆炸替换”不是渐进迁移/u,
      ],
    ],
  ],
]);

const [documents, manifest, ledger] = await Promise.all([
  readContentDocuments(contentRoot),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
]);
const byId = new Map(
  documents
    .filter(({metadata}) => typeof metadata.topic_id === 'string')
    .map((document) => [document.metadata.topic_id, document]),
);
const topics = new Map(manifest.topics.map((topic) => [topic.id, topic]));

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

test('publishes PR-06 through PR-08 with the principle contract', () => {
  for (const [id, [file, slug]] of expected) {
    const document = requiredDocument(id);
    assert.equal(document.file, file);
    assert.equal(document.metadata.slug, slug);
    assert.equal(document.metadata.content_type, 'principle');
    assert.equal(document.metadata.priority, 'P0');
    assert.equal(document.metadata.status, 'reviewed');
    assert.deepEqual(document.metadata.adjacent_topics, relationships.get(id));
    assert.deepEqual(
      document.headings.filter(({level}) => level === 2).map(({text}) => text),
      h2,
    );
    const questions = section(document.body, '学习问题')
      .split(/\r?\n/u)
      .filter((line) => /^ {0,3}[-*+]\s+\S.*[?？]\s*$/u.test(line));
    assert.ok(questions.length >= 3 && questions.length <= 5, `${id} learning questions`);
    assert.match(
      document.body,
      /```mermaid[\s\S]*?```|^\|.+\|\n\|(?:\s*:?-{3,}:?\s*\|)+/mu,
      `${id} original representation`,
    );
    assert.match(document.body, /\*\*来源事实：\*\*/u, `${id} fact label`);
    assert.match(document.body, /\*\*推断：\*\*/u, `${id} inference label`);
    assert.match(document.body, /\*\*本站分析：\*\*/u, `${id} site-analysis label`);
    assert.match(document.body, /不应|不适用|反例|误用/u, `${id} negative boundary`);
    assert.equal(topics.get(id)?.published, true, `${id} manifest publication`);
  }
});

test('governs sources and visible Batch 2 relationships', () => {
  for (const [id, [file]] of expected) {
    const document = requiredDocument(id);
    const governed = ledger.documents[`content/${file}`];
    assert.ok(governed, `${id} governed ledger entry`);
    assert.ok(governed.citations.length >= 2, `${id} has at least two sources`);
    const primary = governed.citations.filter(({manifest_primary}) => manifest_primary);
    assert.equal(primary.length, 1, `${id} has exactly one manifest primary`);
    assert.equal(primary[0].source_id, solePrimary.get(id), `${id} primary identity`);
    const visibleExternal = new Set(extractExternalLinks(document));
    const domains = new Set();
    for (const citation of governed.citations) {
      assert.ok(visibleExternal.has(citation.citation_url), `${id} visible ${citation.source_id}`);
      domains.add(new URL(citation.citation_url).hostname);
    }
    assert.ok(domains.size >= 2, `${id} independent source domains`);
    const links = new Set(extractInternalLinks(document));
    assert.ok(links.has('/principles'), `${id} links parent index`);
    for (const adjacent of relationships.get(id)) {
      assert.ok(links.has(routeByTopic.get(adjacent)), `${id} visibly links ${adjacent}`);
    }
    assert.ok([...links].some((link) => link.startsWith('/cases/')), `${id} links a case`);
    assert.equal(
      [...links].some((link) => /^\/principles\/pr-1[2-7]$/u.test(link)),
      false,
      `${id} must not link unpublished principles`,
    );
  }
});

test('keeps Batch 2 decisions distinct from their slogans', () => {
  for (const [id, contracts] of misconceptionContracts) {
    const body = requiredDocument(id).body;
    for (const [label, heading, pattern] of contracts) {
      assert.match(section(body, heading), pattern, `${id}: ${label}`);
    }
  }
});
