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

test('evaluates effective fill and stroke paint independently', () => {
  const unpaintedLabels = [
    'Direct unpainted',
    'Inherited unpainted',
    'Styled unpainted',
    'Zero stroke unpainted',
    'Both transparent',
  ];
  const paintedLabels = [
    'Stroked text',
    'Overridden fill',
    'Stroke survives zero fill opacity',
    'Fill survives zero stroke opacity',
  ];
  const result = runValidator(
    'unpainted.drawio',
    'unpainted.svg',
    ...[...unpaintedLabels, ...paintedLabels].flatMap((label) => [
      '--label', label,
    ]),
  );

  assert.equal(result.status, 1);
  for (const label of unpaintedLabels) {
    assert.match(result.stderr, new RegExp(`Required label "${label}"`, 'u'));
  }
  for (const label of paintedLabels) {
    assert.doesNotMatch(
      result.stderr,
      new RegExp(`Required label "${label}"`, 'u'),
    );
  }
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

test('applies strict shared XML spacing and SVG cascade semantics', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'drawio-validator-shared-'));
  const drawioPath = path.join(temporaryDirectory, 'shared.drawio');
  const svgPath = path.join(temporaryDirectory, 'shared.svg');
  const drawio = '<mxfile><diagram name="Page-1"><mxGraphModel><root><mxCell value="Visible override"/></root></mxGraphModel></diagram></mxfile>';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" role="img" aria-labelledby="title desc">
<title id="title">Title</title><desc id="desc">Description</desc>
<g visibility="hidden"><text visibility="visible">Visible override</text></g>
<g style="display:none !important"><text>Hidden important</text></g>
</svg>`;
  try {
    await Promise.all([writeFile(drawioPath, drawio), writeFile(svgPath, svg)]);
    const valid = runValidatorPaths(drawioPath, svgPath, '--label', 'Visible override');
    assert.equal(valid.status, 0, valid.stderr);

    await writeFile(svgPath, svg.replace('role="img" ', 'role="img"'));
    const missingSpace = runValidatorPaths(drawioPath, svgPath);
    assert.equal(missingSpace.status, 1);
    assert.match(missingSpace.stderr, /expected whitespace|well-formed XML/u);

    await writeFile(svgPath, svg.replace('</text>', '</ text>'));
    const spacedClose = runValidatorPaths(drawioPath, svgPath);
    assert.equal(spacedClose.status, 1);
    assert.match(spacedClose.stderr, /invalid XML closing tag|well-formed XML/u);
  } finally {
    await rm(temporaryDirectory, {recursive: true, force: true});
  }
});

test('accepts a named compressed Draw.io page for pair validation', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'drawio-validator-compressed-'));
  const drawioPath = path.join(temporaryDirectory, 'compressed.drawio');
  const svgPath = path.join(temporaryDirectory, 'compressed.svg');
  try {
    await Promise.all([
      writeFile(
        drawioPath,
        '<mxfile><diagram name="Page-1">eJyrVkrLz1eyUkpKLFKqBQAQSwQJ</diagram></mxfile>',
      ),
      writeFile(
        svgPath,
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" role="img" aria-labelledby="title desc"><title id="title">Title</title><desc id="desc">Description</desc></svg>',
      ),
    ]);
    const result = runValidatorPaths(drawioPath, svgPath);
    assert.equal(result.status, 0, result.stderr);
  } finally {
    await rm(temporaryDirectory, {recursive: true, force: true});
  }
});

test('does not accept foreign SVG title and description as accessibility metadata', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'drawio-validator-foreign-'));
  const drawioPath = path.join(temporaryDirectory, 'foreign.drawio');
  const svgPath = path.join(temporaryDirectory, 'foreign.svg');
  try {
    await Promise.all([
      writeFile(
        drawioPath,
        '<mxfile><diagram name="Page-1"><mxGraphModel><root/></mxGraphModel></diagram></mxfile>',
      ),
      writeFile(
        svgPath,
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:x="urn:foreign" viewBox="0 0 10 10" role="img" aria-labelledby="title desc"><x:title id="title">Title</x:title><x:desc id="desc">Description</x:desc></svg>',
      ),
    ]);
    const result = runValidatorPaths(drawioPath, svgPath);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /accessible title and description/u);
  } finally {
    await rm(temporaryDirectory, {recursive: true, force: true});
  }
});

test('shares strict XML declaration and PI handling with the checker', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'drawio-validator-pi-'));
  const drawioPath = path.join(temporaryDirectory, 'pi.drawio');
  const svgPath = path.join(temporaryDirectory, 'pi.svg');
  const drawio = '<?xml version="1.0"?><?audit ok?><mxfile><diagram name="Page-1"><mxGraphModel><root/></mxGraphModel></diagram></mxfile>';
  const svg = '<?xml version="1.0"?><?audit ok?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" role="img" aria-labelledby="title desc"><title id="title">Title</title><desc id="desc">Description</desc></svg>';
  try {
    await Promise.all([writeFile(drawioPath, drawio), writeFile(svgPath, svg)]);
    const valid = runValidatorPaths(drawioPath, svgPath);
    assert.equal(valid.status, 0, valid.stderr);

    await writeFile(svgPath, `<!--before-->${svg}`);
    const invalid = runValidatorPaths(drawioPath, svgPath);
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /XML declaration|well-formed XML/u);
  } finally {
    await rm(temporaryDirectory, {recursive: true, force: true});
  }
});

test('rejects non-XML-S syntax and document-boundary whitespace', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'drawio-validator-xml-s-'));
  const drawioPath = path.join(temporaryDirectory, 'whitespace.drawio');
  const svgPath = path.join(temporaryDirectory, 'whitespace.svg');
  const drawio = '<mxfile><diagram name="Page-1"><mxGraphModel><root/></mxGraphModel></diagram></mxfile>';
  const root = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" role="img" aria-labelledby="title desc"><title id="title">Title</title><desc id="desc">Description</desc></svg>';
  try {
    await writeFile(drawioPath, drawio);
    for (const whitespace of ['\u00A0', '\u2028']) {
      const invalid = [
        {line: 1, source: root.replace('" viewBox', `"${whitespace}viewBox`)},
        {line: 1, source: `<?xml${whitespace}version="1.0"?>${root}`},
        {line: 1, source: `<?audit${whitespace}ok?>${root}`},
        {line: 2, source: `\n${whitespace}${root}`},
        {line: 2, source: `${root}\n${whitespace}`},
      ];
      for (const {line, source} of invalid) {
        await writeFile(svgPath, source);
        const result = runValidatorPaths(drawioPath, svgPath);
        assert.equal(result.status, 1, JSON.stringify(source));
        assert.match(result.stderr, new RegExp(`whitespace\\.svg:${line}:`, 'u'));
      }
    }
  } finally {
    await rm(temporaryDirectory, {recursive: true, force: true});
  }
});
