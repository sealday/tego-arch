import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {parseXml, xmlElements} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/xml-visible-copy.mjs';
import {
  SVG_NS, fail, number, parseDrawioModel, parsePath, xmlText,
} from './agt-p-08-diagram-model.mjs';

const SCALE = 800 / 1400;
const EPSILON = 0.02;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const close = (actual, expected, label) => {
  if (Math.abs(actual - expected) > EPSILON) fail(`${label} expected ${expected}, received ${actual}`);
};
const atLeastCss = (units, threshold, label) => {
  if (units * SCALE + EPSILON < threshold) fail(`${label} is ${(units * SCALE).toFixed(2)}px at 800px; minimum is ${threshold}px`);
};
const byAttr = (root, localName, name, value) => {
  const matches = xmlElements(root, localName, SVG_NS).filter((item) => item.attributes.get(name) === value);
  if (matches.length !== 1) fail(`${localName}[${name}=${value}] must occur exactly once`);
  return matches[0];
};
const parentMap = (root) => {
  const parents = new Map();
  const visit = (element) => {
    for (const child of element.children) { parents.set(child, element); visit(child); }
  };
  visit(root);
  return parents;
};
const effective = (element, name, parents) => {
  for (let current = element; current; current = parents.get(current)) {
    if (current.attributes.has(name)) return current.attributes.get(name);
  }
  return undefined;
};
const boxDistance = (a, b) => Math.hypot(
  Math.max(b.left - a.right, a.left - b.right, 0),
  Math.max(b.top - a.bottom, a.top - b.bottom, 0),
);
const segmentBoxDistance = ([a, b], box) => boxDistance({
  left: Math.min(a[0], b[0]), right: Math.max(a[0], b[0]),
  top: Math.min(a[1], b[1]), bottom: Math.max(a[1], b[1]),
}, box);
const textBox = (element, label, parents) => {
  const tspans = element.children.filter((child) => child.localName === 'tspan' && child.namespace === SVG_NS);
  if (tspans.length > 0) {
    const boxes = tspans.map((tspan, index) => textBox(tspan, `${label}.line${index + 1}`, parents));
    return {
      left: Math.min(...boxes.map((box) => box.left)), right: Math.max(...boxes.map((box) => box.right)),
      top: Math.min(...boxes.map((box) => box.top)), bottom: Math.max(...boxes.map((box) => box.bottom)),
      font: boxes[0].font,
    };
  }
  const x = number(element.attributes.get('x'), `${label}.x`);
  const y = number(element.attributes.get('y'), `${label}.y`);
  const font = number(effective(element, 'font-size', parents), `${label}.font-size`);
  const length = number(element.attributes.get('textLength'), `${label}.textLength`);
  const anchor = effective(element, 'text-anchor', parents) ?? 'start';
  const left = anchor === 'middle' ? x - length / 2 : anchor === 'end' ? x - length : x;
  return {left, right: left + length, top: y - font * 0.9, bottom: y + font * 0.25, font};
};
const rectBox = (element, label, parents) => {
  const x = number(element.attributes.get('x'), `${label}.x`);
  const y = number(element.attributes.get('y'), `${label}.y`);
  const width = number(element.attributes.get('width'), `${label}.width`);
  const height = number(element.attributes.get('height'), `${label}.height`);
  const stroke = number(effective(element, 'stroke-width', parents) ?? '0', `${label}.stroke-width`);
  return {element, x, y, width, height, stroke, left: x - stroke / 2, right: x + width + stroke / 2, top: y - stroke / 2, bottom: y + height + stroke / 2};
};
const markerBox = (marker, endpoint, previous, stroke, label) => {
  if (marker.attributes.get('markerUnits') !== 'userSpaceOnUse' || marker.attributes.get('orient') !== 'auto') fail(`${label} marker units/orientation drift`);
  const viewBox = (marker.attributes.get('viewBox') ?? '').split(/\s+/u).map(Number);
  if (viewBox.length !== 4 || viewBox.some((item) => !Number.isFinite(item))) fail(`${label} marker viewBox drift`);
  const [minX, minY, width, height] = viewBox;
  const markerWidth = number(marker.attributes.get('markerWidth'), `${label}.markerWidth`);
  const markerHeight = number(marker.attributes.get('markerHeight'), `${label}.markerHeight`);
  const refX = number(marker.attributes.get('refX'), `${label}.refX`);
  const refY = number(marker.attributes.get('refY'), `${label}.refY`);
  const angle = Math.atan2(endpoint[1] - previous[1], endpoint[0] - previous[0]);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const corners = [[minX, minY], [minX + width, minY], [minX + width, minY + height], [minX, minY + height]].map(([x, y]) => {
    const localX = (x - refX) * markerWidth / width;
    const localY = (y - refY) * markerHeight / height;
    return [endpoint[0] + localX * cos - localY * sin, endpoint[1] + localX * sin + localY * cos];
  });
  return {
    left: Math.min(...corners.map(([x]) => x)) - stroke / 2,
    right: Math.max(...corners.map(([x]) => x)) + stroke / 2,
    top: Math.min(...corners.map(([, y]) => y)) - stroke / 2,
    bottom: Math.max(...corners.map(([, y]) => y)) + stroke / 2,
  };
};

export function assertDurableAgentDiagramGeometry(drawio, svg) {
  const model = parseDrawioModel(drawio);
  const root = parseXml(svg, '<agt-p-08.svg>').root;
  if (root.localName !== 'svg' || root.namespace !== SVG_NS) fail('published root must be SVG');
  if (root.attributes.get('viewBox') !== '0 0 1400 900') fail('viewBox must remain 1400×900');
  if (root.attributes.get('data-drawio-sha256') !== sha256(drawio)) fail('source SHA-256 mismatch');
  if (!/^[a-f0-9]{64}$/u.test(root.attributes.get('data-raw-export-sha256') ?? '')) fail('raw export SHA-256 missing');
  const parents = parentMap(root);

  const sourceLabels = [...model.regions, ...model.nodes, ...model.captions, ...model.edgeLabels].map(({value}) => value).sort();
  const publishedLabels = xmlElements(root, 'text', SVG_NS).map((item) => xmlText(item)).sort();
  if (JSON.stringify(sourceLabels) !== JSON.stringify(publishedLabels)) fail('source/published visible-label multiset drift');

  const regionBoxes = [];
  for (const region of model.regions) {
    const published = rectBox(byAttr(root, 'rect', 'data-region-id', region.id), region.id, parents);
    for (const key of ['x', 'y', 'width', 'height']) close(published[key], region.geometry[key], `${region.id}.${key}`);
    const regionLabel = byAttr(root, 'text', 'data-region-label-for', region.id);
    if (xmlText(regionLabel) !== region.value) fail(`${region.id} visible title drift`);
    regionBoxes.push(published);
  }
  const nodeBoxes = [];
  for (const node of model.nodes) {
    const published = rectBox(byAttr(root, 'rect', 'data-node-id', node.id), node.id, parents);
    for (const key of ['x', 'y', 'width', 'height']) close(published[key], node.geometry[key], `${node.id}.${key}`);
    close(published.stroke, number(node.style.get('strokeWidth'), `${node.id}.source.strokeWidth`), `${node.id}.stroke-width`);
    const titleElement = byAttr(root, 'text', 'data-title-for', node.id);
    const typeElement = byAttr(root, 'text', 'data-type-for', node.id);
    const caption = model.captions.find((item) => item.nodeId === node.id);
    if (xmlText(titleElement) !== node.value || xmlText(typeElement) !== caption.value) fail(`${node.id} visible text drift`);
    const title = textBox(titleElement, `${node.id}.title`, parents);
    const type = textBox(typeElement, `${node.id}.type`, parents);
    atLeastCss(title.font, 15, `${node.id} title font`);
    atLeastCss(type.font, 10, `${node.id} caption font`);
    atLeastCss(type.top - title.top, 22, `${node.id} baseline separation`);
    const inner = {left: published.x + published.stroke / 2, right: published.x + published.width - published.stroke / 2, top: published.y + published.stroke / 2, bottom: published.y + published.height - published.stroke / 2};
    for (const [kind, box] of [['title', title], ['caption', type]]) {
      atLeastCss(box.left - inner.left, 16, `${node.id} ${kind} left padding`);
      atLeastCss(inner.right - box.right, 16, `${node.id} ${kind} right padding`);
    }
    atLeastCss(inner.bottom - type.bottom, 14, `${node.id} caption bottom clearance`);
    nodeBoxes.push(published);
  }

  const paths = [];
  const markers = [];
  for (const edge of model.edges) {
    const element = byAttr(root, 'path', 'data-edge-id', edge.id);
    if (element.attributes.get('data-source') !== edge.sourceId || element.attributes.get('data-target') !== edge.targetId) fail(`${edge.id} published endpoints drift`);
    const points = parsePath(element.attributes.get('d'), edge.id);
    if (points.length !== edge.route.length) fail(`${edge.id} route point count drift`);
    for (let index = 0; index < points.length; index += 1) {
      close(points[index][0], edge.route[index][0], `${edge.id}.point${index}.x`);
      close(points[index][1], edge.route[index][1], `${edge.id}.point${index}.y`);
    }
    const width = number(effective(element, 'stroke-width', parents), `${edge.id}.stroke-width`);
    close(width, number(edge.style.get('strokeWidth'), `${edge.id}.source.strokeWidth`), `${edge.id}.effective stroke-width`);
    if (effective(element, 'stroke', parents)?.toLowerCase() !== edge.style.get('strokeColor')?.toLowerCase()) fail(`${edge.id} stroke color drift`);
    const expectedDash = edge.style.get('dashed') === '1' ? edge.style.get('dashPattern') : undefined;
    if (effective(element, 'stroke-dasharray', parents) !== expectedDash) fail(`${edge.id} dash style drift`);
    const markerReference = element.attributes.get('marker-end')?.match(/^url\(#([^)]+)\)$/u)?.[1];
    if (!markerReference) fail(`${edge.id} lacks directional marker`);
    const marker = byAttr(root, 'marker', 'id', markerReference);
    const markerPaths = xmlElements(marker, 'path', SVG_NS);
    if (markerPaths.length !== 1 || markerPaths[0].attributes.get('fill')?.toLowerCase() !== edge.style.get('strokeColor')?.toLowerCase()) fail(`${edge.id} marker visual drift`);
    markers.push({edgeId: edge.id, box: markerBox(marker, points.at(-1), points.at(-2), width, edge.id)});
    for (let index = 1; index < points.length; index += 1) paths.push({edgeId: edge.id, segment: [points[index - 1], points[index]], width});
  }

  const boundarySegments = regionBoxes.flatMap((box, index) => [
    [[box.x, box.y], [box.x + box.width, box.y]],
    [[box.x + box.width, box.y], [box.x + box.width, box.y + box.height]],
    [[box.x + box.width, box.y + box.height], [box.x, box.y + box.height]],
    [[box.x, box.y + box.height], [box.x, box.y]],
  ].map((segment) => ({id: model.regions[index].id, segment, width: box.stroke})));
  for (const labelSource of model.edgeLabels) {
    const element = byAttr(root, 'text', 'data-edge-label-for', labelSource.edgeId);
    if (xmlText(element) !== labelSource.value) fail(`${labelSource.edgeId} label drift`);
    const box = textBox(element, `${labelSource.edgeId}.label`, parents);
    atLeastCss(box.font, 15, `${labelSource.edgeId} label font`);
    const strokeDistance = Math.min(...paths.map(({segment, width}) => segmentBoxDistance(segment, box) - width / 2));
    atLeastCss(strokeDistance, 8, `${labelSource.edgeId} label/all-strokes clearance`);
    const markerDistance = Math.min(...markers.map(({box: marker}) => boxDistance(box, marker)));
    atLeastCss(markerDistance, 16, `${labelSource.edgeId} label/all-marker-footprints clearance`);
    const nodeDistance = Math.min(...nodeBoxes.map((node) => boxDistance(box, node)));
    atLeastCss(nodeDistance, 12, `${labelSource.edgeId} label/all-nodes clearance`);
    const boundaryDistance = Math.min(...boundarySegments.map(({segment, width}) => segmentBoxDistance(segment, box) - width / 2));
    atLeastCss(boundaryDistance, 8, `${labelSource.edgeId} label/all-boundaries clearance`);
  }
}

async function main() {
  const [drawioPath, svgPath] = process.argv.slice(2);
  if (!drawioPath || !svgPath) fail('usage: validate-agt-p-08-durable-agent-diagram.mjs <drawio> <svg>');
  assertDurableAgentDiagramGeometry(await readFile(drawioPath, 'utf8'), await readFile(svgPath, 'utf8'));
  console.log('Validated AGT-P-08 source-derived semantics, ports, waypoints, styles, marker footprints, and global 800px clearances');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
