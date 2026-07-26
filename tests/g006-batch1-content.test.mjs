import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  extractMarkdownBody,
  findMarkdownHeadings,
  readContentDocuments,
} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const expected = new Map([
  [
    'QA-00',
    ['quality-attributes/qa-00-overview.mdx', '/quality-attributes/qa-00'],
  ],
  [
    'QA-01',
    [
      'quality-attributes/qa-01-scenario-writing.mdx',
      '/quality-attributes/qa-01',
    ],
  ],
  [
    'QA-02',
    [
      'quality-attributes/qa-02-reliability-availability-recoverability.mdx',
      '/quality-attributes/qa-02',
    ],
  ],
  [
    'QA-03',
    [
      'quality-attributes/qa-03-performance-latency-throughput-capacity.mdx',
      '/quality-attributes/qa-03',
    ],
  ],
]);
const h2 = [
  '学习问题',
  '定义与业务目标',
  '质量属性场景',
  '架构策略',
  '测量信号与阈值',
  '权衡与失败模式',
  '相邻质量属性',
  '说明性场景',
  '来源',
];
const images = new Map([
  ['QA-00', '/img/illustrations/qa-00-quality-model-boundaries.png'],
  ['QA-02', '/img/illustrations/qa-02-failure-recovery-boundaries.png'],
  ['QA-03', '/img/illustrations/qa-03-load-saturation-boundaries.png'],
]);
const relationships = new Map([
  [
    'QA-00',
    {
      adjacent: ['QA-01', 'QA-02', 'QA-03'],
      dependsOn: ['FND-02'],
      relatedCases: ['/cases/microsoft-multi-agent-reference-architecture'],
    },
  ],
  [
    'QA-01',
    {
      adjacent: ['QA-00', 'QA-02', 'MTH-03', 'REL-02'],
      dependsOn: ['FND-02', 'QA-00'],
      relatedCases: ['/cases/aws-cell-shuffle-sharding'],
    },
  ],
  [
    'QA-02',
    {
      adjacent: ['QA-00', 'QA-01', 'QA-03'],
      dependsOn: ['QA-00', 'QA-01'],
      relatedCases: [
        '/cases/aws-cell-shuffle-sharding',
        '/cases/temporal-saga-durable-execution',
      ],
    },
  ],
  [
    'QA-03',
    {
      adjacent: ['QA-00', 'QA-02', 'QA-04'],
      dependsOn: ['QA-00', 'QA-01'],
      relatedCases: [
        '/cases/apache-kafka-consumer-groups',
        '/cases/cloudflare-durable-objects-workerd',
      ],
    },
  ],
]);

const [documents, manifest, sourceLedger, topicRelations] = await Promise.all([
  readContentDocuments(contentRoot),
  readFile(
    new URL('../src/generated/topic-manifest.json', import.meta.url),
    'utf8',
  ).then(JSON.parse),
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(
    JSON.parse,
  ),
  readFile(new URL('../data/topic-relations.json', import.meta.url), 'utf8').then(
    JSON.parse,
  ),
]);
const documentsById = new Map(
  documents
    .filter(({metadata}) => typeof metadata.topic_id === 'string')
    .map((document) => [document.metadata.topic_id, document]),
);
const topicsById = new Map(manifest.topics.map((topic) => [topic.id, topic]));
const sourcesById = new Map(
  sourceLedger.sources.map((source) => [source.id, source]),
);

function requiredDocument(id) {
  const document = documentsById.get(id);
  assert.ok(document, `${id} must be published`);
  return document;
}

function requiredLedgerDocument(id) {
  const [file] = expected.get(id);
  const governed = sourceLedger.documents[`content/${file}`];
  assert.ok(governed, `${id} must have a governed document entry`);
  return governed;
}

function sectionForHeading(body, headingText) {
  const headings = findMarkdownHeadings(body).filter(({level}) => level === 2);
  const index = headings.findIndex(({text}) => text === headingText);
  assert.notEqual(index, -1, `Missing real heading: ## ${headingText}`);
  const start = body.indexOf('\n', headings[index].offset);
  const end = headings[index + 1]?.offset ?? body.length;
  return body.slice(start === -1 ? end : start + 1, end);
}

function representationCandidates(body) {
  const lines = body.split(/\r?\n/);
  const candidates = [];
  const neighboringText = (
    start,
    end = start,
    includeRepresentation = false,
  ) => {
    const before = lines
      .slice(0, start)
      .findLast((line) => line.trim().length > 0);
    const after = lines
      .slice(end + 1)
      .find((line) => line.trim().length > 0);
    return [
      before,
      ...(includeRepresentation ? lines.slice(start, end + 1) : []),
      after,
    ]
      .filter(Boolean)
      .join('\n');
  };

  for (let index = 0; index < lines.length; index += 1) {
    if (/^ {0,3}(?:`{3,}|~{3,})mermaid\s*$/u.test(lines[index])) {
      const delimiter = lines[index].trim().match(/^(`{3,}|~{3,})/u)?.[1];
      const closingOffset = lines
        .slice(index + 1)
        .findIndex((line) => line.trim() === delimiter);
      const end = closingOffset === -1 ? index : index + closingOffset + 1;
      candidates.push({
        kind: 'Mermaid',
        labelContext: neighboringText(index, end),
      });
      index = end;
      continue;
    }

    if (
      /^\s*\|.*\|\s*$/.test(lines[index]) &&
      /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(lines[index + 1] ?? '')
    ) {
      let end = index + 1;
      while (/^\s*\|.*\|\s*$/.test(lines[end + 1] ?? '')) {
        end += 1;
      }
      candidates.push({
        kind: 'table',
        labelContext: neighboringText(index, end),
      });
      index = end;
      continue;
    }

    if (/!\[[^\]]+\]\([^)]+\)/u.test(lines[index])) {
      candidates.push({
        kind: 'illustration',
        labelContext: neighboringText(index, index, true),
      });
    }
  }

  return candidates;
}

function assertArticleContract(id) {
  const [file, slug] = expected.get(id);
  const relation = relationships.get(id);
  const document = requiredDocument(id);
  const topic = topicsById.get(id);

  assert.equal(document.file, file, id);
  assert.equal(document.metadata.slug, slug, id);
  assert.equal(document.metadata.content_type, 'quality-attribute', id);
  assert.equal(document.metadata.priority, 'P0', id);
  assert.equal(document.metadata.status, 'reviewed', id);
  assert.deepEqual(document.metadata.depends_on, relation.dependsOn, id);
  assert.deepEqual(document.metadata.adjacent_topics, relation.adjacent, id);
  assert.deepEqual(document.metadata.related_cases, relation.relatedCases, id);

  assert.ok(topic?.published, `${id} manifest must be published`);
  assert.equal(topic.slug, slug, id);
  assert.equal(topic.type, 'quality-attribute', id);
  assert.equal(topic.priority, 'P0', id);
  assert.deepEqual(topic.dependencies, relation.dependsOn, id);
  assert.deepEqual(topic.adjacent_topics, relation.adjacent, id);
  assert.deepEqual(topic.related_cases, relation.relatedCases, id);

  const actualH2 = document.headings
    .filter(({level}) => level === 2)
    .map(({text}) => text);
  assert.deepEqual(actualH2, h2, `${id} H2 sequence`);
  const questions = sectionForHeading(document.body, '学习问题')
    .split(/\r?\n/)
    .filter((line) => /^ {0,3}[-*+]\s+\S.*[?？]\s*$/u.test(line));
  assert.ok(
    questions.length >= 3 && questions.length <= 5,
    `${id} must ask 3–5 learning questions`,
  );

  const visibleBody = extractMarkdownBody(document.source);
  assert.match(visibleBody, /(?:事实|来源事实)/u, `${id} must distinguish facts`);
  assert.match(visibleBody, /(?:推断|推论)/u, `${id} must label inference`);
  assert.match(
    visibleBody,
    /(?:本站分析|Atlas synthesis|本站(?:定义|整理|绘制))/iu,
    `${id} must label site analysis`,
  );
  assert.match(visibleBody, /边界/u, `${id} must state a boundary`);
  const failureSection = sectionForHeading(visibleBody, '权衡与失败模式');
  assert.ok(
    failureSection.trim().length >= 200,
    `${id} must substantively explain tradeoffs and failure modes`,
  );
  assert.match(
    failureSection,
    /(?:失败|失效|故障|反模式|反例).{0,180}(?:因为|导致|造成|后果|风险|代价|无法|不能)|(?:因为|导致|造成|后果|风险|代价|无法|不能).{0,180}(?:失败|失效|故障|反模式|反例)/su,
    `${id} must explain a failure mode and its consequence`,
  );
  assert.match(
    failureSection,
    /(?:不适用|不应|不可|不要|何时不用|禁用|非使用条件)/u,
    `${id} must state a non-use condition in 权衡与失败模式`,
  );
  const representations = representationCandidates(visibleBody);
  assert.ok(representations.length > 0, `${id} needs a precise representation`);
  assert.ok(
    representations.some(({labelContext}) =>
      /(?:原创|本站(?:绘制|整理|定义)|Atlas synthesis)/iu.test(labelContext),
    ),
    `${id} must label a detected table, Mermaid, or illustration as original`,
  );

  const visibleLinks = new Set(extractInternalLinks(document));
  for (const requiredSlug of [
    '/quality-attributes',
    ...relation.adjacent.map((adjacentId) => expected.get(adjacentId)?.[1] ??
      topicsById.get(adjacentId)?.slug),
    ...relation.relatedCases,
  ]) {
    assert.ok(
      visibleLinks.has(requiredSlug),
      `${id} must visibly link ${requiredSlug}`,
    );
  }

  const governed = requiredLedgerDocument(id);
  const visibleExternal = new Set(extractExternalLinks(document));
  const factualCitations = governed.citations.filter(
    ({usage_mode: usageMode}) => usageMode !== 'original-illustration',
  );
  assert.ok(factualCitations.length >= 2, `${id} needs two governed sources`);
  const governedDomains = new Set();
  for (const citation of factualCitations) {
    assert.equal(citation.usage_mode, 'facts-summary', id);
    assert.ok(
      visibleExternal.has(citation.citation_url),
      `${id} must visibly cite ${citation.citation_url}`,
    );
    const source = sourcesById.get(citation.source_id);
    assert.ok(source, `${id} cites unknown source ${citation.source_id}`);
    governedDomains.add(new URL(citation.citation_url).hostname);
  }
  assert.ok(
    governedDomains.size >= 2,
    `${id} must govern at least two independent domains`,
  );
  const primary = factualCitations.filter(
    ({manifest_primary: manifestPrimary}) => manifestPrimary === true,
  );
  assert.equal(primary.length, 1, `${id} must select one manifest primary`);
  const primarySource = sourcesById.get(primary[0].source_id);
  assert.ok(
    ['primary', 'first-party'].includes(primarySource?.tier) &&
      primarySource?.source_kind !== 'community-index',
    `${id} manifest primary must be eligible`,
  );
  assert.ok(
    topicsById.get(id)?.primary_sources.includes(primary[0].citation_url),
    `${id} manifest must project its primary source`,
  );
}

async function pathBody(file) {
  const source = await readFile(
    new URL(`../content/paths/${file}`, import.meta.url),
    'utf8',
  );
  return extractMarkdownBody(source);
}

test('QA-00 and QA-01 content relations and architecture path', async () => {
  assertArticleContract('QA-00');
  assertArticleContract('QA-01');
  assert.equal('QA-00' in topicRelations, false);

  const scenario = sectionForHeading(
    requiredDocument('QA-01').body,
    '质量属性场景',
  );
  const scenarioHeadings = findMarkdownHeadings(scenario)
    .filter(({level}) => level === 3)
    .map(({text}) => text);
  assert.deepEqual(scenarioHeadings, [
    'Source',
    'Stimulus',
    'Environment',
    'Artifact',
    'Response',
    'Response measure',
  ]);

  const architecturePath = await pathBody('01-architecture-thinking.mdx');
  const qa00Index = architecturePath.indexOf('/quality-attributes/qa-00');
  const qa01Index = architecturePath.indexOf('/quality-attributes/qa-01');
  assert.notEqual(qa00Index, -1, 'architecture path must link QA-00');
  assert.notEqual(qa01Index, -1, 'architecture path must link QA-01');
  assert.ok(qa00Index < qa01Index, 'architecture path must order QA-00 before QA-01');
  assert.doesNotMatch(
    architecturePath,
    /QA-00.{0,80}(?:未发布|缺口)|(?:未发布|缺口).{0,80}QA-00/su,
    'architecture path must remove the QA-00 publication gap',
  );
});

test('QA-02 and QA-03 content relations reliability path and distributed path', async () => {
  assertArticleContract('QA-02');
  assertArticleContract('QA-03');

  const qa02 = requiredDocument('QA-02').body;
  for (const term of ['fault', 'failure', 'RTO', 'RPO', '结果未知']) {
    assert.match(qa02, new RegExp(term, 'iu'), `QA-02 must explain ${term}`);
  }

  const qa03 = requiredDocument('QA-03').body;
  for (const term of [
    'workload',
    'concurrency',
    'service time',
    'throughput',
    'p50',
    'p95',
    'p99',
    'utilization',
    'queue',
    'rejection',
    'saturation',
  ]) {
    assert.match(qa03, new RegExp(term, 'iu'), `QA-03 must explain ${term}`);
  }
  assert.match(
    qa03,
    /(?:平均|average).{0,80}(?:隐藏|掩盖).{0,40}(?:尾部|tail)/isu,
  );
  assert.match(
    qa03,
    /(?:throughput|吞吐).{0,80}(?:offered load|请求负载|提供负载)/isu,
  );
  assert.match(
    qa03,
    /(?:capacity|容量).{0,80}(?:边界|区间|运行包络).{0,120}(?:不是|不等于|并非).{0,60}(?:最大值|benchmark|基准)/isu,
  );

  const reliabilityPath = await pathBody('04-reliability-state.mdx');
  assert.ok(
    extractInternalLinks({
      body: reliabilityPath,
      file: 'paths/04-reliability-state.mdx',
    }).includes('/quality-attributes/qa-02'),
    'reliability path must link QA-02',
  );
  const distributedPath = await pathBody('03-distributed-systems.mdx');
  assert.ok(
    extractInternalLinks({
      body: distributedPath,
      file: 'paths/03-distributed-systems.mdx',
    }).includes('/quality-attributes/qa-03'),
    'distributed path must link QA-03',
  );
});

test('raster illustration and ledger integration', async () => {
  for (const [id, imagePath] of images) {
    const imageFile = new URL(`../static${imagePath}`, import.meta.url);
    let image;
    try {
      image = await readFile(imageFile);
    } catch (error) {
      if (error.code === 'ENOENT') {
        assert.fail(`${id} must ship ${imagePath}`);
      }
      throw error;
    }
    assert.ok(image.length >= 24, `${id} PNG must contain an IHDR`);
    assert.deepEqual(
      image.subarray(0, 8),
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      `${id} illustration must be PNG`,
    );
    const width = image.readUInt32BE(16);
    const height = image.readUInt32BE(20);
    assert.ok(width > 0 && height > 0, `${id} PNG dimensions`);
    assert.equal(width * 9, height * 16, `${id} PNG must be exactly 16:9`);

    const document = requiredDocument(id);
    assert.match(document.body, new RegExp(imagePath.replaceAll('/', '\\/'), 'u'));
    const governed = requiredLedgerDocument(id);
    const illustrationCitation = governed.citations.find(
      ({citation_url: citationUrl, usage_mode: usageMode}) =>
        citationUrl === imagePath && usageMode === 'original-illustration',
    );
    assert.ok(illustrationCitation, `${id} must govern its raster illustration`);
    assert.deepEqual(illustrationCitation.roles, ['illustration'], id);
    assert.ok(
      illustrationCitation.modification_note?.trim(),
      `${id} illustration needs a project-specific generation note`,
    );

    const source = sourcesById.get(illustrationCitation.source_id);
    assert.ok(source, `${id} illustration source must exist`);
    assert.equal(source.canonical_locator, imagePath, id);
    assert.equal(source.source_kind, 'original-illustration', id);
    assert.equal(source.license, 'LicenseRef-Atlas-Original', id);
    assert.equal(source.copyright_policy, 'original-atlas', id);
    assert.deepEqual(source.allowed_evidence_roles, ['illustration'], id);
  }
});
