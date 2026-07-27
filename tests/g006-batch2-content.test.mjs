import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  extractMarkdownBody,
  readContentDocuments,
} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {extractExternalLinks} from '../scripts/source-ledger.mjs';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const expected = new Map([
  [
    'QA-04',
    [
      'quality-attributes/qa-04-scalability-elasticity.mdx',
      '/quality-attributes/qa-04',
    ],
  ],
  [
    'QA-06',
    [
      'quality-attributes/qa-06-maintainability-modifiability-testability.mdx',
      '/quality-attributes/qa-06',
    ],
  ],
  [
    'QA-07',
    [
      'quality-attributes/qa-07-compatibility-interoperability-versioning.mdx',
      '/quality-attributes/qa-07',
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
const relationships = new Map([
  [
    'QA-04',
    {
      dependsOn: ['QA-00', 'QA-03'],
      adjacent: ['QA-03', 'QA-06', 'QA-07', 'QA-08', 'QA-10'],
      cases: [
        '/cases/aws-cell-shuffle-sharding',
        '/cases/cloudflare-durable-objects-workerd',
      ],
    },
  ],
  [
    'QA-06',
    {
      dependsOn: ['QA-00', 'QA-04'],
      adjacent: ['QA-04', 'QA-07', 'QA-10'],
      cases: [
        '/cases/micro-frontends-single-spa',
        '/cases/openai-agents-sdk',
      ],
    },
  ],
  [
    'QA-07',
    {
      dependsOn: ['QA-00', 'QA-04', 'QA-06'],
      adjacent: ['QA-04', 'QA-05', 'QA-06'],
      cases: [
        '/cases/google-adk-a2a',
        '/cases/micro-frontends-single-spa',
      ],
    },
  ],
]);
const remoteIds = [
  'src-azure-waf-scale-partition',
  'src-google-cloud-waf-elasticity',
  'src-sei-maintainability-2020',
  'src-oas-3-1-1',
  'src-oas-index',
  'src-google-aip-180',
  'src-google-aip-185',
];
const solePrimary = new Map([
  ['QA-04', 'src-azure-waf-scale-partition'],
  ['QA-06', 'src-sei-maintainability-2020'],
  ['QA-07', 'src-oas-3-1-1'],
]);
const illustrations = new Map([
  [
    'QA-04',
    {
      path: '/img/illustrations/qa-04-demand-capacity-scaling.png',
      sourceId: 'src-atlas-qa04-demand-capacity-ed17b00c2893',
      alt: '辨认需求、容量、扩缩控制、分区与共享瓶颈边界',
      caption:
        '扩缩控制只能调整已有容量；共享瓶颈、观察延迟与重分区风险仍需独立验证。',
    },
  ],
  [
    'QA-06',
    {
      path: '/img/illustrations/qa-06-change-blast-radius-verification.png',
      sourceId: 'src-atlas-qa06-change-blast-radius-a0b9f7da9e27',
      alt: '追踪合同变化的依赖半径、定向测试与运行验证',
      caption:
        '测试通过与生产验证是两道不同证据门；未验证影响必须进入遏制或回滚分支。',
    },
  ],
  [
    'QA-07',
    {
      path: '/img/illustrations/qa-07-compatibility-version-migration.png',
      sourceId: 'src-atlas-qa07-compatibility-migration-3a08b4d4f6ce',
      alt: '分层检查源码、传输与语义兼容以及版本迁移边界',
      caption:
        '接口形状相同不等于语义兼容；移除旧版本前还要验证互操作行为与迁移证据。',
    },
  ],
]);
const pathLinks = new Map([
  ['03-distributed-systems.mdx', ['/quality-attributes/qa-03', '/quality-attributes/qa-04']],
  ['07-cloud-native-platform.mdx', ['/quality-attributes/qa-04']],
  ['02-module-boundaries.mdx', ['/quality-attributes/qa-06']],
  ['10-agent-platform-gateway.mdx', ['/quality-attributes/qa-07']],
]);

const [documents, manifest, ledger, backlog] = await Promise.all([
  readContentDocuments(contentRoot),
  readFile(
    new URL('../src/generated/topic-manifest.json', import.meta.url),
    'utf8',
  ).then(JSON.parse),
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(
    JSON.parse,
  ),
  readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
]);
const documentsById = new Map(
  documents
    .filter(({metadata}) => typeof metadata.topic_id === 'string')
    .map((document) => [document.metadata.topic_id, document]),
);
const topicsById = new Map(manifest.topics.map((topic) => [topic.id, topic]));
const sourcesById = new Map(ledger.sources.map((source) => [source.id, source]));

function requiredDocument(id) {
  const document = documentsById.get(id);
  assert.ok(document, `${id} must be published`);
  return document;
}

function governedDocument(id) {
  const [file] = expected.get(id);
  const entry = ledger.documents[`content/${file}`];
  assert.ok(entry, `${id} must have a governed document entry`);
  return entry;
}

test('articles and deterministic representations', () => {
  for (const [id, [file, slug]] of expected) {
    const document = requiredDocument(id);
    const relation = relationships.get(id);
    assert.equal(document.file, file);
    assert.equal(document.metadata.slug, slug);
    assert.equal(document.metadata.content_type, 'quality-attribute');
    assert.equal(document.metadata.status, 'reviewed');
    assert.deepEqual(document.metadata.depends_on, relation.dependsOn);
    assert.deepEqual(document.metadata.adjacent_topics, relation.adjacent);
    assert.deepEqual(document.metadata.related_cases, relation.cases);
    assert.deepEqual(
      document.headings
        .filter(({level}) => level === 2)
        .map(({text}) => text),
      h2,
      `${id} H2 sequence`,
    );
    const body = extractMarkdownBody(document.source);
    assert.match(body, /(?:本站原创|本站整理|Atlas synthesis)/iu, `${id} original representation`);
    assert.match(
      body,
      /```mermaid[\s\S]*?```|^\|.+\|\n\|(?:\s*:?-{3,}:?\s*\|)+/mu,
      `${id} deterministic representation`,
    );
    for (const requiredCase of relation.cases) {
      assert.ok(extractInternalLinks(document).includes(requiredCase), `${id} ${requiredCase}`);
    }
    const topic = topicsById.get(id);
    assert.ok(topic?.published, `${id} manifest publication`);
    assert.equal(topic.slug, slug);
  }

  assert.equal(documentsById.has('QA-10'), true, 'QA-10 is published by the final G006 batch');
  assert.match(backlog, /^- \[x\] \*\*QA-10 /mu, 'QA-10 is closed by the final G006 deployment');
});

test('reciprocal relationships', () => {
  for (const [id, relation] of relationships) {
    const links = new Set(extractInternalLinks(requiredDocument(id)));
    for (const adjacent of relation.adjacent) {
      const slug =
        expected.get(adjacent)?.[1] ?? topicsById.get(adjacent)?.slug;
      assert.ok(links.has(slug), `${id} must visibly link ${adjacent}`);
      const reverse = new Set(extractInternalLinks(requiredDocument(adjacent)));
      assert.ok(reverse.has(expected.get(id)[1]), `${adjacent} must visibly link ${id}`);
    }
  }
});

test('remote governance', () => {
  for (const sourceId of remoteIds) {
    const source = sourcesById.get(sourceId);
    assert.ok(source, `${sourceId} must be registered`);
    assert.ok(source.version?.trim(), `${sourceId} version`);
    assert.ok(source.checked_at, `${sourceId} checked date`);
    assert.ok(source.author_or_org?.trim(), `${sourceId} author`);
    assert.ok(source.license_evidence_url?.trim(), `${sourceId} license evidence`);
    assert.ok(source.license_scope?.trim(), `${sourceId} license scope`);
    assert.ok(source.usage_boundary?.trim(), `${sourceId} claim boundary`);
  }

  for (const id of expected.keys()) {
    const document = requiredDocument(id);
    const visible = new Set(extractExternalLinks(document));
    const citations = governedDocument(id).citations;
    assert.ok(
      citations.every(({usage_mode: usageMode}) =>
        ['facts-summary', 'navigation-only', 'original-illustration'].includes(
          usageMode,
        ),
      ),
      `${id} must not adapt source composition`,
    );
    const primary = citations.filter(({manifest_primary: value}) => value);
    assert.equal(primary.length, 1, `${id} sole primary`);
    assert.equal(primary[0].source_id, solePrimary.get(id), `${id} primary source`);
    assert.ok(
      topicsById.get(id)?.primary_sources.includes(primary[0].citation_url),
      `${id} primary projection`,
    );
    const domains = new Set();
    for (const citation of citations) {
      if (citation.citation_url.startsWith('https://')) {
        assert.ok(
          visible.has(citation.citation_url),
          `${id} visible ${citation.citation_url}`,
        );
        domains.add(new URL(citation.citation_url).hostname);
      }
    }
    assert.ok(domains.size >= 2, `${id} independent domains`);
    const awesome = citations.find(
      ({source_id: sourceId}) => sourceId === 'src-github-432a30aa96cb',
    );
    assert.deepEqual(awesome?.roles, ['learning'], `${id} Awesome roles`);
    assert.equal(awesome?.usage_mode, 'navigation-only', `${id} Awesome usage`);
    assert.equal(awesome?.manifest_primary, false, `${id} Awesome primary`);
  }
});

test('learning paths', async () => {
  for (const [file, slugs] of pathLinks) {
    const source = await readFile(
      new URL(`../content/paths/${file}`, import.meta.url),
      'utf8',
    );
    const body = extractMarkdownBody(source);
    let previous = -1;
    for (const slug of slugs) {
      const index = body.indexOf(slug);
      assert.notEqual(index, -1, `${file} must link ${slug}`);
      assert.ok(index > previous, `${file} must order ${slug}`);
      previous = index;
    }
  }
});

test('raster assets and rights', async () => {
  const sourceIds = new Set();
  for (const [id, illustration] of illustrations) {
    const image = await readFile(
      new URL(`../static${illustration.path}`, import.meta.url),
    );
    assert.ok(image.length >= 24, `${id} PNG must contain an IHDR`);
    assert.deepEqual(
      image.subarray(0, 8),
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      `${id} illustration must be PNG`,
    );
    const width = image.readUInt32BE(16);
    const height = image.readUInt32BE(20);
    assert.equal(width * 9, height * 16, `${id} PNG must be exactly 16:9`);

    const body = requiredDocument(id).body;
    assert.match(
      body,
      new RegExp(
        `!\\[${illustration.alt}\\]\\(${illustration.path.replaceAll('/', '\\/')}\\)`,
        'u',
      ),
      `${id} meaningful illustration alt`,
    );
    assert.match(
      body,
      new RegExp(`\\*图：${illustration.caption.replaceAll('/', '\\/')}\\*`, 'u'),
      `${id} meaningful illustration caption`,
    );

    const governed = governedDocument(id);
    const citation = governed.citations.find(
      ({source_id: sourceId}) => sourceId === illustration.sourceId,
    );
    assert.ok(citation, `${id} illustration citation`);
    assert.equal(citation.citation_url, illustration.path, id);
    assert.deepEqual(citation.roles, ['illustration'], id);
    assert.equal(citation.usage_mode, 'original-illustration', id);
    assert.equal(citation.manifest_primary, false, id);
    assert.ok(citation.modification_note?.trim(), `${id} generation note`);

    const source = sourcesById.get(illustration.sourceId);
    assert.ok(source, `${id} illustration source`);
    assert.equal(source.canonical_locator, illustration.path, id);
    assert.equal(source.transport_locator, illustration.path, id);
    assert.equal(source.source_kind, 'original-illustration', id);
    assert.equal(source.tier, 'primary', id);
    assert.deepEqual(source.allowed_evidence_roles, ['illustration'], id);
    assert.equal(source.license, 'LicenseRef-Atlas-Original', id);
    assert.equal(source.copyright_policy, 'original-atlas', id);
    assert.match(source.usage_boundary, /does not establish factual claims/iu, id);
    sourceIds.add(source.id);
  }
  assert.equal(sourceIds.size, illustrations.size, 'illustration IDs must be unique');
});
