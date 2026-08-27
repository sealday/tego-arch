import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

const drawioPath = 'diagrams/production-incident-response-agent.drawio';
const rawPath = '.superpowers/sdd/production-incident-response-agent.raw.svg';
const publishedPath = 'static/img/diagrams/production-incident-response-agent.svg';
const normalizerPath = 'scripts/normalize-production-incident-response-agent-svg.mjs';
const drawio = readFileSync(drawioPath, 'utf8');
const raw = readFileSync(rawPath, 'utf8');
const published = readFileSync(publishedPath, 'utf8');

function withRootId(value) {
  const rootTag = raw.match(/<svg\b[^>]*>/u)?.[0];
  assert.ok(rootTag, 'reviewed export has an SVG root tag');
  assert.doesNotMatch(rootTag, /\sid="/u, 'reviewed export omits its optional root id');
  return raw.replace('<svg xmlns=', `<svg id="${value}" xmlns=`);
}

function normalize(rawFixture) {
  const directory = mkdtempSync(path.join(tmpdir(), 'incident-normalizer-'));
  try {
    const sourceFile = path.join(directory, 'source.drawio');
    const rawFile = path.join(directory, 'raw.svg');
    const outputFile = path.join(directory, 'published.svg');
    writeFileSync(sourceFile, drawio);
    writeFileSync(rawFile, rawFixture);
    const result = spawnSync(
      process.execPath,
      [normalizerPath, sourceFile, rawFile, outputFile],
      {cwd: process.cwd(), encoding: 'utf8'},
    );
    return {
      result,
      output: result.status === 0 ? readFileSync(outputFile, 'utf8') : undefined,
    };
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
}

test('incident normalizer accepts an absent or strict diagrams.net root id', () => {
  const absent = normalize(raw);
  assert.equal(absent.result.status, 0, absent.result.stderr);
  assert.equal(absent.output, published, 'reviewed absent-id raw reproduces the committed SVG byte-for-byte');

  const strict = normalize(withRootId('ge-svg-incident_export-2026'));
  assert.equal(strict.result.status, 0, strict.result.stderr);
  assert.doesNotMatch(strict.output, /\bid="ge-svg-incident_export-2026"/u, 'normalization strips the export id');
});

test('incident normalizer rejects illegal and foreign root ids through the subprocess', () => {
  for (const rootId of [
    'ge-svg-incident!',
    'ge-svg-incident export',
    'ge-svg-! permissive',
    'ge-svg-',
    '',
    'diagram-export',
  ]) {
    const {result, output} = normalize(withRootId(rootId));
    assert.notEqual(result.status, 0, `${rootId} must be rejected`);
    assert.equal(output, undefined, `${rootId} must not publish output`);
    assert.match(
      result.stderr,
      /production incident response agent SVG normalization failed: raw artifact has an unexpected diagrams\.net export identity/u,
      `${rootId} emits the fail-closed identity error`,
    );
  }
});
