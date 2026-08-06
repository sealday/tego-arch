import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const contracts = new Map([
  ['content/quality-attributes/index.mdx', {urls: [], sourceLabels: {}}],
  ['content/quality-attributes/qa-00-overview.mdx', {
    urls: ['/cases/microsoft-multi-agent-reference-architecture', '/concepts/fnd-02', '/img/illustrations/qa-00-quality-model-boundaries.png', '/quality-attributes', '/quality-attributes/qa-01', '/quality-attributes/qa-01', '/quality-attributes/qa-02', '/quality-attributes/qa-02', '/quality-attributes/qa-03', '/quality-attributes/qa-03', 'https://www.iso.org/standard/78176.html', 'https://www.iso.org/standard/78176.html', 'https://www.sei.cmu.edu/library/quality-attributes/', 'https://www.sei.cmu.edu/library/quality-attributes/'],
    sourceLabels: {'https://www.iso.org/standard/78176.html': 'ISO/IEC 25010:2023', 'https://www.sei.cmu.edu/library/quality-attributes/': 'SEI — Quality Attributes'},
  }],
  ['content/quality-attributes/qa-01-scenario-writing.mdx', {
    urls: ['/cases/aws-cell-shuffle-sharding', '/methods/mth-03', '/modeling/mod-01', '/patterns/rel-02', '/principles/pr-07', '/quality-attributes', '/quality-attributes/qa-00', '/quality-attributes/qa-00', '/quality-attributes/qa-02', 'https://www.iso.org/standard/78176.html', 'https://www.sei.cmu.edu/library/quality-attribute-workshops-qaws-third-edition/'],
    sourceLabels: {'https://www.sei.cmu.edu/library/quality-attribute-workshops-qaws-third-edition/': 'SEI Quality Attribute Workshops, Third Edition', 'https://www.iso.org/standard/78176.html': 'ISO/IEC 25010:2023'},
  }],
  ['content/quality-attributes/qa-02-reliability-availability-recoverability.mdx', {
    urls: ['/cases/aws-cell-shuffle-sharding', '/cases/temporal-saga-durable-execution', '/img/illustrations/qa-02-failure-recovery-boundaries.png', '/modeling/mod-08', '/modeling/mod-12', '/quality-attributes', '/quality-attributes/qa-00', '/quality-attributes/qa-00', '/quality-attributes/qa-01', '/quality-attributes/qa-01', '/quality-attributes/qa-03', '/quality-attributes/qa-08', 'https://sre.google/sre-book/addressing-cascading-failures/', 'https://sre.google/sre-book/addressing-cascading-failures/', 'https://sre.google/sre-book/availability-table/', 'https://sre.google/sre-book/availability-table/', 'https://www.sei.cmu.edu/library/quality-attributes/'],
    sourceLabels: {'https://sre.google/sre-book/availability-table/': 'Google SRE Book — Appendix A: Availability Table', 'https://sre.google/sre-book/addressing-cascading-failures/': 'Google SRE Book — Addressing Cascading Failures', 'https://www.sei.cmu.edu/library/quality-attributes/': 'SEI — Quality Attributes'},
  }],
  ['content/quality-attributes/qa-03-performance-latency-throughput-capacity.mdx', {
    urls: ['/cases/apache-kafka-consumer-groups', '/cases/cloudflare-durable-objects-workerd', '/img/illustrations/qa-03-load-saturation-boundaries.png', '/quality-attributes', '/quality-attributes/qa-00', '/quality-attributes/qa-00', '/quality-attributes/qa-02', '/quality-attributes/qa-02', '/quality-attributes/qa-04', '/quality-attributes/qa-10', 'https://sre.google/sre-book/handling-overload/', 'https://sre.google/sre-book/handling-overload/', 'https://sre.google/sre-book/monitoring-distributed-systems/', 'https://sre.google/sre-book/monitoring-distributed-systems/', 'https://www.sei.cmu.edu/library/quality-attributes/'],
    sourceLabels: {'https://sre.google/sre-book/handling-overload/': 'Google SRE Book — Handling Overload', 'https://sre.google/sre-book/monitoring-distributed-systems/': 'Google SRE Book — Monitoring Distributed Systems', 'https://www.sei.cmu.edu/library/quality-attributes/': 'SEI — Quality Attributes'},
  }],
  ['content/quality-attributes/qa-04-scalability-elasticity.mdx', {
    urls: ['/cases/aws-cell-shuffle-sharding', '/cases/cloudflare-durable-objects-workerd', '/img/illustrations/qa-04-demand-capacity-scaling.png', '/quality-attributes', '/quality-attributes/qa-03', '/quality-attributes/qa-03', '/quality-attributes/qa-06', '/quality-attributes/qa-07', '/quality-attributes/qa-08', '/quality-attributes/qa-10', 'https://docs.cloud.google.com/architecture/framework/performance-optimization/elasticity', 'https://docs.cloud.google.com/architecture/framework/performance-optimization/elasticity', 'https://github.com/mehdihadeli/awesome-software-architecture', 'https://learn.microsoft.com/en-us/azure/well-architected/performance-efficiency/scale-partition', 'https://learn.microsoft.com/en-us/azure/well-architected/performance-efficiency/scale-partition'],
    sourceLabels: {'https://learn.microsoft.com/en-us/azure/well-architected/performance-efficiency/scale-partition': 'Microsoft Azure Well-Architected — Optimize scaling and partitioning', 'https://docs.cloud.google.com/architecture/framework/performance-optimization/elasticity': 'Google Cloud Architecture Framework — Take advantage of elasticity', 'https://github.com/mehdihadeli/awesome-software-architecture': 'Awesome Software Architecture'},
  }],
  ['content/quality-attributes/qa-05-security-privacy-trust.mdx', {
    urls: ['/cases/cloudflare-durable-objects-workerd', '/cases/microsoft-multi-agent-reference-architecture', '/img/illustrations/qa-05-data-trust-boundaries.png', '/modeling/mod-12', '/quality-attributes', '/quality-attributes/qa-00', '/quality-attributes/qa-01', '/quality-attributes/qa-07', '/quality-attributes/qa-08', '/quality-attributes/qa-09', 'https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html', 'https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final', 'https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final', 'https://doi.org/10.6028/NIST.CSWP.01162020', 'https://doi.org/10.6028/NIST.CSWP.01162020', 'https://github.com/mehdihadeli/awesome-software-architecture'],
    sourceLabels: {'https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final': 'NIST SP 800-160 Vol. 1 Rev. 1', 'https://doi.org/10.6028/NIST.CSWP.01162020': 'NIST Privacy Framework 1.0', 'https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html': 'OWASP Threat Modeling Cheat Sheet', 'https://github.com/mehdihadeli/awesome-software-architecture': 'Awesome Software Architecture'},
  }],
  ['content/quality-attributes/qa-06-maintainability-modifiability-testability.mdx', {
    urls: ['/cases/micro-frontends-single-spa', '/cases/openai-agents-sdk', '/img/illustrations/qa-06-change-blast-radius-verification.png', '/quality-attributes', '/quality-attributes/qa-04', '/quality-attributes/qa-07', '/quality-attributes/qa-10', 'https://github.com/mehdihadeli/awesome-software-architecture', 'https://www.iso.org/standard/78176.html', 'https://www.iso.org/standard/78176.html', 'https://www.sei.cmu.edu/library/maintainability/', 'https://www.sei.cmu.edu/library/maintainability/'],
    sourceLabels: {'https://www.sei.cmu.edu/library/maintainability/': 'SEI — Maintainability, CMU/SEI-2020-TR-006', 'https://www.iso.org/standard/78176.html': 'ISO/IEC 25010:2023', 'https://github.com/mehdihadeli/awesome-software-architecture': 'Awesome Software Architecture'},
  }],
  ['content/quality-attributes/qa-07-compatibility-interoperability-versioning.mdx', {
    urls: ['/cases/google-adk-a2a', '/cases/micro-frontends-single-spa', '/img/illustrations/qa-07-compatibility-version-migration.png', '/quality-attributes', '/quality-attributes/qa-04', '/quality-attributes/qa-05', '/quality-attributes/qa-06', 'https://github.com/mehdihadeli/awesome-software-architecture', 'https://google.aip.dev/180', 'https://google.aip.dev/180', 'https://google.aip.dev/185', 'https://google.aip.dev/185', 'https://spec.openapis.org/oas/', 'https://spec.openapis.org/oas/', 'https://spec.openapis.org/oas/v3.1.1.html', 'https://spec.openapis.org/oas/v3.1.1.html'],
    sourceLabels: {'https://spec.openapis.org/oas/v3.1.1.html': 'OpenAPI Specification v3.1.1', 'https://spec.openapis.org/oas/': 'OpenAPI Specification versions and schemas', 'https://google.aip.dev/180': 'Google AIP-180 — Backwards compatibility', 'https://google.aip.dev/185': 'Google AIP-185 — API Versioning', 'https://github.com/mehdihadeli/awesome-software-architecture': 'Awesome Software Architecture'},
  }],
  ['content/quality-attributes/qa-08-operability-observability.mdx', {
    urls: ['/cases/aws-cell-shuffle-sharding', '/cases/openai-agents-sdk', '/img/illustrations/qa-08-operability-recovery-loop.png', '/quality-attributes', '/quality-attributes/qa-02', '/quality-attributes/qa-02', '/quality-attributes/qa-04', '/quality-attributes/qa-04', '/quality-attributes/qa-05', '/quality-attributes/qa-09', '/quality-attributes/qa-10', 'https://github.com/mehdihadeli/awesome-software-architecture', 'https://opentelemetry.io/docs/concepts/observability-primer/', 'https://opentelemetry.io/docs/concepts/observability-primer/', 'https://sre.google/sre-book/managing-incidents/', 'https://sre.google/sre-book/managing-incidents/', 'https://sre.google/sre-book/monitoring-distributed-systems/', 'https://sre.google/sre-book/monitoring-distributed-systems/'],
    sourceLabels: {'https://opentelemetry.io/docs/concepts/observability-primer/': 'OpenTelemetry — Observability Primer', 'https://sre.google/sre-book/monitoring-distributed-systems/': 'Google SRE Book — Monitoring Distributed Systems', 'https://sre.google/sre-book/managing-incidents/': 'Google SRE Book — Managing Incidents', 'https://github.com/mehdihadeli/awesome-software-architecture': 'Awesome Software Architecture'},
  }],
  ['content/quality-attributes/qa-09-safety-physical-risk.mdx', {
    urls: ['/cases/kubeedge-cloud-edge-autonomy', '/img/illustrations/qa-09-safety-control-loop.png', '/quality-attributes', '/quality-attributes/qa-00', '/quality-attributes/qa-02', '/quality-attributes/qa-05', '/quality-attributes/qa-08', 'https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final', 'https://github.com/mehdihadeli/awesome-software-architecture', 'https://psas.scripts.mit.edu/home/get_file.php?name=STPA_handbook.pdf', 'https://psas.scripts.mit.edu/home/get_file.php?name=STPA_handbook.pdf', 'https://www.faa.gov/documentLibrary/media/Order/FAA_Order_8040.4C.pdf', 'https://www.faa.gov/documentLibrary/media/Order/FAA_Order_8040.4C.pdf'],
    sourceLabels: {'https://www.faa.gov/documentLibrary/media/Order/FAA_Order_8040.4C.pdf': 'FAA Order 8040.4C', 'https://psas.scripts.mit.edu/home/get_file.php?name=STPA_handbook.pdf': 'STPA Handbook, MIT-STAMP-001', 'https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final': 'NIST SP 800-160 Vol. 1 Rev. 1', 'https://github.com/mehdihadeli/awesome-software-architecture': 'Awesome Software Architecture'},
  }],
  ['content/quality-attributes/qa-10-cost-efficiency-sustainability.mdx', {
    urls: ['/cases/aws-cell-shuffle-sharding', '/cases/litellm-virtual-keys-governance', '/img/illustrations/qa-10-value-cost-sustainability-boundaries.png', '/quality-attributes', '/quality-attributes/qa-01', '/quality-attributes/qa-03', '/quality-attributes/qa-04', '/quality-attributes/qa-06', '/quality-attributes/qa-08', 'https://github.com/mehdihadeli/awesome-software-architecture', 'https://sci.greensoftware.foundation/', 'https://sci.greensoftware.foundation/', 'https://www.finops.org/framework/', 'https://www.finops.org/framework/'],
    sourceLabels: {'https://www.finops.org/framework/': 'FinOps Framework', 'https://sci.greensoftware.foundation/': 'Software Carbon Intensity Specification', 'https://github.com/mehdihadeli/awesome-software-architecture': 'Awesome Software Architecture'},
  }],
]);

const markdownLinks = (source) => [...source.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/gu)];

test('locks every quality-attribute Markdown URL multiset and source title', async () => {
  for (const [file, expected] of contracts) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    const urls = markdownLinks(source).map((match) => match[1]).sort();
    assert.deepEqual(urls, expected.urls, `${file} URL multiset`);

    const sourceSection = source.slice(source.indexOf('\n## 来源\n'));
    const sourceLabels = Object.fromEntries(
      markdownLinks(sourceSection)
        .filter((match) => match[1].startsWith('https://'))
        .map((match) => [match[1], match[0].match(/^!?\[([^\]]*)\]/u)[1]]),
    );
    assert.deepEqual(sourceLabels, expected.sourceLabels, `${file} source titles`);
  }
});

test('preserves formal quality-attribute identities in reader-facing definitions', async () => {
  const qa02 = await readFile(new URL('../content/quality-attributes/qa-02-reliability-availability-recoverability.mdx', import.meta.url), 'utf8');
  assert.match(qa02, /恢复时间目标（Recovery Time Objective，RTO）/u);
  assert.match(qa02, /恢复点目标（Recovery Point Objective，RPO）/u);

  const qa03 = await readFile(new URL('../content/quality-attributes/qa-03-performance-latency-throughput-capacity.mdx', import.meta.url), 'utf8');
  assert.doesNotMatch(qa03, /吞吐\s+不说明|服务时间\s+是|平均（平均）|尾部（尾部）|容量\s+是/u);
  assert.match(qa03, /输入负载（offered load）.{0,120}完成吞吐/su);
  assert.match(qa03, /服务时间.{0,120}排队/su);
  assert.match(qa03, /平均.{0,120}中位.{0,120}分位.{0,120}尾部/su);
  assert.match(qa03, /容量包络.{0,160}资源.{0,160}依赖/su);

  const qa05 = await readFile(new URL('../content/quality-attributes/qa-05-security-privacy-trust.mdx', import.meta.url), 'utf8');
  assert.match(qa05, /双向传输层安全（mutual TLS，mTLS）/u);
  assert.match(qa05, /STRIDE 威胁建模/u);

  const qa07 = await readFile(new URL('../content/quality-attributes/qa-07-compatibility-interoperability-versioning.mdx', import.meta.url), 'utf8');
  assert.match(qa07, /OpenAPI 规范（OpenAPI）/u);

  const qa09 = await readFile(new URL('../content/quality-attributes/qa-09-safety-physical-risk.mdx', import.meta.url), 'utf8');
  assert.match(qa09, /系统理论过程分析（Systems-Theoretic Process Analysis，STPA）/u);
  assert.match(qa09, /不安全控制动作（Unsafe Control Action，UCA）/u);
  assert.doesNotMatch(qa09, /人工在环/u);
});
