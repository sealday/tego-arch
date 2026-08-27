import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  parseXml,
  xmlElements,
} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/xml-visible-copy.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';
const AUTHORING_WIDTH = 1200;
const RENDERED_WIDTH = 800;
const CSS_SCALE = RENDERED_WIDTH / AUTHORING_WIDTH;
// The diagrams.net drawing-bounds export keeps the 1200-unit authoring scale
// in the 1200-unit viewBox, then crops the exported geometry by this offset.
const EXPORT_TRANSFORM = Object.freeze({scale: 1, x: -19, y: -29});
const EXPORTED_GROUP_TRANSLATE = Object.freeze({x: 19, y: 29});
const EPSILON = 0.02;

const REGION_CONTRACTS = [
  ['supervisor-region', '1 · Supervisor：保留控制'],
  ['handoff-region', '2 · Handoff：移动控制'],
  ['tool-region', '3 · Agent as Tool'],
];
const NODE_IDS = [
  'supervisor', 'worker', 'handoff', 'active-agent', 'parent-agent', 'agent-as-tool',
];
const EDGE_CONTRACTS = [
  ['edge-supervisor-delegate', 'supervisor', 'worker'],
  ['edge-worker-return', 'worker', 'supervisor'],
  ['edge-handoff-move', 'handoff', 'active-agent'],
  ['edge-parent-call', 'parent-agent', 'agent-as-tool'],
  ['edge-tool-return', 'agent-as-tool', 'parent-agent'],
];

const fail = (message) => { throw new Error(`AGT-P-06 diagram contract: ${message}`); };
const number = (value, label) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) fail(`${label} must be numeric`);
  return parsed;
};
const close = (actual, expected, label, tolerance = EPSILON) => {
  if (Math.abs(actual - expected) > tolerance) {
    fail(`${label} expected ${expected}, received ${actual}`);
  }
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const attr = (element, name, label) => {
  const value = element?.attributes.get(name);
  if (value === undefined) fail(`${label} lacks ${name}`);
  return value;
};
const byAttr = (root, localName, name, value, namespace = undefined) => {
  const matches = xmlElements(root, localName, namespace)
    .filter((element) => element.attributes.get(name) === value);
  if (matches.length !== 1) fail(`${localName}[${name}=${value}] must occur exactly once`);
  return matches[0];
};
const geometryForCell = (drawioRoot, id) => {
  const cell = byAttr(drawioRoot, 'mxCell', 'id', id, '');
  const geometries = xmlElements(cell, 'mxGeometry', '');
  if (geometries.length !== 1) fail(`${id} must have one mxGeometry`);
  const geometry = geometries[0];
  return {
    cell,
    x: number(attr(geometry, 'x', id), `${id}.x`),
    y: number(attr(geometry, 'y', id), `${id}.y`),
    width: number(attr(geometry, 'width', id), `${id}.width`),
    height: number(attr(geometry, 'height', id), `${id}.height`),
  };
};
const svgBox = (svgRoot, dataName, id) => {
  const element = byAttr(svgRoot, 'rect', dataName, id, SVG_NS);
  return {
    element,
    x: number(attr(element, 'x', id), `${id}.svg.x`),
    y: number(attr(element, 'y', id), `${id}.svg.y`),
    width: number(attr(element, 'width', id), `${id}.svg.width`),
    height: number(attr(element, 'height', id), `${id}.svg.height`),
    stroke: number(element.attributes.get('stroke-width') ?? '0', `${id}.stroke-width`),
  };
};
const styleMap = (style) => new Map(style.split(';').filter(Boolean).map((item) => {
  const separator = item.indexOf('=');
  return separator < 0 ? [item, ''] : [item.slice(0, separator), item.slice(separator + 1)];
}));
const pathLine = (path, id) => {
  const match = attr(path, 'd', id).match(/^M ([\d.-]+) ([\d.-]+) L ([\d.-]+) ([\d.-]+)$/u);
  if (!match) fail(`${id} must be a single auditable line path`);
  return match.slice(1).map(Number);
};
const arrowApex = (path, id) => {
  const match = attr(path, 'd', id).match(/^M ([\d.-]+) ([\d.-]+) L /u);
  if (!match) fail(`${id} arrow must expose an auditable apex`);
  return match.slice(1).map(Number);
};
const textBox = (text, {translated = false} = {}) => {
  const font = number(attr(text, 'font-size', 'text'), 'text.font-size');
  const length = number(attr(text, 'textLength', 'text'), 'text.textLength');
  const x = number(attr(text, 'x', 'text'), 'text.x') + (translated ? EXPORTED_GROUP_TRANSLATE.x : 0);
  const y = number(attr(text, 'y', 'text'), 'text.y') + (translated ? EXPORTED_GROUP_TRANSLATE.y : 0);
  const anchor = text.attributes.get('text-anchor') ?? 'start';
  const left = anchor === 'middle' ? x - length / 2 : x;
  return {x, y, font, length, left, right: left + length, top: y - font * 0.9, bottom: y + font * 0.25};
};
const css = (authoringUnits) => authoringUnits * CSS_SCALE;
const min = (actual, threshold, label) => {
  if (actual + EPSILON < threshold) fail(`${label} is ${actual.toFixed(2)}px; minimum is ${threshold}px`);
};
const pointIntervalDistance = (point, start, end) => (
  point < start ? start - point : point > end ? point - end : 0
);
const intervalDistance = (startA, endA, startB, endB) => (
  Math.max(startB - endA, startA - endB, 0)
);

export function assertControlOwnershipDiagramGeometry(drawio, svg) {
  const drawioRoot = parseXml(drawio, '<agt-p-06.drawio>').root;
  const svgRoot = parseXml(svg, '<agt-p-06.svg>').root;
  if (attr(svgRoot, 'data-drawio-sha256', 'svg root') !== sha256(drawio)) {
    fail('embedded Draw.io SHA-256 does not match source bytes');
  }
  if (attr(svgRoot, 'viewBox', 'svg root') !== '0 0 1200 720') fail('viewBox must remain 1200×720');

  const drawioBoxes = new Map();
  for (const [id, label] of REGION_CONTRACTS) {
    const source = geometryForCell(drawioRoot, id);
    if (attr(source.cell, 'value', id) !== label) fail(`${id} label drift`);
    const published = svgBox(svgRoot, 'data-region-id', id);
    for (const key of ['x', 'y']) close(published[key], source[key] * EXPORT_TRANSFORM.scale + EXPORT_TRANSFORM[key], `${id}.${key}`);
    for (const key of ['width', 'height']) close(published[key], source[key] * EXPORT_TRANSFORM.scale, `${id}.${key}`);
    drawioBoxes.set(id, source);

    const labelText = byAttr(svgRoot, 'text', 'data-region-label-for', id, SVG_NS);
    const bounds = textBox(labelText);
    min(css(bounds.font), 15, `${id} title font`);
    const innerLeft = source.x + published.stroke / 2;
    const innerRight = source.x + source.width - published.stroke / 2;
    const innerTop = source.y + published.stroke / 2;
    min(css(bounds.left - innerLeft), 12, `${id} title left clearance`);
    min(css(innerRight - bounds.right), 12, `${id} title right clearance`);
    min(css(bounds.top - innerTop), 12, `${id} title top clearance`);
  }

  for (const id of NODE_IDS) {
    const source = geometryForCell(drawioRoot, id);
    const published = svgBox(svgRoot, 'data-node-id', id);
    for (const key of ['x', 'y']) close(published[key], source[key] * EXPORT_TRANSFORM.scale + EXPORT_TRANSFORM[key], `${id}.${key}`);
    for (const key of ['width', 'height']) close(published[key], source[key] * EXPORT_TRANSFORM.scale, `${id}.${key}`);
    drawioBoxes.set(id, source);

    const title = textBox(byAttr(svgRoot, 'text', 'data-title-for', id, SVG_NS));
    const type = textBox(byAttr(svgRoot, 'text', 'data-type-for', id, SVG_NS), {translated: true});
    min(css(title.font), 15, `${id} title font`);
    min(css(type.font), 10, `${id} type font`);
    min(css(type.y - title.y), 22, `${id} title/type baseline gap`);
    const innerLeft = source.x + published.stroke / 2;
    const innerRight = source.x + source.width - published.stroke / 2;
    for (const [name, bounds] of [['title', title], ['type', type]]) {
      min(css(bounds.left - innerLeft), 16, `${id} ${name} left padding`);
      min(css(innerRight - bounds.right), 16, `${id} ${name} right padding`);
    }
    min(css(source.y + source.height - published.stroke / 2 - type.bottom), 14, `${id} type bottom clearance`);
  }

  for (const [id, sourceId, targetId] of EDGE_CONTRACTS) {
    const edge = byAttr(drawioRoot, 'mxCell', 'id', id, '');
    if (attr(edge, 'source', id) !== sourceId || attr(edge, 'target', id) !== targetId) {
      fail(`${id} endpoint identity drift`);
    }
    const style = styleMap(attr(edge, 'style', id));
    const source = drawioBoxes.get(sourceId);
    const target = drawioBoxes.get(targetId);
    const expectedStart = [
      (source.x + number(style.get('exitX'), `${id}.exitX`) * source.width) * EXPORT_TRANSFORM.scale + EXPORT_TRANSFORM.x,
      (source.y + number(style.get('exitY'), `${id}.exitY`) * source.height) * EXPORT_TRANSFORM.scale + EXPORT_TRANSFORM.y,
    ];
    const expectedTarget = [
      (target.x + number(style.get('entryX'), `${id}.entryX`) * target.width) * EXPORT_TRANSFORM.scale + EXPORT_TRANSFORM.x,
      (target.y + number(style.get('entryY'), `${id}.entryY`) * target.height) * EXPORT_TRANSFORM.scale + EXPORT_TRANSFORM.y,
    ];
    const edgePath = byAttr(svgRoot, 'path', 'data-edge-id', id, SVG_NS);
    if (attr(edgePath, 'data-source', id) !== sourceId || attr(edgePath, 'data-target', id) !== targetId) {
      fail(`${id} published endpoint identity drift`);
    }
    const cellGroup = xmlElements(svgRoot, 'g', SVG_NS)
      .find((element) => element.attributes.get('data-edge-group-id') === id);
    if (!cellGroup) fail(`${id} must have one auditable SVG edge group`);
    const paths = xmlElements(cellGroup, 'path', SVG_NS);
    if (paths.length !== 2) fail(`${id} must contain one connector and one arrow path`);
    const [startX, startY, terminalX, terminalY] = pathLine(edgePath, id);
    const [apexX, apexY] = arrowApex(paths[1], id);
    close(startX, expectedStart[0], `${id}.startX`);
    close(startY, expectedStart[1], `${id}.startY`);
    // diagrams.net keeps the filled block-arrow apex inside the target stroke;
    // five authoring units covers the 3px and 4px connector variants only.
    close(apexX, expectedTarget[0], `${id}.arrowX`, 5);
    close(apexY, expectedTarget[1], `${id}.arrowY`, 5);
    close(terminalX, apexX, `${id}.terminalX`);
    const direction = Math.sign(expectedTarget[1] - expectedStart[1]);
    if (Math.sign(apexY - startY) !== direction || Math.sign(apexY - terminalY) !== direction) {
      fail(`${id} arrow direction disagrees with Draw.io ports`);
    }
    const label = textBox(byAttr(svgRoot, 'text', 'data-edge-label-for', id, SVG_NS), {translated: true});
    min(css(label.font), 15, `${id} label font`);
    const strokeDistance = pointIntervalDistance(
      startX + EXPORTED_GROUP_TRANSLATE.x,
      label.left,
      label.right,
    );
    min(css(strokeDistance), 8, `${id} label/stroke clearance`);
    const arrowY = apexY + EXPORTED_GROUP_TRANSLATE.y;
    const arrowDistance = pointIntervalDistance(arrowY, label.top, label.bottom);
    min(css(arrowDistance), 16, `${id} label/arrow clearance`);
    const nodeDistance = Math.min(
      intervalDistance(label.top, label.bottom, source.y, source.y + source.height),
      intervalDistance(label.top, label.bottom, target.y, target.y + target.height),
    );
    min(css(nodeDistance), 12, `${id} label/node clearance`);
  }
}

async function main() {
  const [drawioPath, svgPath] = process.argv.slice(2);
  if (!drawioPath || !svgPath) fail('usage: validate-agt-p-06-control-ownership-diagram.mjs <drawio> <svg>');
  assertControlOwnershipDiagramGeometry(
    await readFile(drawioPath, 'utf8'),
    await readFile(svgPath, 'utf8'),
  );
  console.log('Validated AGT-P-06 source hash, geometry, edges, and rendered clearances');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
