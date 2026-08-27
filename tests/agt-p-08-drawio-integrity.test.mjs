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
const p06Drawio = readFileSync('diagrams/agt-p-06-control-ownership-models.drawio', 'utf8');
const p06Svg = readFileSync('static/img/diagrams/agt-p-06-control-ownership-models.svg', 'utf8');
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
const compact = (value) => value.replace(/\s+/gu, ' ').trim();
const xmlAttribute = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const replaceOnce = (source, before, after, label) => {
  const changed = source.replace(before, after);
  assert.notEqual(changed, source, `${label} fixture mutates bytes`);
  return changed;
};

function rawCellIdForText(value) {
  const root = parseXml(raw.replace(/<!DOCTYPE[^>]*>\s*/u, '')).root;
  const matches = xmlElements(root, 'g', SVG_NS).filter((group) => {
    if (!group.attributes.get('data-cell-id')) return false;
    const labels = xmlElements(group, 'foreignObject', SVG_NS).map((item) => compact(xmlText(item)));
    return labels.length === 1 && labels[0] === value;
  });
  assert.equal(matches.length, 1, `one raw cell group for ${value}`);
  return matches[0].attributes.get('data-cell-id');
}

function mutateRawCell(value, mutate, label) {
  const id = rawCellIdForText(value);
  const start = raw.indexOf(`<g data-cell-id="${id}">`);
  assert.ok(start >= 0, `${label} raw group start`);
  const next = raw.indexOf('<g data-cell-id="', start + 1);
  const end = next === -1 ? raw.length : next;
  const segment = raw.slice(start, end);
  const changed = mutate(segment);
  assert.notEqual(changed, segment, `${label} fixture mutates raw cell`);
  return `${raw.slice(0, start)}${changed}${raw.slice(end)}`;
}

function rejectedPublishedMutants(mutations) {
  const survivors = [];
  for (const [label, published] of mutations) {
    assert.notEqual(published, svg, `${label} fixture mutates published SVG`);
    try { assertDurableAgentDiagramGeometry(drawio, published); survivors.push(label); } catch {}
  }
  return survivors;
}

function rejectedRawMutants(mutations) {
  const survivors = [];
  for (const [label, rawMutant] of mutations) {
    assert.notEqual(rawMutant, raw, `${label} fixture mutates raw export`);
    if (normalizeRaw(rawMutant).result.status === 0) survivors.push(label);
  }
  return survivors;
}

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

test('AGT-P-08 locks the complete unique Draw.io cell and visible-label inventory', () => {
  assert.doesNotThrow(() => assertDurableAgentDiagramGeometry(drawio, svg));
  const insert = (cell) => replaceOnce(drawio, '      </root>', `${cell}\n      </root>`, 'source inventory');
  const mutations = [
    ['extra visible cell', insert('        <mxCell id="extra-visible" parent="1" style="text;html=1;fontSize=20;" value="Unmodeled visible control" vertex="1"><mxGeometry x="40" y="40" width="200" height="40" as="geometry" /></mxCell>')],
    ['extra edge', insert('        <mxCell id="extra-edge" edge="1" parent="1" source="checkpoint" target="completed" style="edgeStyle=orthogonalEdgeStyle;rounded=0;strokeColor=#000000;strokeWidth=4;endArrow=block;endFill=1;exitX=1;exitY=0.5;entryX=0;entryY=0.5;" value=""><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="700" y="310" /></Array></mxGeometry></mxCell>')],
    ['duplicate ID', insert('        <mxCell id="0" />')],
  ];
  const survivors = [];
  for (const [label, source] of mutations) {
    assert.notEqual(source, drawio, `${label} fixture mutates source`);
    try { assertDurableAgentDiagramGeometry(source, withSourceSha(source)); survivors.push(label); } catch {}
  }
  assert.deepEqual(survivors, []);
});

test('AGT-P-08 applies strict CSS cascade and validates actual painted marker geometry', () => {
  assert.doesNotThrow(() => assertDurableAgentDiagramGeometry(drawio, svg));
  const mutations = [
    ['inline stroke override', replaceOnce(svg, 'data-edge-id="edge-checkpoint"', 'data-edge-id="edge-checkpoint" style="stroke-width:40"', 'inline stroke')],
    ['inline dash override', replaceOnce(svg, 'data-edge-id="edge-recovery"', 'data-edge-id="edge-recovery" style="stroke-dasharray:none"', 'inline dash')],
    ['inline opacity override', replaceOnce(svg, 'data-edge-id="edge-unknown"', 'data-edge-id="edge-unknown" style="opacity:0"', 'inline opacity')],
    ['inline visibility override', replaceOnce(svg, 'data-edge-id="edge-effect"', 'data-edge-id="edge-effect" style="visibility:hidden"', 'inline visibility')],
    ['important stylesheet override', replaceOnce(svg, '<defs>', '<style>path[data-edge-id="edge-checkpoint"] { stroke-width: 40 !important; }</style>\n  <defs>', 'important stylesheet')],
    ['inverse-scaled connector stroke', replaceOnce(svg, 'data-edge-id="edge-checkpoint" data-source="control-store" data-target="checkpoint" d="M 350 130 L 330 130 L 330 220 L 350 220 L 350 310 L 330 310"', 'data-edge-id="edge-checkpoint" data-source="control-store" data-target="checkpoint" transform="scale(.5)" d="M 700 260 L 660 260 L 660 440 L 700 440 L 700 620 L 660 620"', 'post-transform connector stroke')],
    ['inverse-scaled visible text', replaceOnce(svg, 'data-edge-label-for="edge-resume" data-stroke-clearance-css="8" data-arrow-clearance-css="16" data-node-clearance-css="12" x="250" y="420.5"', 'data-edge-label-for="edge-resume" data-stroke-clearance-css="8" data-arrow-clearance-css="16" data-node-clearance-css="12" transform="scale(.5)" x="500" y="841"', 'post-transform visible font')],
    ['extra visible rendered group', replaceOnce(svg, '</svg>', '  <g><circle cx="10" cy="10" r="5" fill="#000000"/></g>\n</svg>', 'published complete element inventory')],
    ['marker path outside viewBox', replaceOnce(svg, 'd="M 0 0 L 16 8 L 0 16 Z" fill="#5B3FD6"', 'd="M 100 0 L 116 8 L 100 16 Z" fill="#5B3FD6"', 'marker relocation')],
    ['marker refX drift', replaceOnce(svg, 'id="arrow-edge-checkpoint" markerUnits="userSpaceOnUse" viewBox="0 0 16 16" markerWidth="16" markerHeight="16" refX="14"', 'id="arrow-edge-checkpoint" markerUnits="userSpaceOnUse" viewBox="0 0 16 16" markerWidth="16" markerHeight="16" refX="4"', 'marker refX')],
    ['marker refY drift', replaceOnce(svg, 'id="arrow-edge-checkpoint" markerUnits="userSpaceOnUse" viewBox="0 0 16 16" markerWidth="16" markerHeight="16" refX="14" refY="8"', 'id="arrow-edge-checkpoint" markerUnits="userSpaceOnUse" viewBox="0 0 16 16" markerWidth="16" markerHeight="16" refX="14" refY="2"', 'marker refY')],
    ['marker size drift', replaceOnce(svg, 'id="arrow-edge-checkpoint" markerUnits="userSpaceOnUse" viewBox="0 0 16 16" markerWidth="16"', 'id="arrow-edge-checkpoint" markerUnits="userSpaceOnUse" viewBox="0 0 16 16" markerWidth="24"', 'marker width')],
    ['marker path shape drift', replaceOnce(svg, 'd="M 0 0 L 16 8 L 0 16 Z" fill="#5B3FD6"', 'd="M 0 2 L 12 8 L 0 14 Z" fill="#5B3FD6"', 'marker shape')],
    ['marker path stroke drift', replaceOnce(svg, 'd="M 0 0 L 16 8 L 0 16 Z" fill="#5B3FD6"', 'd="M 0 0 L 16 8 L 0 16 Z" fill="#5B3FD6" style="stroke:#5B3FD6;stroke-width:40"', 'marker stroke')],
    ['marker path opacity drift', replaceOnce(svg, 'd="M 0 0 L 16 8 L 0 16 Z" fill="#5B3FD6"', 'd="M 0 0 L 16 8 L 0 16 Z" fill="#5B3FD6" style="opacity:0"', 'marker opacity')],
  ];
  assert.deepEqual(rejectedPublishedMutants(mutations), []);
});

test('AGT-P-08 authenticates raw root paint and post-transform visible cell geometry', () => {
  assertLegitimateRawPasses();
  const rootMutations = [
    ['root display none', replaceOnce(raw, 'color-scheme: light dark;', 'color-scheme: light dark; display:none;', 'root display')],
    ['root visibility hidden', replaceOnce(raw, 'color-scheme: light dark;', 'color-scheme: light dark; visibility:hidden;', 'root visibility')],
    ['root opacity zero', replaceOnce(raw, 'color-scheme: light dark;', 'color-scheme: light dark; opacity:0;', 'root opacity')],
    ['root clipped viewBox', replaceOnce(raw, 'viewBox="0 0 1364 854"', 'viewBox="0 0 10 10"', 'root viewBox')],
    ['root width drift', replaceOnce(raw, 'width="1364px"', 'width="10px"', 'root width')],
    ['root clip path', replaceOnce(raw, 'color-scheme: light dark;', 'color-scheme: light dark; clip-path:inset(0 99% 99% 0);', 'root clip')],
    ['container group transform', replaceOnce(raw, '<g data-cell-id="1">', '<g data-cell-id="1" transform="translate(100 0)">', 'container transform')],
    ['unknown group opacity zero', mutateRawCell('Unknown effect', (segment) => segment.replace('<g data-cell-id=', '<g style="opacity:0" data-cell-id='), 'unknown group opacity')],
    ['unknown group visibility hidden', mutateRawCell('Unknown effect', (segment) => segment.replace('<g data-cell-id=', '<g style="visibility:hidden" data-cell-id='), 'unknown group visibility')],
    ['foreignObject display none', mutateRawCell('Unknown effect', (segment) => segment.replace('style="overflow: visible; text-align: left;"', 'style="display:none; overflow: visible; text-align: left;"'), 'foreignObject display')],
    ['foreignObject opacity zero', mutateRawCell('Unknown effect', (segment) => segment.replace('style="overflow: visible; text-align: left;"', 'style="opacity:0; overflow: visible; text-align: left;"'), 'foreignObject opacity')],
    ['foreignObject transform', mutateRawCell('Unknown effect', (segment) => segment.replace('<foreignObject ', '<foreignObject transform="translate(100 0)" '), 'foreignObject transform')],
    ['region group transform', mutateRawCell('Durable control plane', (segment) => segment.replace('<g data-cell-id=', '<g transform="translate(100 0)" data-cell-id='), 'region transform')],
    ['node group transform', mutateRawCell('Durable control store', (segment) => segment.replace('<g data-cell-id=', '<g transform="translate(100 0)" data-cell-id='), 'node transform')],
    ['caption group transform', mutateRawCell('Control state + checkpoint refs', (segment) => segment.replace('<g data-cell-id=', '<g transform="translate(100 0)" data-cell-id='), 'caption transform')],
    ['edge-label group transform', mutateRawCell('Unknown effect', (segment) => segment.replace('<g data-cell-id=', '<g transform="translate(100 0)" data-cell-id='), 'edge label transform')],
    ['extra visible group and shape', replaceOnce(raw, '<g><g data-cell-id="0">', '<g><g><circle cx="10" cy="10" r="5" fill="#000000"/></g><g data-cell-id="0">', 'raw complete element inventory')],
  ];
  assert.deepEqual(rejectedRawMutants(rootMutations), []);
});

test('AGT-P-08 authenticates raw connector and arrow continuity and rejects cross-diagram visuals', () => {
  assertLegitimateRawPasses();
  const content = raw.match(/\bcontent="([^"]+)"/u)?.[1];
  assert.ok(content, 'genuine raw contains encoded P08 content');
  const forged = `<?xml version="1.0"?><svg xmlns="${SVG_NS}" id="ge-svg-valid-forgery" width="1364px" height="854px" viewBox="0 0 1364 854" content="${content}"><g data-cell-id="0"><g data-cell-id="1"><text>forged empty visual export</text></g></g></svg>`;
  const asRaw = (published, embedded, id) => published.replace('<svg ', `<svg id="${id}" content="${xmlAttribute(embedded)}" `);
  const mutations = [
    ['connector group transform', replaceOnce(raw, '<g data-cell-id="V9V_iq6-IuhN3cYMC6GB-24">', '<g data-cell-id="V9V_iq6-IuhN3cYMC6GB-24" transform="translate(100 0)">', 'connector group transform')],
    ['connector inline stroke override', replaceOnce(raw, 'pointer-events="stroke" style="stroke: light-dark(rgb(91, 63, 214), rgb(178, 154, 255));"', 'pointer-events="stroke" style="stroke: light-dark(rgb(91, 63, 214), rgb(178, 154, 255)); stroke-width:40;"', 'raw connector inline stroke')],
    ['connector inline opacity override', replaceOnce(raw, 'pointer-events="stroke" style="stroke: light-dark(rgb(91, 63, 214), rgb(178, 154, 255));"', 'pointer-events="stroke" style="stroke: light-dark(rgb(91, 63, 214), rgb(178, 154, 255)); opacity:0;"', 'raw connector inline opacity')],
    ['connector inline dash override', replaceOnce(raw, 'stroke-dasharray="40 32" pointer-events="stroke" style="stroke: light-dark(rgb(180, 35, 44), rgb(255, 153, 161));"', 'stroke-dasharray="40 32" pointer-events="stroke" style="stroke: light-dark(rgb(180, 35, 44), rgb(255, 153, 161)); stroke-dasharray:none;"', 'raw connector inline dash')],
    ['connector final-point gap', replaceOnce(raw, 'L 325.47 291', 'L 320 291', 'raw connector endpoint')],
    ['same-size arrow translation', replaceOnce(raw, 'M 315.47 291 L 325.47 286 L 325.47 296 Z', 'M 415.47 291 L 425.47 286 L 425.47 296 Z', 'raw arrow translation')],
    ['same-size arrow rotation', replaceOnce(raw, '<path d="M 315.47 291 L 325.47 286 L 325.47 296 Z"', '<path transform="rotate(180 320.47 291)" d="M 315.47 291 L 325.47 286 L 325.47 296 Z"', 'raw arrow rotation')],
    ['same-size arrow direction reversal', replaceOnce(raw, 'M 315.47 291 L 325.47 286 L 325.47 296 Z', 'M 325.47 291 L 315.47 286 L 315.47 296 Z', 'raw arrow direction')],
    ['valid-ID forged empty raw', forged],
    ['genuine P06 diagram', asRaw(p06Svg, p06Drawio, 'ge-svg-genuine-p06')],
    ['P06 visuals with genuine P08 content', asRaw(p06Svg, decodeEntities(content), 'ge-svg-p06-visuals-p08-content')],
  ];
  assert.deepEqual(rejectedRawMutants(mutations), []);
});
