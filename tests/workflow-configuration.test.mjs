import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const deployUrl = new URL('../.github/workflows/deploy.yml', import.meta.url);
const linkHealthUrl = new URL(
  '../.github/workflows/link-health.yml',
  import.meta.url,
);
const packageJsonUrl = new URL('../package.json', import.meta.url);
const approvedDeployActions = [
  'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1',
  'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0',
  'actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0',
  'actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0',
  'actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128 # v5.0.0',
];
const approvedLinkHealthActions = [
  'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1',
  'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0',
  'actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1',
  'actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1',
];

function extractActionReferences(source) {
  return [...source.matchAll(/^[ ]+(?:- )?uses: (?<reference>[^\n]+)$/gmu)].map(
    (match) => match.groups.reference,
  );
}

async function readWorkflow(url) {
  try {
    return await readFile(url, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
}

function topLevelKeys(source) {
  return [...source.matchAll(/^([A-Za-z][A-Za-z0-9_-]*):(?:[ \t]|$)/gm)].map(
    ([, key]) => key,
  );
}

function assertExactReadOnlyPermissions(source) {
  const match = source.match(
    /^permissions:\n(?<entries>(?:[ ]{2}[^\n]+\n)+)\njobs:/m,
  );
  assert.ok(match, 'workflow must define a permissions block before jobs');
  assert.equal(
    match.groups.entries,
    '  contents: read\n',
    'workflow permissions must be exactly contents: read',
  );
}

function assertContentReviewUpload(source) {
  assert.match(
    source,
    /      - name: Upload content review report\n        if: always\(\)\n        uses: actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7\.0\.1\n        with:\n          name: content-review-health\n          path: \|\n            \/tmp\/content-review-health\.json\n            \/tmp\/content-review-health\.md\n          if-no-files-found: error/,
    'workflow must include the complete content review upload block',
  );
}

test('keeps deploy verification offline and live links in a read-only scheduled workflow', async () => {
  const [deploy, linkHealth] = await Promise.all([
    readWorkflow(deployUrl),
    readWorkflow(linkHealthUrl),
  ]);

  assert.match(
    deploy,
    /# npm run verify uses the committed link-health cache and does not access external sites\.\n[ ]*- name: Verify site\n[ ]+run: npm run verify/,
  );
  assert.doesNotMatch(deploy, /check:links:live|refresh:links/);

  assert.match(linkHealth, /^on:\n[ ]{2}schedule:\n/m);
  assert.match(linkHealth, /^[ ]{2}workflow_dispatch:\s*$/m);
  assertExactReadOnlyPermissions(linkHealth);
  for (const unsafePermission of ['actions: write', 'id-token: write']) {
    assert.throws(
      () => assertExactReadOnlyPermissions(
        linkHealth.replace(
          '  contents: read',
          `  contents: read\n  ${unsafePermission}`,
        ),
      ),
      /exactly contents: read/,
    );
  }
  assert.match(linkHealth, /^[ ]{4}timeout-minutes: 30$/m);
  assert.match(
    linkHealth,
    /run: npm run check:links:live -- --output \/tmp\/source-link-health-live\.json/,
  );
  assert.doesNotMatch(
    linkHealth,
    /git push|pull[_ -]?request|contents:\s*write|pull-requests:\s*write/i,
  );
});

test('pins every GitHub action and uploads the live report even on failure', async () => {
  const [deploy, linkHealth] = await Promise.all([
    readWorkflow(deployUrl),
    readWorkflow(linkHealthUrl),
  ]);
  assert.deepEqual(extractActionReferences(deploy), approvedDeployActions);
  assert.deepEqual(
    extractActionReferences(linkHealth),
    approvedLinkHealthActions,
  );
  assert.notDeepEqual(
    extractActionReferences(
      deploy.replace(
        'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1',
        'actions/checkout@v7',
      ),
    ),
    approvedDeployActions,
  );
  assert.notDeepEqual(
    extractActionReferences(
      linkHealth.replace(
        'actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1',
        'actions/upload-artifact@v7',
      ),
    ),
    approvedLinkHealthActions,
  );
  for (const reference of [
    ...approvedDeployActions,
    ...approvedLinkHealthActions,
  ]) {
    assert.match(reference, /@[0-9a-f]{40} # v[0-9]+\.[0-9]+\.[0-9]+$/u);
  }
  assert.match(
    linkHealth,
    /- name: Upload live link report\n[ ]+if: always\(\)\n[ ]+uses: actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7\.0\.1/,
  );
  assert.match(linkHealth, /name: source-link-health-live/);
  assert.match(linkHealth, /path: \/tmp\/source-link-health-live\.json/);
  assert.match(linkHealth, /if-no-files-found: error/);
});

test('checks out complete history before verifying immutable deployment evidence', async () => {
  const deploy = await readWorkflow(deployUrl);

  assert.match(
    deploy,
    /      - name: Check out repository\n        uses: actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7\.0\.1\n        with:\n          fetch-depth: 0/,
    'deploy verification must fetch complete Git history so recorded evidence commits remain resolvable',
  );
});

test('always builds and uploads the monthly content review reports', async () => {
  const linkHealth = await readWorkflow(linkHealthUrl);

  assert.match(
    linkHealth,
    /run: npm run report:reviews -- --as-of "\$\(date -u \+%F\)" --json \/tmp\/content-review-health\.json --markdown \/tmp\/content-review-health\.md/,
  );
  assert.match(
    linkHealth,
    /- name: Build content review report\n[ ]+if: always\(\)\n[ ]+run: npm run report:reviews/,
  );
  assertContentReviewUpload(linkHealth);
  assert.throws(
    () => assertContentReviewUpload(
      linkHealth.replace(
        '            /tmp/content-review-health.md\n          if-no-files-found: error',
        '            /tmp/content-review-health.md',
      ),
    ),
    /complete content review upload block/,
  );
});

test('keeps workflow YAML indentation and top-level keys unambiguous', async () => {
  for (const [name, source] of [
    ['deploy.yml', await readWorkflow(deployUrl)],
    ['link-health.yml', await readWorkflow(linkHealthUrl)],
  ]) {
    assert.notEqual(source, '', `${name} must exist`);
    assert.doesNotMatch(source, /\t/, `${name} must not contain tabs`);
    assert.doesNotMatch(source, /[ \t]+$/m, `${name} must not contain trailing whitespace`);
    const keys = topLevelKeys(source);
    for (const required of ['name', 'on', 'permissions', 'jobs']) {
      assert.equal(
        keys.filter((key) => key === required).length,
        1,
        `${name} must have one unambiguous ${required} top-level key`,
      );
    }
  }
});

test('runs terminology governance in the complete verification chain', async () => {
  const packageJson = JSON.parse(await readFile(packageJsonUrl, 'utf8'));

  assert.equal(
    packageJson.scripts['check:terminology'],
    'node scripts/check-terminology.mjs',
  );
  assert.equal(
    packageJson.scripts.verify,
    'npm run test && npm run validate:content && npm run check:terminology && npm run check:content && npm run check:links && npm run check:reviews && npm run typecheck && npm run build',
  );
});
