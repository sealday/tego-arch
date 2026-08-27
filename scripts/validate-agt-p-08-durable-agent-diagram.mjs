import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  parseXml,
  xmlElements,
} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/xml-visible-copy.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SCALE_AT_800_PX = 800 / 1400;
const EPSILON = 0.02;
const NODE_CONTRACTS = [
  ['control-store', 'Durable control store', 350, 70, 300, 120],
  ['checkpoint', 'Checkpoint', 70, 250, 260, 120],
  ['approval-service', 'Approval required', 390, 250, 300, 120],
  ['sandbox-tool', 'Sandbox / Tool', 70, 480, 260, 120],
  ['authority-system', 'Authority system', 1010, 250, 300, 120],
  ['reconciliation', 'Result reconciliation', 390, 480, 300, 120],
  ['completed', 'Completed', 390, 700, 300, 120],
  ['manual-terminal', 'Manual terminal', 1010, 700, 300, 120],
];
const EDGE_CONTRACTS = [
  ['edge-checkpoint', 'control-store', 'checkpoint', [[350, 130], [330, 130], [330, 310]]],
  ['edge-approval', 'checkpoint', 'approval-service', [[330, 310], [390, 310]]],
  ['edge-resume', 'approval-service', 'sandbox-tool', [[435, 370], [435, 430], [350, 430], [350, 540], [330, 540]]],
  ['edge-reject', 'approval-service', 'manual-terminal', [[690, 310], [850, 310], [850, 650], [1160, 650], [1160, 700]]],
  ['edge-effect', 'sandbox-tool', 'authority-system', [[200, 600], [200, 640], [940, 640], [940, 310], [1010, 310]]],
  ['edge-reconcile', 'authority-system', 'reconciliation', [[1160, 370], [1160, 440], [760, 440], [760, 540], [690, 540]]],
  ['edge-recovery', 'reconciliation', 'control-store', [[690, 510], [740, 510], [740, 130], [650, 130]]],
  ['edge-unknown', 'reconciliation', 'manual-terminal', [[690, 570], [820, 570], [820, 760], [1010, 760]]],
  ['edge-complete', 'control-store', 'completed', [[605, 190], [810, 190], [810, 650], [540, 650], [540, 700]]],
];
const LABEL_EDGE_IDS = new Set(['edge-resume', 'edge-reject', 'edge-reconcile', 'edge-recovery']);

const fail = (message) => { throw new Error(`AGT-P-08 diagram contract: ${message}`); };
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const numeric = (value, label) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) fail(`${label} must be numeric`);
  return parsed;
};
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
const close = (actual, expected, label) => {
  if (Math.abs(actual - expected) > EPSILON) fail(`${label} expected ${expected}, received ${actual}`);
};
const atLeastCss = (authoringUnits, threshold, label) => {
  const rendered = authoringUnits * SCALE_AT_800_PX;
  if (rendered + EPSILON < threshold) fail(`${label} is ${rendered.toFixed(2)}px at 800px; minimum is ${threshold}px`);
};
const geometry = (root, id) => {
  const cell = byAttr(root, 'mxCell', 'id', id, '');
  const item = xmlElements(cell, 'mxGeometry', '')[0];
  if (!item) fail(`${id} lacks mxGeometry`);
  return {
    cell,
    x: numeric(attr(item, 'x', id), `${id}.x`),
    y: numeric(attr(item, 'y', id), `${id}.y`),
    width: numeric(attr(item, 'width', id), `${id}.width`),
    height: numeric(attr(item, 'height', id), `${id}.height`),
  };
};
const svgRect = (root, id) => {
  const element = byAttr(root, 'rect', 'data-node-id', id, SVG_NS);
  return {
    element,
    x: numeric(attr(element, 'x', id), `${id}.svg.x`),
    y: numeric(attr(element, 'y', id), `${id}.svg.y`),
    width: numeric(attr(element, 'width', id), `${id}.svg.width`),
    height: numeric(attr(element, 'height', id), `${id}.svg.height`),
    stroke: numeric(element.attributes.get('stroke-width') ?? '0', `${id}.stroke`),
  };
};
const textBox = (element, id, inheritedAnchor = 'start') => {
  const x = numeric(attr(element, 'x', id), `${id}.x`);
  const y = numeric(attr(element, 'y', id), `${id}.y`);
  const font = numeric(attr(element, 'font-size', id), `${id}.font-size`);
  const length = numeric(attr(element, 'textLength', id), `${id}.textLength`);
  const anchor = element.attributes.get('text-anchor') ?? inheritedAnchor;
  const left = anchor === 'middle' ? x - length / 2 : anchor === 'end' ? x - length : x;
  return {left, right: left + length, top: y - font * 0.9, bottom: y + font * 0.25, font};
};
const intervalDistance = (a1, a2, b1, b2) => Math.max(b1 - a2, a1 - b2, 0);
const rectDistance = (a, b) => Math.hypot(
  intervalDistance(a.left, a.right, b.left, b.right),
  intervalDistance(a.top, a.bottom, b.top, b.bottom),
);
const pointRectDistance = ([x, y], box) => Math.hypot(
  x < box.left ? box.left - x : x > box.right ? x - box.right : 0,
  y < box.top ? box.top - y : y > box.bottom ? y - box.bottom : 0,
);
const segmentRectDistance = ([start, end], box) => {
  const segment = {
    left: Math.min(start[0], end[0]), right: Math.max(start[0], end[0]),
    top: Math.min(start[1], end[1]), bottom: Math.max(start[1], end[1]),
  };
  return rectDistance(segment, box);
};
const parsePath = (element, id) => {
  const tokens = attr(element, 'd', id).trim().split(/\s+/u);
  const points = [];
  for (let index = 0; index < tokens.length;) {
    const command = tokens[index++];
    if (command !== 'M' && command !== 'L') fail(`${id} path must use auditable M/L commands`);
    points.push([numeric(tokens[index++], `${id}.x`), numeric(tokens[index++], `${id}.y`)]);
  }
  return points;
};

export function assertDurableAgentDiagramGeometry(drawio, svg) {
  const sourceRoot = parseXml(drawio, '<agt-p-08.drawio>').root;
  const svgRoot = parseXml(svg, '<agt-p-08.svg>').root;
  if (attr(svgRoot, 'viewBox', 'svg root') !== '0 0 1400 900') fail('viewBox must remain 1400×900');
  if (attr(svgRoot, 'data-drawio-sha256', 'svg root') !== sha256(drawio)) fail('source SHA-256 mismatch');
  const diagram = xmlElements(sourceRoot, 'diagram', '')[0];
  if (attr(diagram, 'name', 'diagram') !== 'AGT-P-08 durable agent and human approval') fail('diagram page name drift');

  const boxes = new Map();
  for (const [id, label, x, y, width, height] of NODE_CONTRACTS) {
    const source = geometry(sourceRoot, id);
    if (attr(source.cell, 'value', id) !== label) fail(`${id} source label drift`);
    for (const [key, expected] of Object.entries({x, y, width, height})) close(source[key], expected, `${id}.source.${key}`);
    const published = svgRect(svgRoot, id);
    for (const key of ['x', 'y', 'width', 'height']) close(published[key], source[key], `${id}.svg.${key}`);
    boxes.set(id, published);

    const title = textBox(byAttr(svgRoot, 'text', 'data-title-for', id, SVG_NS), `${id}.title`, 'middle');
    const type = textBox(byAttr(svgRoot, 'text', 'data-type-for', id, SVG_NS), `${id}.type`, 'middle');
    atLeastCss(title.font, 15, `${id} title font`);
    atLeastCss(type.font, 10, `${id} type font`);
    atLeastCss(type.top - title.top, 22, `${id} baseline gap`);
    const inner = {left: x + published.stroke / 2, right: x + width - published.stroke / 2, top: y + published.stroke / 2, bottom: y + height - published.stroke / 2};
    for (const [kind, bounds] of [['title', title], ['type', type]]) {
      atLeastCss(bounds.left - inner.left, 16, `${id} ${kind} left padding`);
      atLeastCss(inner.right - bounds.right, 16, `${id} ${kind} right padding`);
    }
    atLeastCss(inner.bottom - type.bottom, 14, `${id} type bottom clearance`);
  }

  for (const [id, sourceId, targetId, expectedPoints] of EDGE_CONTRACTS) {
    const edge = byAttr(sourceRoot, 'mxCell', 'id', id, '');
    if (attr(edge, 'source', id) !== sourceId || attr(edge, 'target', id) !== targetId) fail(`${id} source endpoints drift`);
    if (sourceId === 'manual-terminal') fail('manual terminal must not have an automatic outgoing edge');
    const pathElement = byAttr(svgRoot, 'path', 'data-edge-id', id, SVG_NS);
    if (attr(pathElement, 'data-source', id) !== sourceId || attr(pathElement, 'data-target', id) !== targetId) fail(`${id} published endpoints drift`);
    const actualPoints = parsePath(pathElement, id);
    if (actualPoints.length !== expectedPoints.length) fail(`${id} path point count drift`);
    for (let index = 0; index < expectedPoints.length; index += 1) {
      close(actualPoints[index][0], expectedPoints[index][0], `${id}.point${index}.x`);
      close(actualPoints[index][1], expectedPoints[index][1], `${id}.point${index}.y`);
    }
    if (!attr(pathElement, 'marker-end', id).startsWith('url(#arrow-')) fail(`${id} lacks directional arrow`);
    if (!LABEL_EDGE_IDS.has(id)) continue;

    const label = textBox(byAttr(svgRoot, 'text', 'data-edge-label-for', id, SVG_NS), `${id}.label`);
    atLeastCss(label.font, 15, `${id} label font`);
    const strokeWidth = numeric(pathElement.attributes.get('stroke-width') ?? '4', `${id}.stroke-width`);
    const strokeDistance = Math.min(...actualPoints.slice(1).map((point, index) =>
      segmentRectDistance([actualPoints[index], point], label))) - strokeWidth / 2;
    atLeastCss(strokeDistance, 8, `${id} label/stroke clearance`);
    atLeastCss(pointRectDistance(actualPoints.at(-1), label), 16, `${id} label/arrow clearance`);
    const source = boxes.get(sourceId);
    const target = boxes.get(targetId);
    const nodeDistance = Math.min(...[source, target].map((node) => rectDistance(label, {
      left: node.x - node.stroke / 2, right: node.x + node.width + node.stroke / 2,
      top: node.y - node.stroke / 2, bottom: node.y + node.height + node.stroke / 2,
    })));
    atLeastCss(nodeDistance, 12, `${id} label/node clearance`);
  }
}

async function main() {
  const [drawioPath, svgPath] = process.argv.slice(2);
  if (!drawioPath || !svgPath) fail('usage: validate-agt-p-08-durable-agent-diagram.mjs <drawio> <svg>');
  assertDurableAgentDiagramGeometry(await readFile(drawioPath, 'utf8'), await readFile(svgPath, 'utf8'));
  console.log('Validated AGT-P-08 source hash, topology, geometry, and measured 800px clearances');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
