import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {gzipSync} from 'node:zlib';

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
  const indexFiles = entries.filter((name) =>
    /^search-index-[0-9a-f]{8}\.json$/u.test(name),
  );
  if (indexFiles.length !== 1) {
    throw new Error(
      `expected exactly one hashed search index, found ${indexFiles.length}`,
    );
  }

  const filename = indexFiles[0];
  const bytes = await readFile(path.join(buildDir, filename));
  let payload;
  try {
    payload = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`search index is not valid JSON: ${error.message}`);
  }
  if (!Array.isArray(payload)) {
    throw new Error('search index root must be an array');
  }

  const documents = payload.flatMap((part) =>
    Array.isArray(part?.documents) ? part.documents : [],
  );
  if (documents.length === 0) {
    throw new Error('search index contains no documents');
  }
  const urls = [...new Set(documents.map(({u}) => u).filter(Boolean))].sort();
  const invalidBaseUrl = urls.find((url) => !url.startsWith(policy.baseUrl));
  if (invalidBaseUrl) {
    throw new Error(`indexed URL has invalid baseUrl: ${invalidBaseUrl}`);
  }
  for (const requiredUrl of policy.requiredUrls) {
    if (!urls.includes(requiredUrl)) {
      throw new Error(`required indexed URL is missing: ${requiredUrl}`);
    }
  }
  for (const prefix of policy.forbiddenUrlPrefixes) {
    const forbidden = urls.find(
      (url) => url === prefix || url.startsWith(`${prefix}/`),
    );
    if (forbidden) {
      throw new Error(`forbidden indexed URL: ${forbidden}`);
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
