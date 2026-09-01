import {readFile, readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {gzipSync} from 'node:zlib';

const require = createRequire(import.meta.url);
const pluginPackagePath = require.resolve(
  '@easyops-cn/docusaurus-search-local/package.json',
);
const pluginRequire = createRequire(pluginPackagePath);
const lunr = pluginRequire('lunr');

export const defaultSearchPolicy = Object.freeze({
  baseUrl: '/tego-arch/',
  requiredUrls: [
    '/tego-arch/styles/sty-12',
    '/tego-arch/modeling/mod-11',
    '/tego-arch/principles/pr-11',
    '/tego-arch/cases/kubernetes-reconciliation-loop',
  ],
  forbiddenUrlPrefixes: [
    '/tego-arch/references/primary',
    '/tego-arch/references/secondary',
    '/tego-arch/references/discovery',
  ],
});

export async function inspectSearchBuild(
  buildDir,
  policy = defaultSearchPolicy,
) {
  const entries = await readdir(buildDir);
  let compatibilityPage;
  for (const artifact of ['search.html', path.join('search', 'index.html')]) {
    try {
      const contents = await readFile(path.join(buildDir, artifact), 'utf8');
      if (artifact === path.join('search', 'index.html')) {
        compatibilityPage = contents;
      }
    } catch (error) {
      if (error?.code === 'ENOENT') {
        throw new Error(`missing build artifact: ${artifact}`);
      }
      throw error;
    }
  }
  if (
    !compatibilityPage.includes('data-search-route-compat') ||
    !compatibilityPage.includes('<meta name="robots" content="noindex,follow">')
  ) {
    throw new Error('search/index.html is not the synchronized compatibility page');
  }

  const searchIndexArtifacts = entries.filter((name) =>
    /^search-index.*\.json$/u.test(name),
  );
  if (searchIndexArtifacts.length !== 1) {
    throw new Error(
      `expected exactly one search index artifact, found ${searchIndexArtifacts.length}`,
    );
  }
  const indexFiles = searchIndexArtifacts.filter((name) =>
    /^search-index-[0-9a-f]{8}\.json$/u.test(name),
  );
  if (indexFiles.length !== 1) {
    throw new Error('expected the search index artifact to use an 8-character lowercase hex hash');
  }

  const filename = indexFiles[0];
  const bytes = await readFile(path.join(buildDir, filename));
  let payload;
  try {
    payload = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`search index is not valid JSON: ${error.message}`);
  }
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('search index root must be a non-empty array');
  }

  for (const [partitionIndex, partition] of payload.entries()) {
    if (!partition || !Array.isArray(partition.documents)) {
      throw new Error(`search index partition ${partitionIndex} must contain a documents array`);
    }
    if (
      partition.index === null ||
      typeof partition.index !== 'object' ||
      Array.isArray(partition.index)
    ) {
      throw new Error(`search index partition ${partitionIndex} must contain an index object`);
    }
    try {
      lunr.Index.load(partition.index);
    } catch (error) {
      throw new Error(
        `search index partition ${partitionIndex} contains an invalid Lunr index: ${error.message}`,
      );
    }
  }

  const documents = payload.flatMap((partition) => partition.documents);
  if (documents.length === 0) {
    throw new Error('search index contains no documents');
  }

  const canonicalUrls = documents.map((document, documentIndex) => {
    const url = document?.u;
    if (
      !document ||
      !Number.isSafeInteger(document.i) ||
      document.i < 0 ||
      typeof document.t !== 'string' ||
      typeof url !== 'string' ||
      url.length === 0
    ) {
      throw new Error(
        `indexed document ${documentIndex} must contain compatible i, t, and u fields (document URL required)`,
      );
    }
    if (
      !url.startsWith('/') ||
      url.includes('\\') ||
      url.includes('?') ||
      url.includes('#') ||
      url.includes('%') ||
      /\/{2,}/u.test(url)
    ) {
      throw new Error(`indexed URL is not a canonical absolute path: ${url}`);
    }

    let parsed;
    try {
      parsed = new URL(url, 'https://search-index.invalid');
    } catch {
      throw new Error(`indexed URL is invalid: ${url}`);
    }
    if (
      parsed.origin !== 'https://search-index.invalid' ||
      parsed.pathname !== url ||
      parsed.search !== '' ||
      parsed.hash !== ''
    ) {
      throw new Error(`indexed URL is not canonical or same-origin: ${url}`);
    }
    if (!parsed.pathname.startsWith(policy.baseUrl)) {
      throw new Error(`indexed URL has invalid baseUrl: ${url}`);
    }
    return parsed.pathname;
  });
  const urls = [...new Set(canonicalUrls)].sort();

  for (const prefix of policy.forbiddenUrlPrefixes) {
    const forbidden = urls.find(
      (url) => url === prefix || url.startsWith(`${prefix}/`),
    );
    if (forbidden) {
      throw new Error(`forbidden indexed URL: ${forbidden}`);
    }
  }
  for (const requiredUrl of policy.requiredUrls) {
    if (!urls.includes(requiredUrl)) {
      throw new Error(`required indexed URL is missing: ${requiredUrl}`);
    }
  }

  return {
    filename,
    bytes: bytes.byteLength,
    gzipBytes: gzipSync(bytes).byteLength,
    documentCount: documents.length,
    urlCount: urls.length,
  };
}

const isCli = process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isCli) {
  const buildDir = path.resolve(process.argv[2] ?? 'build');
  try {
    const report = await inspectSearchBuild(buildDir);
    process.stdout.write(`${JSON.stringify(report)}\n`);
  } catch (error) {
    process.stderr.write(`search-index-check: ${error.message}\n`);
    process.exitCode = 1;
  }
}
