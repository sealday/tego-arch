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

test('rejects expected elements nested below wrapper roots', () => {
  const result = runValidator('wrapped.drawio', 'wrapped.svg');

  assert.equal(result.status, 1);
  assert.match(result.stderr, /XML rooted at mxfile/u);
  assert.match(result.stderr, /XML rooted at svg/u);
});

test('rejects malformed XML with mismatched closing tags', () => {
  const result = runValidator('malformed.drawio', 'malformed.svg');

  assert.equal(result.status, 1);
  assert.match(result.stderr, /well-formed XML/u);
});

test('requires labels in Draw.io cell values and visible SVG text', () => {
  const result = runValidator(
    'hidden.drawio',
    'hidden.svg',
    '--label',
    'Hidden architecture label',
  );

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /Required label "Hidden architecture label" must appear as a Draw\.io mxCell\.value and visible SVG text/u,
  );
});

test('compares decoded Draw.io and visible SVG labels', () => {
  const result = runValidator(
    'escaped.drawio',
    'escaped.svg',
    '--label',
    'Payments & Claims',
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated escaped/u);
});

test('rejects data-role when the exact SVG role attribute is absent', () => {
  const result = runValidator('data-role.drawio', 'data-role.svg');

  assert.equal(result.status, 1);
  assert.match(result.stderr, /accessible title and description/u);
});

test('rejects unknown options', () => {
  const result = runValidator('valid.drawio', 'valid.svg', '--unknown');

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown option: --unknown/u);
});

test('rejects a dangling label option', () => {
  const result = runValidator('valid.drawio', 'valid.svg', '--label');

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--label requires a value/u);
});
