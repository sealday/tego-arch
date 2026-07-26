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
  ['QA-05', ['quality-attributes/qa-05-security-privacy-trust.mdx', '/quality-attributes/qa-05']],
  ['QA-08', ['quality-attributes/qa-08-operability-observability.mdx', '/quality-attributes/qa-08']],
  ['QA-09', ['quality-attributes/qa-09-safety-physical-risk.mdx', '/quality-attributes/qa-09']],
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
  ['QA-05', {
    dependsOn: ['QA-00', 'QA-01'],
    adjacent: ['QA-07', 'QA-08', 'QA-09'],
    cases: [
      '/cases/microsoft-multi-agent-reference-architecture',
      '/cases/cloudflare-durable-objects-workerd',
    ],
  }],
  ['QA-08', {
    dependsOn: ['QA-00', 'QA-02', 'QA-04'],
    adjacent: ['QA-02', 'QA-04', 'QA-05', 'QA-09'],
    cases: ['/cases/aws-cell-shuffle-sharding', '/cases/openai-agents-sdk'],
  }],
  ['QA-09', {
    dependsOn: ['QA-00', 'QA-02'],
    adjacent: ['QA-05', 'QA-08'],
    cases: ['/cases/kubeedge-cloud-edge-autonomy'],
  }],
]);
const remoteIds = [
  'src-nist-sp800-160v1r1',
  'src-nist-privacy-framework-1',
  'src-opentelemetry-observability-primer',
  'src-sre-managing-incidents',
  'src-faa-order-8040-4c',
  'src-stpa-handbook-2018',
];
const solePrimary = new Map([
  ['QA-05', 'src-nist-sp800-160v1r1'],
  ['QA-08', 'src-opentelemetry-observability-primer'],
  ['QA-09', 'src-faa-order-8040-4c'],
]);
const illustrations = new Map([
  [
    'QA-05',
    {
      path: '/img/illustrations/qa-05-data-trust-boundaries.png',
      sourceId: 'src-atlas-qa05-data-trust-boundaries-8d53f1c92a64',
      alt: '追踪数据目的、最小字段和授权上下文跨越三道信任边界',
      caption:
        '信任边界要求重建身份、租户、权限、目的与完整性约束，而不是把网络分段当作授权证明。',
    },
  ],
  [
    'QA-08',
    {
      path: '/img/illustrations/qa-08-operability-recovery-loop.png',
      sourceId: 'src-atlas-qa08-operability-recovery-loop-6b1e9d42c7f5',
      alt: '串联用户影响、关联信号、受控动作、恢复验证和事件学习',
      caption:
        '遥测和自动化只有进入有责任、停止、回滚、审计与用户恢复验证的闭环，才形成可运维证据。',
    },
  ],
  [
    'QA-09',
    {
      path: '/img/illustrations/qa-09-safety-control-loop.png',
      sourceId: 'src-atlas-qa09-safety-control-loop-c4a7e83b1d96',
      alt: '检查数字控制进入物理过程时的反馈、四类不安全动作和故障安全分支',
      caption:
        'Security、可靠性、人工复核或冗余都不能单独证明 Safety；控制动作必须结合反馈、时序、权限与运行边界验证。',
    },
  ],
]);
const pathLinks = new Map([
  ['05-production-governance.mdx', ['/quality-attributes/qa-05', '/quality-attributes/qa-08']],
  ['07-cloud-native-platform.mdx', ['/quality-attributes/qa-04', '/quality-attributes/qa-08']],
  ['09-edge-physical-agents.mdx', ['/quality-attributes/qa-09']],
  ['10-agent-platform-gateway.mdx', ['/quality-attributes/qa-07', '/quality-attributes/qa-05', '/quality-attributes/qa-08']],
]);

const [documents, manifest, ledger, linkHealth, backlog] = await Promise.all([
  readContentDocuments(contentRoot),
  readFile(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/source-link-health.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../docs/content-backlog.md', import.meta.url), 'utf8'),
]);
const documentsById = new Map(
  documents.filter(({metadata}) => metadata.topic_id).map((document) => [document.metadata.topic_id, document]),
);
const topicsById = new Map(manifest.topics.map((topic) => [topic.id, topic]));
const sourcesById = new Map(ledger.sources.map((source) => [source.id, source]));
const healthBySourceId = new Map(
  linkHealth.results.flatMap((result) => result.source_ids.map((sourceId) => [sourceId, result])),
);

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
      document.headings.filter(({level}) => level === 2).map(({text}) => text),
      h2,
      `${id} H2 sequence`,
    );
    const body = extractMarkdownBody(document.source);
    assert.match(body, /(?:本站原创|本站整理|Atlas synthesis)/iu);
    assert.match(body, /```mermaid[\s\S]*?```|^\|.+\|\n\|(?:\s*:?-{3,}:?\s*\|)+/mu);
    assert.match(body, /说明性场景/u);
    for (const route of relation.cases) {
      assert.ok(extractInternalLinks(document).includes(route), `${id} ${route}`);
    }
    assert.equal(topicsById.get(id)?.slug, slug);
  }
  assert.equal(documentsById.has('QA-10'), false);
  assert.match(backlog, /^- \[ \] \*\*QA-10 /mu);
});

test('security privacy and safety boundaries', () => {
  const security = extractMarkdownBody(requiredDocument('QA-05').source);
  assert.match(security, /资产|asset/iu);
  assert.match(security, /数据主体|subject/iu);
  assert.match(security, /处理目的|purpose/iu);
  assert.match(security, /信任边界.{0,100}(?:假设|授权上下文)/su);
  assert.match(security, /威胁.{0,160}隐私伤害|隐私伤害.{0,160}威胁/su);
  assert.match(security, /目的限制/u);
  assert.match(security, /最小化/u);
  assert.match(security, /保留.{0,100}删除|删除.{0,100}保留/su);
  assert.match(security, /派生数据/u);
  assert.match(security, /日志.{0,100}备份|备份.{0,100}日志/su);
  assert.match(security, /加密.{0,100}(?:不能|不等于|不证明)/su);
  assert.match(security, /合规.{0,100}(?:不能|不等于|不证明)/su);

  const operability = extractMarkdownBody(requiredDocument('QA-08').source);
  assert.match(operability, /monitoring.{0,160}observability.{0,160}operability/isu);
  assert.match(operability, /用户影响.{0,500}信号.{0,500}诊断.{0,500}受控.{0,500}用户可见.{0,500}学习/su);
  for (const role of ['on-call', '事件指挥', '运行操作', '沟通', '长期负责人']) {
    assert.match(operability, new RegExp(role, 'iu'));
  }
  assert.match(operability, /遥测.{0,100}(?:不能|不等于|不证明)/su);
  assert.match(operability, /自动化.{0,100}(?:不能|不等于|不证明)/su);

  const safety = extractMarkdownBody(requiredDocument('QA-09').source);
  assert.match(safety, /Safety.{0,180}Security.{0,180}可靠性|可靠性.{0,180}Security.{0,180}Safety/isu);
  assert.match(safety, /损失.{0,300}危害.{0,300}控制结构.{0,300}不安全控制动作.{0,300}安全约束.{0,300}残余风险/su);
  for (const category of ['未提供', '不安全情境', '时机或顺序错误', '持续过久或过早停止']) {
    assert.match(safety, new RegExp(category, 'u'));
  }
  for (const boundary of ['反馈', '权限', '时序', '执行器可用性']) {
    assert.match(safety, new RegExp(boundary, 'u'));
  }
  assert.match(safety, /数值阈值.{0,100}(?:占位|领域)/su);
  assert.match(safety, /认证标签.{0,100}(?:不能|不等于|不证明)/su);
});

test('reciprocal relationships', () => {
  for (const [id, relation] of relationships) {
    const links = new Set(extractInternalLinks(requiredDocument(id)));
    for (const adjacent of relation.adjacent) {
      const adjacentSlug = expected.get(adjacent)?.[1] ?? topicsById.get(adjacent)?.slug;
      assert.ok(links.has(adjacentSlug), `${id} must visibly link ${adjacent}`);
      const reverse = new Set(extractInternalLinks(requiredDocument(adjacent)));
      assert.ok(reverse.has(expected.get(id)[1]), `${adjacent} must visibly link ${id}`);
    }
  }
});

test('remote governance', () => {
  for (const sourceId of remoteIds) {
    const source = sourcesById.get(sourceId);
    assert.ok(source, `${sourceId} registration`);
    for (const field of ['version', 'checked_at', 'author_or_org', 'license_evidence_url', 'license_scope', 'usage_boundary']) {
      assert.ok(source[field]?.trim(), `${sourceId} ${field}`);
    }
    const health = healthBySourceId.get(sourceId);
    assert.ok(health, `${sourceId} link health`);
    assert.equal(health.last_attempt.outcome, 'healthy', `${sourceId} transport`);
  }

  const awesome = sourcesById.get('src-github-432a30aa96cb');
  assert.equal(awesome.title, 'Awesome Software Architecture');
  assert.match(awesome.usage_boundary, /repository-wide|全仓库/iu);
  assert.match(awesome.usage_boundary, /factual|事实/iu);
  assert.match(awesome.usage_boundary, /effectiveness|效果/iu);

  for (const id of expected.keys()) {
    const document = requiredDocument(id);
    const visible = new Set(extractExternalLinks(document));
    const citations = governedDocument(id).citations;
    const primary = citations.filter(({manifest_primary: value}) => value);
    assert.equal(primary.length, 1, `${id} sole primary`);
    assert.equal(primary[0].source_id, solePrimary.get(id), `${id} primary`);
    const domains = new Set();
    for (const citation of citations) {
      if (!citation.citation_url.startsWith('https://')) continue;
      assert.ok(visible.has(citation.citation_url), `${id} visible ${citation.citation_url}`);
      domains.add(new URL(citation.citation_url).hostname);
    }
    assert.ok(domains.size >= 2, `${id} independent domains`);
    const awesomeCitation = citations.find(({source_id}) => source_id === awesome.id);
    assert.deepEqual(awesomeCitation?.roles, ['learning']);
    assert.equal(awesomeCitation?.usage_mode, 'navigation-only');
    assert.equal(awesomeCitation?.manifest_primary, false);
  }
});

test('learning paths', async () => {
  for (const [file, slugs] of pathLinks) {
    const body = extractMarkdownBody(
      await readFile(new URL(`../content/paths/${file}`, import.meta.url), 'utf8'),
    );
    let previous = -1;
    for (const slug of slugs) {
      const index = body.indexOf(slug);
      assert.notEqual(index, -1, `${file} ${slug}`);
      assert.ok(index > previous, `${file} order ${slug}`);
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

    const citation = governedDocument(id).citations.find(
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
    if (id === 'QA-05') {
      for (const boundary of ['TB-1', 'TB-2', 'TB-3']) {
        assert.match(source.usage_boundary, new RegExp(boundary, 'u'), `${id} ${boundary}`);
      }
      for (const constraint of ['identity', 'tenant', 'permission', 'purpose', 'integrity']) {
        assert.match(
          source.usage_boundary,
          new RegExp(constraint, 'u'),
          `${id} complete ${constraint} contract`,
        );
      }
      assert.doesNotMatch(
        `${source.license_scope}\n${source.usage_boundary}\n${citation.modification_note}`,
        /policy-version|策略版本/iu,
        `${id} must not split policy-version into TB-3`,
      );
    }
    sourceIds.add(source.id);
  }
  assert.equal(sourceIds.size, illustrations.size, 'illustration IDs must be unique');
});
