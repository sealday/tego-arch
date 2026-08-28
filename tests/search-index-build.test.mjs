import assert from 'node:assert/strict';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {inspectSearchBuild} from '../scripts/check-search-index.mjs';

const require = createRequire(import.meta.url);
const pluginPackagePath = require.resolve(
  '@easyops-cn/docusaurus-search-local/package.json',
);
const {getIndexHash} = require(path.join(
  path.dirname(pluginPackagePath),
  'dist/server/server/utils/getIndexHash.js',
));

const requiredUrls = [
  '/tego-arch/styles/sty-12',
  '/tego-arch/modeling/mod-11',
  '/tego-arch/principles/pr-11',
  '/tego-arch/cases/kubernetes-reconciliation-loop',
];

const makeIndex = (urls) => [
  {
    documents: urls.map((u, index) => ({i: index + 1, t: `title-${index}`, u})),
    index: {version: '2.3.9', fields: ['t'], fieldVectors: [], invertedIndex: [], pipeline: []},
  },
];

const withBuild = async (callback) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'tego-search-'));
  try {
    return await callback(directory);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
};

test('accepts one hashed, scoped, non-empty search index', async () => {
  await withBuild(async (directory) => {
    await writeFile(
      path.join(directory, 'search-index-1a2b3c4d.json'),
      JSON.stringify(makeIndex(requiredUrls)),
    );
    const report = await inspectSearchBuild(directory);

    assert.equal(report.filename, 'search-index-1a2b3c4d.json');
    assert.equal(report.documentCount, 4);
    assert.equal(report.urlCount, 4);
    assert.ok(report.bytes > 0);
    assert.ok(report.gzipBytes > 0);
  });
});

test('rejects an unhashed index and missing representative docs', async () => {
  await withBuild(async (directory) => {
    await writeFile(
      path.join(directory, 'search-index.json'),
      JSON.stringify(makeIndex(['/tego-arch/styles/sty-12'])),
    );
    await assert.rejects(
      inspectSearchBuild(directory),
      /expected exactly one hashed search index/u,
    );
  });
});

test('rejects generated source-ledger pages in the docs index', async () => {
  await withBuild(async (directory) => {
    await writeFile(
      path.join(directory, 'search-index-deadbeef.json'),
      JSON.stringify(makeIndex([
        ...requiredUrls,
        '/tego-arch/references/primary',
      ])),
    );
    await assert.rejects(
      inspectSearchBuild(directory),
      /forbidden indexed URL/u,
    );
  });
});

test('changes the filename hash when indexed MDX content changes', async () => {
  await withBuild(async (directory) => {
    const fixture = path.join(directory, 'fixture.mdx');
    const config = {
      hashed: 'filename',
      indexDocs: true,
      docsDir: [directory],
      indexBlog: false,
      blogDir: [],
    };

    await writeFile(fixture, '# First indexed value\n');
    const firstHash = getIndexHash(config);
    await writeFile(fixture, '# Changed indexed value\n');
    const secondHash = getIndexHash(config);

    assert.match(firstHash, /^[0-9a-f]{8}$/u);
    assert.match(secondHash, /^[0-9a-f]{8}$/u);
    assert.notEqual(secondHash, firstHash);
  });
});
