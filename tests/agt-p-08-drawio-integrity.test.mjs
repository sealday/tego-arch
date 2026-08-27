import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {assertDurableAgentDiagramGeometry} from '../scripts/validate-agt-p-08-durable-agent-diagram.mjs';
import {SVG_NS, xmlText} from '../scripts/agt-p-08-diagram-model.mjs';
import {parseXml, xmlElements} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/xml-visible-copy.mjs';

const drawioPath = 'diagrams/agt-p-08-durable-agent-hitl.drawio';
const rawPath = '.superpowers/sdd/agt-p-08-durable-agent-hitl.raw.svg';
const svgPath = 'static/img/diagrams/agt-p-08-durable-agent-hitl.svg';
const normalizerPath = 'scripts/normalize-agt-p-08-drawio-svg.mjs';

const drawio = readFileSync(drawioPath, 'utf8');
const raw = readFileSync(rawPath, 'utf8');
const svg = readFileSync(svgPath, 'utf8');
const sha = (value) => createHash('sha256').update(value).digest('hex');
const withSourceSha = (source, published = svg) => published.replace(
  /data-drawio-sha256="[a-f0-9]{64}"/u,
  `data-drawio-sha256="${sha(source)}"`,
);

const decodeEntities = (value) => value
  .replaceAll('&amp;', '&').replaceAll('&quot;', '"')
  .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&apos;', "'");

const sourceVisibleLabels = (source) => [...source.matchAll(/<mxCell\b[^>]*\bvalue="([^"]+)"[^>]*>/gu)]
  .map(([, value]) => decodeEntities(value).replace(/<br\s*\/?\s*>/giu, '\n'))
  .sort();
const publishedVisibleLabels = (published) => xmlElements(parseXml(published).root, 'text', SVG_NS)
  .map((element) => xmlText(element)).sort();

function normalizeRaw(rawMutant) {
  const fixtureDir = mkdtempSync(path.join(tmpdir(), 'agt-p-08-raw-'));
  try {
    const sourceFile = path.join(fixtureDir, 'source.drawio');
    const rawFile = path.join(fixtureDir, 'raw.svg');
    const outputFile = path.join(fixtureDir, 'published.svg');
    writeFileSync(sourceFile, drawio);
    writeFileSync(rawFile, rawMutant);
    const result = spawnSync(process.execPath, [normalizerPath, sourceFile, rawFile, outputFile], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    return {
      result,
      output: result.status === 0 ? readFileSync(outputFile, 'utf8') : null,
    };
  } finally {
    rmSync(fixtureDir, {recursive: true, force: true});
  }
}

function assertLegitimateRawPasses() {
  const normalized = normalizeRaw(raw);
  assert.equal(normalized.result.status, 0, normalized.result.stderr);
  assert.equal(normalized.output, svg, 'legitimate raw export normalizes byte-identically');
}

test('AGT-P-08 Draw.io is the exact visible semantic source for the published SVG', () => {
  assert.deepEqual(sourceVisibleLabels(drawio), publishedVisibleLabels(svg));
});

test('AGT-P-08 validator rejects source semantic and waypoint drift with a recomputed SHA', () => {
  assert.doesNotThrow(() => assertDurableAgentDiagramGeometry(drawio, svg));
  const mutations = [
    ['rejection label', drawio.replace('value="Reject / timeout"', 'value="Reject"')],
    ['unknown label', drawio.replace('value="Unknown effect"', 'value="Unknown outcome"')],
    ['resume label', drawio.replace('value="Resume"', 'value="Continue"')],
    ['resume waypoint', drawio.replace('<mxPoint x="360" y="430" />', '<mxPoint x="500" y="430" />')],
    ['effect waypoint', drawio.replace('<mxPoint x="760" y="420" />', '<mxPoint x="780" y="420" />')],
  ];
  const survivors = [];
  for (const [label, source] of mutations) {
    assert.notEqual(source, drawio, `${label} fixture mutates source`);
    try { assertDurableAgentDiagramGeometry(source, withSourceSha(source)); survivors.push(label); } catch {}
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-08 validator rejects marker, adjacent-node and inherited-stroke clearance mutants', () => {
  assert.doesNotThrow(() => assertDurableAgentDiagramGeometry(drawio, svg));
  const mutations = [
    ['real marker footprint near miss', svg.replace(
      'data-edge-label-for="edge-resume" data-stroke-clearance-css="8" data-arrow-clearance-css="16" data-node-clearance-css="12" x="250" y="420.5"',
      'data-edge-label-for="edge-resume" data-stroke-clearance-css="8" data-arrow-clearance-css="16" data-node-clearance-css="12" x="366" y="540"',
    )],
    ['non-endpoint adjacent node', svg.replace(
      'data-edge-label-for="edge-recovery" data-stroke-clearance-css="8" data-arrow-clearance-css="16" data-node-clearance-css="12" x="600" y="420.5"',
      'data-edge-label-for="edge-recovery" data-stroke-clearance-css="8" data-arrow-clearance-css="16" data-node-clearance-css="12" x="495" y="335"',
    )],
    ['inherited stroke width', svg.replace(
      '<g fill="none" stroke-linejoin="round" stroke-linecap="round" stroke-width="4">',
      '<g fill="none" stroke-linejoin="round" stroke-linecap="round" stroke-width="40">',
    )],
  ];
  const survivors = [];
  for (const [label, published] of mutations) {
    assert.notEqual(published, svg, `${label} fixture mutates published SVG`);
    try { assertDurableAgentDiagramGeometry(drawio, published); survivors.push(label); } catch {}
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-08 normalizer authenticates the actual visible diagrams.net raw export', () => {
  const content = raw.match(/\bcontent="([^"]+)"/u)?.[1];
  assert.ok(content, 'genuine raw contains embedded Draw.io content');
  const forged = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 900" content="${content}"><text>forged empty visual export</text></svg>`;
  const mutations = [
    ['genuine content in forged empty SVG', forged],
    ['deleted visible label', raw.replace('>Unknown effect</div>', '></div>')],
    ['changed raw visible label box', raw.replace(
      'x="911" y="441" width="180" height="34"',
      'x="881" y="441" width="180" height="34"',
    )],
    ['changed raw connector path', raw.replace(
      'M 416 351 L 416 411 L 341 411 L 341 521 L 325.47 521',
      'M 416 351 L 500 411 L 341 411 L 341 521 L 325.47 521',
    )],
    ['changed raw arrow path', raw.replace(
      'M 315.47 521 L 325.47 516 L 325.47 526 Z',
      'M 300 521 L 325.47 516 L 325.47 526 Z',
    )],
    ['non-diagrams.net root', raw.replace('<svg ', '<not-svg ').replace('</svg>', '</not-svg>')],
  ];
  const survivors = [];
  for (const [label, rawMutant] of mutations) {
    assertLegitimateRawPasses();
    assert.notEqual(rawMutant, raw, `${label} fixture mutates raw export`);
    if (normalizeRaw(rawMutant).result.status === 0) survivors.push(label);
  }
  assert.deepEqual(survivors, []);
});
