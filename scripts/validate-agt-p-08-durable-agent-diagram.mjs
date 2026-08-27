import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {SVG_NS, fail, number, parseDrawioModel, xmlText} from './agt-p-08-diagram-model.mjs';
import {parseSvgRenderedModel, renderedMarker} from './agt-p-08-svg-rendered-model.mjs';

const SCALE = 800 / 1400;
const EPSILON = 0.02;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const close = (actual, expected, label) => {
  if (Math.abs(actual - expected) > EPSILON) fail(`${label} expected ${expected}, received ${actual}`);
};
const atLeastCss = (units, threshold, label) => {
  if (units * SCALE + EPSILON < threshold) fail(`${label} is ${(units * SCALE).toFixed(2)}px at 800px; minimum is ${threshold}px`);
};
const byAttr = (context, localName, name, value) => {
  const matches = context.elements.filter((item) => item.namespace === SVG_NS
    && item.localName === localName && item.attributes.get(name) === value);
  if (matches.length !== 1) fail(`${localName}[${name}=${value}] must occur exactly once`);
  return matches[0];
};
const boxDistance = (a, b) => Math.hypot(
  Math.max(b.left - a.right, a.left - b.right, 0),
  Math.max(b.top - a.bottom, a.top - b.bottom, 0),
);
const segmentBoxDistance = ([a, b], box) => boxDistance({
  left: Math.min(a[0], b[0]), right: Math.max(a[0], b[0]),
  top: Math.min(a[1], b[1]), bottom: Math.max(a[1], b[1]),
}, box);
const geometryValues = (box) => ({
  height: box.bottom - box.top,
  width: box.right - box.left,
  x: box.left,
  y: box.top,
});
const normalizedDash = (value) => String(value ?? 'none').trim().replace(/[ ,]+/gu, ' ');

export function assertDurableAgentDiagramGeometry(drawio, svg) {
  const model = parseDrawioModel(drawio);
  const context = parseSvgRenderedModel(svg, '<agt-p-08.svg>');
  const {root} = context;
  if (root.attributes.get('viewBox') !== '0 0 1400 900') fail('viewBox must remain 1400×900');
  if (root.attributes.has('width') || root.attributes.has('height')) fail('published root must remain responsive');
  if (context.state(root).hidden || context.effective(root, 'clip-path') !== 'none') fail('published root must remain visible and unclipped');
  if (root.attributes.get('data-drawio-sha256') !== sha256(drawio)) fail('source SHA-256 mismatch');
  if (!/^[a-f0-9]{64}$/u.test(root.attributes.get('data-raw-export-sha256') ?? '')) fail('raw export SHA-256 missing');

  const svgElements = context.elements.filter((item) => item.namespace === SVG_NS);
  const rects = svgElements.filter((item) => item.localName === 'rect');
  const paths = svgElements.filter((item) => item.localName === 'path');
  const texts = svgElements.filter((item) => item.localName === 'text');
  const markers = svgElements.filter((item) => item.localName === 'marker');
  if (rects.length !== model.regions.length + model.nodes.length) fail('published rectangle inventory drift');
  if (texts.length !== model.visibleLabels.length) fail('published text inventory drift');
  if (markers.length !== model.edges.length || paths.length !== model.edges.length * 2) fail('published edge/marker path inventory drift');
  if (svgElements.some((item) => item.localName === 'foreignObject')) fail('published SVG must not contain foreignObject rendering');
  const expectedElementInventory = new Map([
    ['defs', 1], ['desc', 1], ['g', 5], ['marker', model.edges.length],
    ['path', model.edges.length * 2], ['rect', model.regions.length + model.nodes.length],
    ['svg', 1], ['text', model.visibleLabels.length], ['title', 1],
    ['tspan', model.captions.filter((item) => item.geometry.width === 220 && item.value.length > 25).length * 2],
  ]);
  const actualElementInventory = new Map();
  for (const element of context.elements) {
    if (element.namespace !== SVG_NS) fail('published SVG contains a foreign namespace');
    actualElementInventory.set(element.localName, (actualElementInventory.get(element.localName) ?? 0) + 1);
  }
  if (JSON.stringify([...actualElementInventory].sort()) !== JSON.stringify([...expectedElementInventory].sort())) {
    fail('published complete rendered element inventory drift');
  }
  for (const group of svgElements.filter((item) => item.localName === 'g')) {
    if (context.state(group).hidden || context.effective(group, 'clip-path') !== 'none') fail('published group must remain visible and unclipped');
  }

  const publishedLabels = texts.map((item) => xmlText(item)).sort();
  if (JSON.stringify(model.visibleLabels) !== JSON.stringify(publishedLabels)) fail('source/published visible-label multiset drift');

  const regionBoxes = [];
  for (const region of model.regions) {
    const published = context.rectBox(byAttr(context, 'rect', 'data-region-id', region.id), region.id);
    const geometry = geometryValues(published.geometry);
    for (const key of ['x', 'y', 'width', 'height']) close(geometry[key], region.geometry[key], `${region.id}.${key}`);
    close(published.strokeWidth, number(region.style.get('strokeWidth'), `${region.id}.source.strokeWidth`), `${region.id}.stroke-width`);
    const regionLabel = byAttr(context, 'text', 'data-region-label-for', region.id);
    if (xmlText(regionLabel) !== region.value) fail(`${region.id} visible title drift`);
    context.textBox(regionLabel, `${region.id}.title`);
    regionBoxes.push({...published, ...geometry});
  }

  const nodeBoxes = [];
  for (const node of model.nodes) {
    const published = context.rectBox(byAttr(context, 'rect', 'data-node-id', node.id), node.id);
    const geometry = geometryValues(published.geometry);
    for (const key of ['x', 'y', 'width', 'height']) close(geometry[key], node.geometry[key], `${node.id}.${key}`);
    close(published.strokeWidth, number(node.style.get('strokeWidth'), `${node.id}.source.strokeWidth`), `${node.id}.stroke-width`);
    const titleElement = byAttr(context, 'text', 'data-title-for', node.id);
    const typeElement = byAttr(context, 'text', 'data-type-for', node.id);
    const caption = model.captions.find((item) => item.nodeId === node.id);
    if (xmlText(titleElement) !== node.value || xmlText(typeElement) !== caption.value) fail(`${node.id} visible text drift`);
    const title = context.textBox(titleElement, `${node.id}.title`);
    const type = context.textBox(typeElement, `${node.id}.type`);
    atLeastCss(title.font, 15, `${node.id} title font`);
    atLeastCss(type.font, 10, `${node.id} caption font`);
    atLeastCss(type.top - title.top, 22, `${node.id} baseline separation`);
    const inner = {
      bottom: geometry.y + geometry.height - published.strokeWidth / 2,
      left: geometry.x + published.strokeWidth / 2,
      right: geometry.x + geometry.width - published.strokeWidth / 2,
      top: geometry.y + published.strokeWidth / 2,
    };
    for (const [kind, box] of [['title', title], ['caption', type]]) {
      atLeastCss(box.left - inner.left, 16, `${node.id} ${kind} left padding`);
      atLeastCss(inner.right - box.right, 16, `${node.id} ${kind} right padding`);
    }
    atLeastCss(inner.bottom - type.bottom, 14, `${node.id} caption bottom clearance`);
    nodeBoxes.push({...published, ...geometry});
  }

  const pathSegments = [];
  const markerBoxes = [];
  const referencedMarkers = new Set();
  for (const edge of model.edges) {
    const element = byAttr(context, 'path', 'data-edge-id', edge.id);
    if (element.attributes.get('data-source') !== edge.sourceId || element.attributes.get('data-target') !== edge.targetId) fail(`${edge.id} published endpoints drift`);
    const rendered = context.pathGeometry(element, edge.id);
    const points = rendered.points;
    if (points.length !== edge.route.length) fail(`${edge.id} route point count drift`);
    for (let index = 0; index < points.length; index += 1) {
      close(points[index][0], edge.route[index][0], `${edge.id}.point${index}.x`);
      close(points[index][1], edge.route[index][1], `${edge.id}.point${index}.y`);
    }
    close(rendered.strokeWidth, number(edge.style.get('strokeWidth'), `${edge.id}.source.strokeWidth`), `${edge.id}.effective stroke-width`);
    if (rendered.state.stroke !== edge.style.get('strokeColor')?.toLowerCase() || rendered.state.strokeOpacity !== 1) fail(`${edge.id} stroke paint drift`);
    if (rendered.state.paintedFill) fail(`${edge.id} connector must not acquire fill paint`);
    const expectedDash = edge.style.get('dashed') === '1' ? edge.style.get('dashPattern') : 'none';
    if (normalizedDash(context.effective(element, 'stroke-dasharray')) !== normalizedDash(expectedDash)) fail(`${edge.id} dash style drift`);
    const markerReference = context.effective(element, 'marker-end')?.match(/^url\(#([^)]+)\)$/u)?.[1];
    if (markerReference !== `arrow-${edge.id}`) fail(`${edge.id} directional marker reference drift`);
    referencedMarkers.add(markerReference);
    const marker = byAttr(context, 'marker', 'id', markerReference);
    const paintedMarker = renderedMarker(context, marker, points.at(-1), points.at(-2), edge.style.get('strokeColor'), edge.id);
    markerBoxes.push({box: paintedMarker.box, edgeId: edge.id});
    for (let index = 1; index < points.length; index += 1) pathSegments.push({edgeId: edge.id, segment: [points[index - 1], points[index]], width: rendered.strokeWidth});
  }
  if (referencedMarkers.size !== markers.length) fail('published marker reference inventory drift');

  const boundarySegments = regionBoxes.flatMap((box, index) => [
    [[box.x, box.y], [box.x + box.width, box.y]],
    [[box.x + box.width, box.y], [box.x + box.width, box.y + box.height]],
    [[box.x + box.width, box.y + box.height], [box.x, box.y + box.height]],
    [[box.x, box.y + box.height], [box.x, box.y]],
  ].map((segment) => ({id: model.regions[index].id, segment, width: box.strokeWidth})));
  for (const labelSource of model.edgeLabels) {
    const element = byAttr(context, 'text', 'data-edge-label-for', labelSource.edgeId);
    if (xmlText(element) !== labelSource.value) fail(`${labelSource.edgeId} label drift`);
    const box = context.textBox(element, `${labelSource.edgeId}.label`);
    atLeastCss(box.font, 15, `${labelSource.edgeId} label font`);
    const strokeDistance = Math.min(...pathSegments.map(({segment, width}) => segmentBoxDistance(segment, box) - width / 2));
    atLeastCss(strokeDistance, 8, `${labelSource.edgeId} label/all-strokes clearance`);
    const markerDistance = Math.min(...markerBoxes.map(({box: marker}) => boxDistance(box, marker)));
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
  console.log('Validated AGT-P-08 complete source inventory, rendered CSS/transforms, marker paint, routes, and global 800px clearances');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
