import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {findMarkdownHeadings} from '../scripts/content-metadata.mjs';

const reviewFile = new URL('../docs/reviews/g006-batch3.md', import.meta.url);
const topics = new Map([
  ['QA-05', '/quality-attributes/qa-05'],
  ['QA-08', '/quality-attributes/qa-08'],
  ['QA-09', '/quality-attributes/qa-09'],
]);
const requiredRoutes = [
  ...topics.values(),
  '/paths/production-governance',
  '/paths/cloud-native-platform',
  '/paths/edge-physical-agents',
  '/paths/agent-platform-gateway',
  '/references/primary/page/20',
  '/references/first-party/page/2',
  '/img/illustrations/qa-05-data-trust-boundaries.png',
  '/img/illustrations/qa-08-operability-recovery-loop.png',
  '/img/illustrations/qa-09-safety-control-loop.png',
  '/references/primary#src-stpa-handbook-2018',
  '/references/primary/page/3#src-sre-managing-incidents',
  '/references/primary/page/5#src-faa-order-8040-4c',
  '/references/primary/page/6#src-nist-privacy-framework-1',
  '/references/primary/page/6#src-nist-sp-800-160-v1r1-2022',
  '/references/primary/page/7#src-opentelemetry-observability-primer',
  '/references/primary/page/19#src-atlas-qa05-data-trust-boundaries-8d53f1c92a64',
  '/references/primary/page/19#src-atlas-qa09-safety-control-loop-c4a7e83b1d96',
  '/references/primary/page/20#src-atlas-qa08-operability-recovery-loop-6b1e9d42c7f5',
];

async function readRequiredReview() {
  try {
    return await readFile(reviewFile, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      assert.fail(`Missing G006 Batch 3 review evidence: ${reviewFile.pathname}`);
    }
    throw error;
  }
}

function visibleReview(source) {
  return source.replace(/<!--[\s\S]*?-->/gu, '');
}

function sectionForHeading(source, headingText) {
  const headings = findMarkdownHeadings(source).filter(({level}) => level === 2);
  const index = headings.findIndex(({text}) => text === headingText);
  assert.notEqual(index, -1, `Missing real heading: ## ${headingText}`);
  const start = source.indexOf('\n', headings[index].offset);
  const end = headings[index + 1]?.offset ?? source.length;
  return source.slice(start === -1 ? end : start + 1, end);
}

function identity(source, label) {
  const pattern = new RegExp(
    '(?:^|\\n)- ' + label + '：\\s*`([^`]+)`\\s*(?:\\n|$)',
    'iu',
  );
  const match = source.match(pattern);
  assert.ok(match, `Review must record visible ${label}`);
  return match[1].trim();
}

test('requires a non-empty G006 Batch 3 review record', async () => {
  const review = await readRequiredReview();
  assert.match(review, /\S/u);
});

test('records a visible independent reviewer identity', async () => {
  const review = visibleReview(await readRequiredReview());
  const reviewer = identity(review, '评审者身份');
  const author = identity(review, '内容作者身份');

  assert.notEqual(reviewer.toLocaleLowerCase('en'), author.toLocaleLowerCase('en'));
  assert.match(review, /\bindependent reviewer\b|独立评审者/iu);
});

test('records visible editorial fact copyright and render PASS per article', async () => {
  const review = visibleReview(await readRequiredReview());

  for (const id of topics.keys()) {
    const section = sectionForHeading(review, id);
    for (const gate of ['editorial', 'fact', 'copyright', 'render']) {
      assert.match(
        section,
        new RegExp(`(?:^|\\n)[^\\n]*${gate}[^\\n]*\\bPASS\\b`, 'iu'),
        `${id} must record visible ${gate} PASS`,
      );
    }
    assert.match(section, /\bdesktop\s+`?1440x1000`?/iu, `${id} desktop evidence`);
    assert.match(section, /\bmobile\s+`?390x844`?/iu, `${id} mobile evidence`);
    assert.match(
      section,
      /deterministic representation[^。\n]{0,100}\bPASS\b|\bPASS\b[^。\n]{0,100}deterministic representation/iu,
      `${id} deterministic representation evidence`,
    );
  }
});

test('covers the exact article path reference and PNG routes', async () => {
  const review = visibleReview(await readRequiredReview());

  for (const route of requiredRoutes) {
    assert.ok(review.includes(route), `Review evidence must cover ${route}`);
  }
});

test('records runtime CSS JS console overflow and article-width image evidence', async () => {
  const review = visibleReview(await readRequiredReview());
  for (const [label, pattern] of [
    ['CSS', /\bCSS\b[^\n]*\bPASS\b|\bPASS\b[^\n]*\bCSS\b/iu],
    ['JS', /\bJS\b[^\n]*\bPASS\b|\bPASS\b[^\n]*\bJS\b/iu],
    [
      'console',
      /console[^\n]*(?:warning\/error|warnings?\/errors?)[^\n]*0[^\n]*\bPASS\b|\bPASS\b[^\n]*console[^\n]*0/iu,
    ],
    [
      'overflow',
      /(?:no overflow|无[^。\n]{0,12}overflow)[^\n]*\bPASS\b|\bPASS\b[^\n]*(?:no overflow|无[^。\n]{0,12}overflow)/iu,
    ],
    [
      'article width',
      /article[- ]width[^\n]*\bPASS\b|\bPASS\b[^\n]*article[- ]width/iu,
    ],
  ]) {
    assert.match(review, pattern, `Review evidence must record ${label} PASS`);
  }
});

test('records reciprocal and path clicks plus license and anti-overclaim findings', async () => {
  const review = visibleReview(await readRequiredReview());

  for (const [label, pattern] of [
    [
      'reciprocal clicks',
      /reciprocal clicks?[^\n]*\bPASS\b|\bPASS\b[^\n]*reciprocal clicks?/iu,
    ],
    ['path clicks', /path clicks?[^\n]*\bPASS\b|\bPASS\b[^\n]*path clicks?/iu],
    [
      'license findings',
      /license findings?[^\n]*\bPASS\b|\bPASS\b[^\n]*license findings?/iu,
    ],
    [
      'anti-overclaim findings',
      /anti-overclaim findings?[^\n]*\bPASS\b|\bPASS\b[^\n]*anti-overclaim findings?/iu,
    ],
  ]) {
    assert.match(review, pattern, `Review evidence must record ${label} PASS`);
  }
});

test('records the three article-specific anti-overclaim verdicts', async () => {
  const review = visibleReview(await readRequiredReview());
  const security = sectionForHeading(review, 'QA-05');
  assert.match(security, /合规[^。\n]{0,80}(?:不证明|不能证明|未声称)/u);
  assert.match(security, /威胁[^。\n]{0,80}(?:不完整|非完整|不声称完整|未声称完整)/u);
  assert.match(
    security,
    /(?:网络|服务身份)[^。\n]{0,100}(?:不等于|不证明|不能替代)[^。\n]{0,40}授权/u,
  );

  const operability = sectionForHeading(review, 'QA-08');
  assert.match(
    operability,
    /observability[^。\n]{0,100}(?:不只|不等于仅|未定义为仅)[^。\n]{0,80}(?:metrics|logs|traces|指标|日志|追踪)/iu,
  );
  assert.match(
    operability,
    /(?:遥测|SLO|自动化)[^。\n]{0,100}(?:不等于|不证明|不能证明)[^。\n]{0,40}(?:operability|可运维)/iu,
  );

  const safety = sectionForHeading(review, 'QA-09');
  assert.match(
    safety,
    /Safety[^。\n]{0,100}(?:不等于|未等同)[^。\n]{0,60}(?:Security|可靠性)/iu,
  );
  assert.match(safety, /未复用[^。\n]{0,60}(?:来源|STPA|FAA)[^。\n]{0,20}(?:图|figure)/iu);
  assert.match(
    safety,
    /(?:认证|方法完成|method completion)[^。\n]{0,100}(?:不证明|未声称|不等于)[^。\n]{0,20}Safety/iu,
  );
});

test('rejects hidden PASS pending language and compatibility markers', async () => {
  const review = await readRequiredReview();
  const visible = visibleReview(review);

  assert.doesNotMatch(
    review,
    /<!--[\s\S]*?\bPASS\b[\s\S]*?-->/iu,
    'Review PASS evidence must not be hidden in HTML comments',
  );
  assert.doesNotMatch(
    review,
    /\\(?:n|b)/u,
    'Review evidence must not contain backslash compatibility markers',
  );
  assert.doesNotMatch(
    visible,
    /\bpending\b|(?:仍需|尚待|待|后续|随后)[^，。；\n]{0,40}复核|复核[^，。；\n]{0,20}(?:待完成|未完成)/iu,
    'Stage A review evidence must not retain pending review language',
  );
});
