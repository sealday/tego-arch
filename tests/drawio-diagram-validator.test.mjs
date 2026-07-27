import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
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
  return runValidatorPaths(
    fileURLToPath(new URL(drawioName, fixtureDirectory)),
    fileURLToPath(new URL(svgName, fixtureDirectory)),
    ...args,
  );
}

function runValidatorPaths(drawioPath, svgPath, ...args) {
  return spawnSync(
    process.execPath,
    [
      validatorPath,
      drawioPath,
      svgPath,
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

test('rejects labels hidden directly by SVG presentation and ARIA attributes', () => {
  const labels = [
    'Direct display',
    'Direct visibility',
    'Direct collapse',
    'Direct opacity',
    'Direct fill opacity',
    'Direct aria',
  ];
  const result = runValidator(
    'direct-hidden.drawio',
    'direct-hidden.svg',
    ...labels.flatMap((label) => ['--label', label]),
  );

  assert.equal(result.status, 1);
  for (const label of labels) {
    assert.match(result.stderr, new RegExp(`Required label "${label}"`, 'u'));
  }
});

test('rejects labels hidden by SVG ancestor presentation and ARIA attributes', () => {
  const labels = [
    'Ancestor display',
    'Ancestor visibility',
    'Ancestor collapse',
    'Ancestor opacity',
    'Ancestor fill opacity',
    'Ancestor aria',
  ];
  const result = runValidator(
    'ancestor-hidden.drawio',
    'ancestor-hidden.svg',
    ...labels.flatMap((label) => ['--label', label]),
  );

  assert.equal(result.status, 1);
  for (const label of labels) {
    assert.match(result.stderr, new RegExp(`Required label "${label}"`, 'u'));
  }
});

test('rejects labels inside non-rendered SVG definition containers', () => {
  const labels = ['Definitions label', 'Symbol label', 'Metadata label'];
  const result = runValidator(
    'definitions-hidden.drawio',
    'definitions-hidden.svg',
    ...labels.flatMap((label) => ['--label', label]),
  );

  assert.equal(result.status, 1);
  for (const label of labels) {
    assert.match(result.stderr, new RegExp(`Required label "${label}"`, 'u'));
  }
});

test('rejects text that has neither an effective fill nor a stroke', () => {
  const labels = [
    'Direct unpainted',
    'Inherited unpainted',
    'Styled unpainted',
  ];
  const result = runValidator(
    'unpainted.drawio',
    'unpainted.svg',
    ...[...labels, 'Stroked text', 'Overridden fill'].flatMap((label) => [
      '--label',
      label,
    ]),
  );

  assert.equal(result.status, 1);
  for (const label of labels) {
    assert.match(result.stderr, new RegExp(`Required label "${label}"`, 'u'));
  }
  assert.doesNotMatch(result.stderr, /Required label "Stroked text"/u);
  assert.doesNotMatch(result.stderr, /Required label "Overridden fill"/u);
});

test('excludes hidden descendant text from a visible parent label', () => {
  const result = runValidator(
    'hidden-tspan.drawio',
    'hidden-tspan.svg',
    '--label',
    'Visible hidden suffix',
  );

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /Required label "Visible hidden suffix" must appear/u,
  );
});

test('rejects forbidden numeric XML 1.0 control references', () => {
  const result = runValidator(
    'forbidden-numeric.drawio',
    'forbidden-numeric.svg',
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /forbidden XML 1\.0 character/u);
});

test('rejects raw less-than signs inside quoted XML attributes', () => {
  const result = runValidator('raw-attribute.drawio', 'raw-attribute.svg');

  assert.equal(result.status, 1);
  assert.match(result.stderr, /raw < is not allowed in an XML attribute/u);
});

test('rejects CDATA closing sequences in normal character data', () => {
  const result = runValidator('cdata-close.drawio', 'cdata-close.svg');

  assert.equal(result.status, 1);
  assert.match(result.stderr, /\]\]> is not allowed in normal XML character data/u);
});

test('rejects forbidden raw XML 1.0 control characters', async () => {
  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), 'drawio-validator-'),
  );
  const drawioPath = path.join(temporaryDirectory, 'forbidden-raw.drawio');
  const svgPath = path.join(temporaryDirectory, 'forbidden-raw.svg');

  try {
    const [drawioTemplate, svg] = await Promise.all([
      readFile(new URL('forbidden-raw.drawio', fixtureDirectory), 'utf8'),
      readFile(new URL('forbidden-raw.svg', fixtureDirectory), 'utf8'),
    ]);
    await Promise.all([
      writeFile(
        drawioPath,
        drawioTemplate.replace('{{RAW_CONTROL}}', '\u0001'),
      ),
      writeFile(svgPath, svg),
    ]);

    const result = runValidatorPaths(drawioPath, svgPath);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /forbidden XML 1\.0 character/u);
  } finally {
    await rm(temporaryDirectory, {force: true, recursive: true});
  }
});

test('rejects XML comments containing double hyphens or ending in a hyphen', () => {
  const doubleHyphen = runValidator(
    'comment-double-hyphen.drawio',
    'comment-double-hyphen.svg',
  );
  const trailingHyphen = runValidator(
    'comment-trailing-hyphen.drawio',
    'comment-trailing-hyphen.svg',
  );

  assert.equal(doubleHyphen.status, 1);
  assert.match(doubleHyphen.stderr, /XML comments must not contain --/u);
  assert.equal(trailingHyphen.status, 1);
  assert.match(trailingHyphen.stderr, /XML comments must not end with -/u);
});
