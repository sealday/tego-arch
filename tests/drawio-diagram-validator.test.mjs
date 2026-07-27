import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const validatorPath = fileURLToPath(
  new URL(
    '../.codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs',
    import.meta.url,
  ),
);
const fixtureDirectory = new URL(
  './fixtures/drawio-diagram-validator/',
  import.meta.url,
);

function runValidator(drawioName, svgName, ...args) {
  return spawnSync(
    process.execPath,
    [
      validatorPath,
      fileURLToPath(new URL(drawioName, fixtureDirectory)),
      fileURLToPath(new URL(svgName, fixtureDirectory)),
      ...args,
    ],
    {encoding: 'utf8'},
  );
}

test('rejects mismatched, inaccessible, fixed-size diagram pairs', () => {
  const result = runValidator('invalid.drawio', 'mismatched.svg');

  assert.equal(result.status, 1);
  assert.match(result.stderr, /matching slug/u);
  assert.match(result.stderr, /HTML in mxCell.value/u);
  assert.match(result.stderr, /viewBox/u);
  assert.match(result.stderr, /fixed root width or height/u);
  assert.match(result.stderr, /accessible title and description/u);
});

test('accepts an accessible paired diagram and required labels', () => {
  const result = runValidator(
    'valid.drawio',
    'valid.svg',
    '--label',
    '费用申报系统',
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Validated valid/u);
});
