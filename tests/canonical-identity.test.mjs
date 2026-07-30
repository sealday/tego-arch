import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

async function source(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

test('uses Tego Arch as the canonical active project identity', async () => {
  const [
    config,
    packageSource,
    packageLockSource,
    intro,
    homepage,
    crawler,
    ledger,
    inventory,
  ] = await Promise.all([
    source('docusaurus.config.ts'),
    source('package.json'),
    source('package-lock.json'),
    source('content/intro.mdx'),
    source('src/pages/index.tsx'),
    source('scripts/source-link-health.mjs'),
    source('data/source-ledger.json'),
    source('docs/source-license-inventory.md'),
  ]);
  const packageJson = JSON.parse(packageSource);
  const packageLock = JSON.parse(packageLockSource);

  assert.match(config, /title: 'Tego Arch'/u);
  assert.match(config, /tagline: '软件架构知识图谱'/u);
  assert.match(config, /baseUrl: '\/tego-arch\/'/u);
  assert.match(config, /projectName: 'tego-arch'/u);
  assert.match(config, /https:\/\/github\.com\/sealday\/tego-arch/u);
  assert.equal(packageJson.name, 'tego-arch');
  assert.equal(packageLock.name, 'tego-arch');
  assert.equal(packageLock.packages[''].name, 'tego-arch');
  assert.match(intro, /title: Tego Arch/u);
  assert.match(intro, /# Tego Arch/u);
  assert.match(homepage, /软件架构知识图谱/u);
  assert.equal(existsSync(new URL('../static/CNAME', import.meta.url)), false);
  assert.doesNotMatch(
    [config, homepage, crawler, inventory, ledger].join('\n'),
    /agentic-architecture-atlas|Agentic Architecture Atlas/u,
  );
});

test('keeps every self-authored ledger asset on the canonical repository', async () => {
  const ledger = JSON.parse(await source('data/source-ledger.json'));
  const authored = ledger.sources.filter(({id}) => id.startsWith('src-atlas-'));

  assert.equal(authored.length, 27);
  for (const record of authored) {
    assert.equal(record.author_or_org, 'Tego Arch maintainers');
    assert.match(
      record.license_evidence_url,
      /^https:\/\/github\.com\/sealday\/tego-arch\/blob\/main\//u,
    );
  }
});
