import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {promisify} from 'node:util';

import {inspectSearchBuild} from '../scripts/check-search-index.mjs';

const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);
const checkerPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../scripts/check-search-index.mjs',
);
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

const serializedLunrIndex = () => ({
  version: '2.3.9',
  fields: ['t'],
  fieldVectors: [],
  invertedIndex: [],
  pipeline: [],
});

const synchronizedSearchPage = '<!doctype html><html><head><meta name="robots" content="noindex,follow"><script data-search-route-compat></script></head></html>';

const writeSearchRoutes = async (directory) => {
  await mkdir(path.join(directory, 'search'), {recursive: true});
  await Promise.all([
    writeFile(path.join(directory, 'search.html'), synchronizedSearchPage),
    writeFile(path.join(directory, 'search', 'index.html'), synchronizedSearchPage),
  ]);
};

const writeValidBuild = async (directory, filename = 'search-index-1a2b3c4d.json') => {
  await writeSearchRoutes(directory);
  await writeFile(
    path.join(directory, filename),
    JSON.stringify(makeIndex(requiredUrls)),
  );
};

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
    await writeValidBuild(directory);
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
    await writeSearchRoutes(directory);
    await writeFile(
      path.join(directory, 'search-index.json'),
      JSON.stringify(makeIndex(['/tego-arch/styles/sty-12'])),
    );
    await assert.rejects(
      inspectSearchBuild(directory),
      /expected the search index artifact to use an 8-character lowercase hex hash/u,
    );
  });
});

test('rejects generated source-ledger pages in the docs index', async () => {
  await withBuild(async (directory) => {
    await writeSearchRoutes(directory);
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

test('requires both canonical and trailing-slash search route artifacts', async () => {
  await withBuild(async (directory) => {
    await writeFile(
      path.join(directory, 'search-index-1a2b3c4d.json'),
      JSON.stringify(makeIndex(requiredUrls)),
    );
    await assert.rejects(inspectSearchBuild(directory), /missing build artifact: search\.html/u);

    await writeFile(path.join(directory, 'search.html'), '<!doctype html>');
    await assert.rejects(
      inspectSearchBuild(directory),
      /missing build artifact: search\/index\.html/u,
    );
  });
});

test('rejects an unsynchronized static search fallback', async () => {
  await withBuild(async (directory) => {
    await mkdir(path.join(directory, 'search'), {recursive: true});
    await writeFile(path.join(directory, 'search.html'), synchronizedSearchPage);
    await writeFile(
      path.join(directory, 'search', 'index.html'),
      '<!doctype html><meta name="robots" content="noindex,follow"><script>window.location.replace("../search")</script>',
    );
    await writeFile(
      path.join(directory, 'search-index-1a2b3c4d.json'),
      JSON.stringify(makeIndex(requiredUrls)),
    );
    await assert.rejects(
      inspectSearchBuild(directory),
      /search\/index\.html is not the synchronized compatibility page/u,
    );
  });
});

test('rejects an unsynchronized canonical search page', async () => {
  await withBuild(async (directory) => {
    await writeSearchRoutes(directory);
    await writeFile(path.join(directory, 'search.html'), '<!doctype html>');
    await writeFile(
      path.join(directory, 'search-index-1a2b3c4d.json'),
      JSON.stringify(makeIndex(requiredUrls)),
    );
    await assert.rejects(
      inspectSearchBuild(directory),
      /search\.html is not the synchronized search page/u,
    );
  });
});

test('rejects a valid hashed index that omits a required URL', async () => {
  await withBuild(async (directory) => {
    await writeSearchRoutes(directory);
    await writeFile(
      path.join(directory, 'search-index-1a2b3c4d.json'),
      JSON.stringify(makeIndex(requiredUrls.slice(1))),
    );
    await assert.rejects(inspectSearchBuild(directory), /required indexed URL is missing/u);
  });
});

test('rejects invalid JSON and a non-array root', async () => {
  await withBuild(async (directory) => {
    await writeSearchRoutes(directory);
    const filename = path.join(directory, 'search-index-1a2b3c4d.json');
    await writeFile(filename, '{');
    await assert.rejects(inspectSearchBuild(directory), /not valid JSON/u);
    await writeFile(filename, JSON.stringify({documents: []}));
    await assert.rejects(inspectSearchBuild(directory), /root must be a non-empty array/u);
  });
});

test('rejects malformed partitions and missing document URLs', async () => {
  await withBuild(async (directory) => {
    await writeSearchRoutes(directory);
    const filename = path.join(directory, 'search-index-1a2b3c4d.json');
    for (const payload of [
      [{documents: requiredUrls.map((u) => ({u}))}],
      [{documents: 'not-an-array', index: {}}],
      [{documents: [{t: 'missing URL'}], index: {}}],
      [{documents: [{u: ''}], index: {}}],
    ]) {
      await writeFile(filename, JSON.stringify(payload));
      await assert.rejects(
        inspectSearchBuild(directory),
        /partition|indexed document/u,
      );
    }
  });
});

test('rejects a serialized partition index that Lunr cannot load', async () => {
  await withBuild(async (directory) => {
    await writeSearchRoutes(directory);
    const payload = makeIndex(requiredUrls);
    payload[0].index = {version: '2.3.9'};
    await writeFile(
      path.join(directory, 'search-index-1a2b3c4d.json'),
      JSON.stringify(payload),
    );
    await assert.rejects(
      inspectSearchBuild(directory),
      /partition 0 contains an invalid Lunr index/u,
    );
  });
});

test('requires worker-compatible i, t, and u document fields', async () => {
  await withBuild(async (directory) => {
    await writeSearchRoutes(directory);
    const filename = path.join(directory, 'search-index-1a2b3c4d.json');
    for (const invalidDocument of [
      {t: 'missing id', u: requiredUrls[0]},
      {i: '1', t: 'string id', u: requiredUrls[0]},
      {i: 1, u: requiredUrls[0]},
      {i: 1, t: 42, u: requiredUrls[0]},
      {i: 1, t: 'missing URL'},
      {i: 1, t: 'numeric URL', u: 42},
    ]) {
      const payload = makeIndex(requiredUrls);
      payload[0].documents[0] = invalidDocument;
      await writeFile(filename, JSON.stringify(payload));
      await assert.rejects(
        inspectSearchBuild(directory),
        /indexed document 0 must contain compatible i, t, and u fields/u,
      );
    }
  });
});

test('accepts a legitimate empty partition with a loadable Lunr index', async () => {
  await withBuild(async (directory) => {
    await writeSearchRoutes(directory);
    const payload = makeIndex(requiredUrls);
    payload.push({documents: [], index: serializedLunrIndex()});
    await writeFile(
      path.join(directory, 'search-index-1a2b3c4d.json'),
      JSON.stringify(payload),
    );
    const report = await inspectSearchBuild(directory);
    assert.equal(report.documentCount, requiredUrls.length);
  });
});

test('rejects invalid, out-of-base, and policy-bypass document URLs', async () => {
  await withBuild(async (directory) => {
    await writeSearchRoutes(directory);
    const filename = path.join(directory, 'search-index-1a2b3c4d.json');
    for (const invalidUrl of [
      'https://example.com/tego-arch/styles/sty-12',
      '/other/styles/sty-12',
      '/tego-arch/styles/sty-12?next=/tego-arch/references/primary',
      '/tego-arch/styles/sty-12#fragment',
      '/tego-arch/styles\\sty-12',
      '/tego-arch//references/primary',
      '/tego-arch/styles/../references/primary',
      '/tego-arch/references/%70rimary',
    ]) {
      await writeFile(
        filename,
        JSON.stringify(makeIndex([...requiredUrls, invalidUrl])),
      );
      await assert.rejects(inspectSearchBuild(directory), /indexed URL/u);
    }
  });
});

test('rejects every extra root search-index artifact', async () => {
  await withBuild(async (directory) => {
    await writeValidBuild(directory);
    for (const extra of ['search-index.json', 'search-index-deadbeef.json', 'search-index-stale.json']) {
      await writeFile(path.join(directory, extra), '[]');
      await assert.rejects(
        inspectSearchBuild(directory),
        /expected exactly one search index artifact/u,
      );
      await rm(path.join(directory, extra));
    }
  });
});

test('CLI reports validation failures on stderr and exits nonzero', async () => {
  await withBuild(async (directory) => {
    await writeSearchRoutes(directory);
    await writeFile(path.join(directory, 'search-index-1a2b3c4d.json'), '{');
    await assert.rejects(
      execFileAsync(process.execPath, [checkerPath, directory]),
      (error) => {
        assert.notEqual(error.code, 0);
        assert.match(error.stderr, /^search-index-check: search index is not valid JSON:/u);
        assert.equal(error.stdout, '');
        return true;
      },
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
