import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {unified} from 'unified';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';

import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {extractInternalLinks} from '../scripts/content-relations.mjs';
import {visibleMdxLines} from '../scripts/source-ledger.mjs';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const registry = JSON.parse(
  readFileSync(new URL('./fixtures/agentic-topic-system.json', import.meta.url), 'utf8'),
);
const groups = JSON.parse(
  readFileSync(new URL('../data/pattern-groups.json', import.meta.url), 'utf8'),
).groups;
const manifest = JSON.parse(
  readFileSync(new URL('../src/generated/topic-manifest.json', import.meta.url), 'utf8'),
);
const topicIndexes = JSON.parse(
  readFileSync(new URL('../src/generated/topic-indexes.json', import.meta.url), 'utf8'),
);
const documents = await readContentDocuments(contentRoot);

const inventory = [
  ...registry.concepts,
  ...registry.patterns,
  ...registry.cases,
];
const inventoryRoutes = inventory.map(({route}) => route);
const learningRoutes = [
  ...registry.concepts.map(({route}) => route),
  '/patterns/agt-p-01',
  '/patterns/agt-p-03',
  '/patterns/agt-p-04',
  '/patterns/agt-p-05',
  '/patterns/agt-p-02',
  '/patterns/agt-p-06',
  '/patterns/agt-p-07',
  '/patterns/agt-p-08',
  ...registry.cases.map(({route}) => route),
];
const topicIndexBuckets = [
  'concept',
  'principle',
  'quality-attribute',
  'method',
  'modeling',
  'style',
  'pattern',
  'case',
  'question',
  'path',
];
const reciprocal = {
  '/cases/openai-agents-sdk': ['/concepts/agt-c-03', '/patterns/agt-p-06'],
  '/cases/langgraph-supervisor': [
    '/concepts/agt-c-04',
    '/patterns/agt-p-06',
    '/patterns/agt-p-08',
  ],
  '/cases/google-adk-a2a': ['/patterns/agt-p-06'],
  '/cases/aws-cli-agent-orchestrator': [
    '/concepts/agt-c-02',
    '/cases/long-running-coding-agent',
  ],
  '/cases/microsoft-multi-agent-reference-architecture': [
    '/patterns/agt-p-07',
    '/cases/multi-agent-research-system',
  ],
  '/cases/kong-ai-gateway-routing-resilience': [
    '/patterns/agt-p-05',
    '/cases/production-incident-response-agent',
  ],
  '/cases/temporal-saga-durable-execution': ['/patterns/agt-p-08'],
};

const byRoute = new Map(
  documents
    .filter(({metadata}) => typeof metadata.slug === 'string')
    .map((document) => [document.metadata.slug, document]),
);

function requiredDocument(route) {
  const document = byRoute.get(route);
  assert.ok(document, `${route} must resolve to a canonical content document`);
  return document;
}

const visibleDocumentCache = new WeakMap();

function withoutTopLevelMdxEsm(document) {
  const cached = visibleDocumentCache.get(document);
  if (cached) return cached;

  const body = String(document?.body ?? '');
  const parseableBody = body.replace(
    /<!--[\s\S]*?(?:-->|$)/gu,
    (comment) => comment.replace(/[^\r\n]/gu, ' '),
  );
  const tree = unified().use(remarkParse).use(remarkMdx).parse(parseableBody);
  const ranges = tree.children
    .filter(({type}) => type === 'mdxjsEsm')
    .map(({position}) => [position.start.offset, position.end.offset]);
  let cursor = 0;
  let filtered = '';
  for (const [start, end] of ranges) {
    filtered += body.slice(cursor, start);
    filtered += body.slice(start, end).replace(/[^\r\n]/gu, ' ');
    cursor = end;
  }
  filtered += body.slice(cursor);

  const visibleDocument = {...document, body: filtered};
  visibleDocumentCache.set(document, visibleDocument);
  return visibleDocument;
}

function visibleInternalLinks(document) {
  return extractInternalLinks(withoutTopLevelMdxEsm(document));
}

function visibleMarkdownLinks(document) {
  const links = [];
  for (const line of visibleMdxLines(withoutTopLevelMdxEsm(document))) {
    const withoutInlineCode = line.replace(/(`+)(?:(?!\1)[\s\S])*\1/gu, '');
    const withoutImages = withoutInlineCode.replace(
      /!\[((?:\\.|[^\]\\])*)\]\((?:\\.|[^)\s])+(?:\s+["'][^"']*["'])?\)/gu,
      '$1',
    );
    for (const match of withoutImages.matchAll(
      /\[((?:\\.|[^\]\\])*)\]\((\/[^)\s?#]+)(?:[?#][^)\s]*)?(?:\s+["'][^"']*["'])?\)/gu,
    )) {
      links.push({label: match[1], route: match[2].replace(/\/+$/u, '') || '/'});
    }
  }
  return links;
}

function assertExactOrder(actual, expected) {
  assert.deepEqual(
    actual,
    expected,
    'visible inventory links must appear once in exact learning order',
  );
}

function assertExactCategoryEntrance(document, expectedItems) {
  const expectedRoutes = new Set(expectedItems.map(({route}) => route));
  const links = visibleMarkdownLinks(document).filter(({route}) => expectedRoutes.has(route));
  assert.deepEqual(
    links,
    expectedItems.map(({title, route}) => ({label: title, route})),
    `${document.metadata.slug} must visibly introduce its exact Agentic Architecture entries`,
  );
}

function assertUniqueProjection(projection, label) {
  const ids = projection.map(({id}) => id);
  const slugs = projection.map(({slug}) => slug);
  assert.equal(new Set(ids).size, ids.length, `${label} rejects duplicate IDs`);
  assert.equal(new Set(slugs).size, slugs.length, `${label} rejects duplicate slugs`);
}

function assertGeneratedProjection(actualManifest, actualIndexes) {
  assert.ok(actualManifest && !Array.isArray(actualManifest), 'topic manifest is an object');
  assert.deepEqual(Object.keys(actualManifest).toSorted(), ['schema_version', 'topics']);
  assert.equal(actualManifest.schema_version, 1);
  assert.ok(Array.isArray(actualManifest.topics), 'topic manifest topics is an array');

  assert.ok(actualIndexes && !Array.isArray(actualIndexes), 'topic indexes is an object');
  assert.deepEqual(Object.keys(actualIndexes).toSorted(), topicIndexBuckets.toSorted());
  for (const bucket of topicIndexBuckets) {
    assert.ok(Array.isArray(actualIndexes[bucket]), `topic indexes ${bucket} is an array`);
    for (const topic of actualIndexes[bucket]) {
      assert.equal(topic.type, bucket, `${topic.id} belongs to its ${bucket} type bucket`);
    }
  }

  assertUniqueProjection(actualManifest.topics, 'topic manifest');
  const indexedTopics = topicIndexBuckets.flatMap((bucket) => actualIndexes[bucket]);
  assertUniqueProjection(indexedTopics, 'topic indexes');

  for (const {id, route} of registry.concepts) {
    const manifestMatches = actualManifest.topics.filter((topic) => topic.id === id);
    assert.equal(manifestMatches.length, 1, `topic manifest resolves ${id} exactly once`);
    assert.equal(manifestMatches[0].type, 'concept', `${id} manifest type`);
    assert.equal(manifestMatches[0].slug, route, `${id} manifest slug`);

    const conceptMatches = actualIndexes.concept.filter((topic) => topic.id === id);
    assert.equal(conceptMatches.length, 1, `concept index resolves ${id} exactly once`);
    assert.equal(conceptMatches[0].slug, route, `${id} concept index slug`);
    for (const bucket of topicIndexBuckets.filter((name) => name !== 'concept')) {
      assert.equal(
        actualIndexes[bucket].filter((topic) => topic.id === id).length,
        0,
        `${id} is absent from ${bucket}`,
      );
    }
  }

  for (const {id, route} of registry.patterns) {
    const manifestMatches = actualManifest.topics.filter((topic) => topic.id === id);
    assert.equal(manifestMatches.length, 1, `topic manifest resolves ${id} exactly once`);
    assert.equal(manifestMatches[0].type, 'pattern', `${id} manifest type`);
    assert.equal(manifestMatches[0].slug, route, `${id} manifest slug`);

    const patternMatches = actualIndexes.pattern.filter((topic) => topic.id === id);
    assert.equal(patternMatches.length, 1, `pattern index resolves ${id} exactly once`);
    assert.equal(patternMatches[0].slug, route, `${id} pattern index slug`);
    for (const bucket of topicIndexBuckets.filter((name) => name !== 'pattern')) {
      assert.equal(
        actualIndexes[bucket].filter((topic) => topic.id === id).length,
        0,
        `${id} is absent from ${bucket}`,
      );
    }
  }
}

test('agentic path exposes the exact progressive-autonomy order', () => {
  const path = requiredDocument('/paths/agentic-architecture');
  const inventorySet = new Set(inventoryRoutes);
  const actual = visibleMarkdownLinks(path)
    .map(({route}) => route)
    .filter((route) => inventorySet.has(route));

  assertExactOrder(actual, learningRoutes);
  assert.throws(
    () => assertExactOrder(actual.toReversed(), learningRoutes),
    assert.AssertionError,
    'the contract rejects reordered learning links',
  );
  assert.throws(
    () => assertExactOrder([...actual, actual[0]], learningRoutes),
    assert.AssertionError,
    'the contract rejects duplicate learning links',
  );
});

test('all 17 routes have real inbound links and emit navigation links', () => {
  const inbound = new Map(inventoryRoutes.map((route) => [route, new Set()]));
  for (const document of documents) {
    const sourceRoute = document.metadata.slug;
    for (const route of visibleInternalLinks(document)) {
      if (inbound.has(route) && sourceRoute !== route) inbound.get(route).add(sourceRoute);
    }
  }

  for (const item of inventory) {
    assert.ok(inbound.get(item.route).size >= 1, `${item.route} receives a visible non-self link`);
    const document = requiredDocument(item.route);
    assert.equal(
      `content/${document.file}`,
      item.file,
      `${item.route} resolves to its canonical fixture file`,
    );
    const links = new Set(visibleInternalLinks(document));
    assert.ok(links.size >= 2, `${item.route} emits at least two distinct visible internal links`);
    assert.ok(
      links.has('/paths/agentic-architecture'),
      `${item.route} visibly returns to the Agentic Architecture path`,
    );
    const category = item.route.slice(0, item.route.indexOf('/', 1));
    assert.ok(links.has(category), `${item.route} visibly returns to ${category}`);
  }
});

test('existing evidence cases expose the exact required reciprocal edges', () => {
  for (const [route, requiredEdges] of Object.entries(reciprocal)) {
    const links = new Set(visibleInternalLinks(requiredDocument(route)));
    for (const edge of requiredEdges) {
      assert.ok(links.has(edge), `${route} visibly links ${edge}`);
    }
  }
});

test('category entrances visibly introduce the exact 17-item inventory', () => {
  assertExactCategoryEntrance(requiredDocument('/concepts'), registry.concepts);
  assertExactCategoryEntrance(requiredDocument('/patterns'), registry.patterns);
  assertExactCategoryEntrance(requiredDocument('/cases'), registry.cases);
});

test('agent-control contains exactly the eight canonical patterns', () => {
  const matchingGroups = groups.filter(({id}) => id === 'agent-control');
  assert.equal(matchingGroups.length, 1, 'agent-control exists exactly once');
  const expectedIds = registry.patterns.map(({id}) => id);
  assert.deepEqual(matchingGroups[0].topic_ids, expectedIds);
  assert.notDeepEqual(expectedIds.toReversed(), expectedIds, 'canonical order is significant');
});

test('visibility checks reject non-rendered MDX link strings and code forms', () => {
  const exportedMarkdown = {
    body: `export const hiddenMarkdown = '[fake](/concepts/agt-c-01)';`,
  };
  const exportedJsx = {
    body: `export const hiddenJsx = '<Link to="/patterns/agt-p-01">fake</Link>';`,
  };
  const otherHiddenForms = {
    body: [
      '<!-- [comment](/concepts/agt-c-01) -->',
      '```md',
      '[fence](/patterns/agt-p-01)',
      '```',
      '`[inline](/cases/multi-agent-research-system)`',
      '![image](/cases/long-running-coding-agent)',
    ].join('\n'),
  };

  assert.deepEqual(visibleMarkdownLinks(exportedMarkdown), []);
  assert.deepEqual(visibleInternalLinks(exportedMarkdown), []);
  assert.deepEqual(visibleInternalLinks(exportedJsx), []);
  assert.deepEqual(visibleMarkdownLinks(otherHiddenForms), []);
  assert.deepEqual(visibleInternalLinks(otherHiddenForms), []);
});

test('generated manifest and indexes resolve the 14 knowledge topics uniquely', () => {
  assertGeneratedProjection(manifest, topicIndexes);

  const duplicateManifest = structuredClone(manifest);
  duplicateManifest.topics.push(structuredClone(manifest.topics[0]));
  assert.throws(
    () => assertGeneratedProjection(duplicateManifest, topicIndexes),
    assert.AssertionError,
    'the projection contract rejects a duplicate manifest topic',
  );

  const duplicateIndex = structuredClone(topicIndexes);
  duplicateIndex.concept.push(structuredClone(duplicateIndex.concept[0]));
  assert.throws(
    () => assertGeneratedProjection(manifest, duplicateIndex),
    assert.AssertionError,
    'the projection contract rejects a duplicate index topic',
  );

  const wrongBucket = structuredClone(topicIndexes);
  const moved = wrongBucket.concept.find(({id}) => id === registry.concepts[0].id);
  wrongBucket.concept = wrongBucket.concept.filter(({id}) => id !== moved.id);
  wrongBucket.pattern.push(moved);
  assert.throws(
    () => assertGeneratedProjection(manifest, wrongBucket),
    assert.AssertionError,
    'the projection contract rejects a topic moved into the wrong bucket',
  );

  const malformedBucket = structuredClone(topicIndexes);
  malformedBucket.concept = {};
  assert.throws(
    () => assertGeneratedProjection(manifest, malformedBucket),
    assert.AssertionError,
    'the projection contract rejects a malformed bucket',
  );
});
