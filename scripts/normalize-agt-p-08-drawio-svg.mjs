import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';

import {parseXml, xmlElements} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/xml-visible-copy.mjs';
import {
  SVG_NS, escapeXml, fail, number, parseDrawioModel, parsePath, xmlText,
} from './agt-p-08-diagram-model.mjs';

const [drawioPath, rawSvgPath, outputPath] = process.argv.slice(2);
if (!drawioPath || !rawSvgPath || !outputPath) {
  throw new Error('usage: normalize-agt-p-08-drawio-svg.mjs <source.drawio> <raw.svg> <published.svg>');
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const close = (actual, expected, label, tolerance = 0.06) => {
  if (Math.abs(actual - expected) > tolerance) fail(`${label} expected ${expected}, received ${actual}`);
};
const compact = (value) => value.replace(/\s+/gu, ' ').trim();
const stripRawDoctype = (value) => value.replace(/<!DOCTYPE svg PUBLIC "-\/\/W3C\/\/DTD SVG 1\.1\/\/EN" "http:\/\/www\.w3\.org\/Graphics\/SVG\/1\.1\/DTD\/svg11\.dtd">\s*/u, '');
const attrObject = (element, omitted = new Set()) => Object.fromEntries([...element.attributes]
  .filter(([name]) => !omitted.has(name)).sort(([a], [b]) => a.localeCompare(b)));
const geometrySnapshot = (cell) => ({
  geometries: xmlElements(cell, 'mxGeometry', '').map((item) => attrObject(item)),
  points: xmlElements(cell, 'mxPoint', '').map((item) => attrObject(item)),
});

const drawio = await readFile(drawioPath, 'utf8');
const rawSvg = await readFile(rawSvgPath, 'utf8');
const drawioSha256 = sha256(drawio);
const rawSha256 = sha256(rawSvg);
const model = parseDrawioModel(drawio, drawioPath);
const rawRoot = parseXml(stripRawDoctype(rawSvg), rawSvgPath).root;
if (rawRoot.localName !== 'svg' || rawRoot.namespace !== SVG_NS) fail('raw export root must be an SVG element');
if (!(rawRoot.attributes.get('id') ?? '').startsWith('ge-svg-')) fail('raw export must carry a diagrams.net ge-svg root identifier');
const embedded = rawRoot.attributes.get('content');
if (!embedded) fail('raw diagrams.net SVG must embed its source XML');
const embeddedRoot = parseXml(embedded, `${rawSvgPath}#content`).root;
if (embeddedRoot.localName !== 'mxfile' || xmlElements(embeddedRoot, 'diagram', '').length !== 1) fail('raw embedded source must be a one-page mxfile');
const embeddedCells = xmlElements(embeddedRoot, 'mxCell', '');
if (embeddedCells.length !== model.cells.size) fail('raw embedded cell count differs from editable source');
const idMap = new Map([['0', '0'], ['1', '1']]);
const matchedEmbeddedIds = new Set(['0', '1']);
const sameGeometry = (source, candidate) => JSON.stringify(geometrySnapshot(source)) === JSON.stringify(geometrySnapshot(candidate));
const sameAttributes = (source, candidate, omitted) => JSON.stringify(attrObject(source, omitted)) === JSON.stringify(attrObject(candidate, omitted));
const visibleCells = [...model.regions, ...model.nodes, ...model.captions, ...model.edgeLabels];
for (const item of visibleCells) {
  const candidates = embeddedCells.filter((cell) =>
    cell.attributes.get('vertex') === '1'
    && cell.attributes.get('value') === item.value
    && sameGeometry(item.cell, cell));
  if (candidates.length !== 1) fail(`raw embedded source cannot uniquely map visible cell ${item.id}`);
  const candidate = candidates[0];
  if (!sameAttributes(item.cell, candidate, new Set(['id', 'parent']))) fail(`raw embedded style/semantic drift for ${item.id}`);
  idMap.set(item.id, candidate.attributes.get('id'));
  matchedEmbeddedIds.add(candidate.attributes.get('id'));
}
for (const edge of model.edges) {
  const candidates = embeddedCells.filter((cell) =>
    cell.attributes.get('edge') === '1'
    && cell.attributes.get('source') === idMap.get(edge.sourceId)
    && cell.attributes.get('target') === idMap.get(edge.targetId)
    && sameGeometry(edge.cell, cell));
  if (candidates.length !== 1) fail(`raw embedded source cannot uniquely map edge ${edge.id}`);
  const candidate = candidates[0];
  if (!sameAttributes(edge.cell, candidate, new Set(['id', 'parent', 'source', 'target']))) fail(`raw embedded route/style drift for ${edge.id}`);
  idMap.set(edge.id, candidate.attributes.get('id'));
  matchedEmbeddedIds.add(candidate.attributes.get('id'));
}
if (matchedEmbeddedIds.size !== embeddedCells.length) fail('raw embedded source contains unmapped cells');

const groups = new Map();
for (const group of xmlElements(rawRoot, 'g', SVG_NS)) {
  const id = group.attributes.get('data-cell-id');
  if (!id) continue;
  if (groups.has(id)) fail(`raw export duplicates data-cell-id ${id}`);
  groups.set(id, group);
}
for (const item of visibleCells) {
  const group = groups.get(idMap.get(item.id));
  if (!group) fail(`raw export lacks visible group ${item.id}`);
  const foreignObjects = xmlElements(group, 'foreignObject', SVG_NS);
  if (foreignObjects.length !== 1) fail(`raw export ${item.id} must have exactly one visible text object`);
  if (compact(xmlText(foreignObjects[0])) !== item.value) fail(`raw visible label drift for ${item.id}`);
}
const expectedGroupIds = embeddedCells.map((cell) => cell.attributes.get('id')).sort();
const actualGroupIds = [...groups.keys()].sort();
if (JSON.stringify(actualGroupIds) !== JSON.stringify(expectedGroupIds)) fail('raw visible cell inventory differs from embedded/source cells');
const rawVisibleLabels = visibleCells.flatMap((item) => xmlElements(groups.get(idMap.get(item.id)), 'foreignObject', SVG_NS))
  .map((foreignObject) => compact(xmlText(foreignObject))).filter(Boolean).sort();
const sourceVisibleLabels = [...model.cells.values()].map((cell) => cell.attributes.get('value') ?? '').filter(Boolean).sort();
if (JSON.stringify(rawVisibleLabels) !== JSON.stringify(sourceVisibleLabels)) fail('raw/source visible-label multiset drift');

const rawNodeRect = (id) => {
  const rects = xmlElements(groups.get(idMap.get(id)), 'rect', SVG_NS);
  if (rects.length !== 1) fail(`raw export ${id} must contain one node rectangle`);
  return rects[0];
};
const anchor = model.nodes[0];
const anchorRect = rawNodeRect(anchor.id);
const translateX = anchor.geometry.x - number(anchorRect.attributes.get('x'), `${anchor.id}.raw.x`);
const translateY = anchor.geometry.y - number(anchorRect.attributes.get('y'), `${anchor.id}.raw.y`);
for (const node of model.nodes) {
  const rect = rawNodeRect(node.id);
  close(number(rect.attributes.get('x'), `${node.id}.raw.x`) + translateX, node.geometry.x, `${node.id}.raw.x`);
  close(number(rect.attributes.get('y'), `${node.id}.raw.y`) + translateY, node.geometry.y, `${node.id}.raw.y`);
  close(number(rect.attributes.get('width'), `${node.id}.raw.width`), node.geometry.width, `${node.id}.raw.width`);
  close(number(rect.attributes.get('height'), `${node.id}.raw.height`), node.geometry.height, `${node.id}.raw.height`);
}
for (const label of model.edgeLabels) {
  const rects = xmlElements(groups.get(idMap.get(label.id)), 'rect', SVG_NS);
  if (rects.length !== 1) fail(`raw export ${label.id} must contain one visible label box`);
  const rect = rects[0];
  close(number(rect.attributes.get('x'), `${label.id}.raw.x`) + translateX, label.geometry.x, `${label.id}.raw.x`);
  close(number(rect.attributes.get('y'), `${label.id}.raw.y`) + translateY, label.geometry.y, `${label.id}.raw.y`);
  close(number(rect.attributes.get('width'), `${label.id}.raw.width`), label.geometry.width, `${label.id}.raw.width`);
  close(number(rect.attributes.get('height'), `${label.id}.raw.height`), label.geometry.height, `${label.id}.raw.height`);
}

for (const edge of model.edges) {
  const group = groups.get(idMap.get(edge.id));
  if (!group) fail(`raw export lacks ${edge.id}`);
  const paths = xmlElements(group, 'path', SVG_NS);
  if (paths.length !== 2) fail(`raw export ${edge.id} must contain exactly one connector and one arrow`);
  const connector = paths.find((item) => (item.attributes.get('fill') ?? '').toLowerCase() === 'none');
  const arrow = paths.find((item) => item !== connector);
  if (!connector || !arrow) fail(`raw export ${edge.id} connector/arrow structure drift`);
  const sourceWidth = number(edge.style.get('strokeWidth'), `${edge.id}.source.strokeWidth`);
  close(number(connector.attributes.get('stroke-width'), `${edge.id}.raw.strokeWidth`), sourceWidth, `${edge.id}.raw.strokeWidth`);
  const sourceColor = edge.style.get('strokeColor')?.toLowerCase();
  if (connector.attributes.get('stroke')?.toLowerCase() !== sourceColor || arrow.attributes.get('fill')?.toLowerCase() !== sourceColor) fail(`${edge.id} raw color drift`);
  const translated = parsePath(connector.attributes.get('d'), `${edge.id}.raw.connector`).map(([x, y]) => [x + translateX, y + translateY]);
  const expected = edge.route;
  if (translated.length !== expected.length) fail(`${edge.id} raw route point count drift`);
  for (let index = 0; index < expected.length - 1; index += 1) {
    close(translated[index][0], expected[index][0], `${edge.id}.raw.point${index}.x`);
    close(translated[index][1], expected[index][1], `${edge.id}.raw.point${index}.y`);
  }
  const penultimate = expected.at(-2);
  const target = expected.at(-1);
  const rawEnd = translated.at(-1);
  const horizontal = penultimate[1] === target[1];
  if (horizontal) {
    close(rawEnd[1], target[1], `${edge.id}.raw.end.y`);
    if ((rawEnd[0] - penultimate[0]) * (target[0] - rawEnd[0]) < 0) fail(`${edge.id} raw arrow base is off the final segment`);
  } else {
    close(rawEnd[0], target[0], `${edge.id}.raw.end.x`);
    if ((rawEnd[1] - penultimate[1]) * (target[1] - rawEnd[1]) < 0) fail(`${edge.id} raw arrow base is off the final segment`);
  }
  const arrowPoints = parsePath(arrow.attributes.get('d'), `${edge.id}.raw.arrow`);
  if (arrowPoints.length !== 3) fail(`${edge.id} raw arrow must be a three-point filled triangle`);
  const baseMidpoint = [(arrowPoints[1][0] + arrowPoints[2][0]) / 2, (arrowPoints[1][1] + arrowPoints[2][1]) / 2];
  close(Math.hypot(arrowPoints[0][0] - baseMidpoint[0], arrowPoints[0][1] - baseMidpoint[1]), 10, `${edge.id}.raw.arrow.length`);
  close(Math.hypot(arrowPoints[1][0] - arrowPoints[2][0], arrowPoints[1][1] - arrowPoints[2][1]), 10, `${edge.id}.raw.arrow.width`);
}

const markerId = (edge) => `arrow-${edge.id}`;
const linePath = (points) => points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
const styleNumber = (item, name, fallback = '0') => number(item.style.get(name) ?? fallback, `${item.id}.${name}`);
const nodeTitleLength = (item) => Math.min(item.geometry.width - 64, item.value.length * 14);
const captionLength = (item) => Math.min(item.geometry.width - 24, item.value.length * 10);
const edgeLabelLength = (item) => item.geometry.width - 20;

const output = [];
output.push(`<svg xmlns="${SVG_NS}" viewBox="0 0 1400 900" role="img" aria-labelledby="agt-p-08-title agt-p-08-desc" data-drawio-sha256="${drawioSha256}" data-raw-export-sha256="${rawSha256}">`);
output.push('  <title id="agt-p-08-title">Durable agent recovery and human approval control flow</title>');
output.push('  <desc id="agt-p-08-desc">The durable control plane checkpoints execution, waits for approval, resumes through a sandbox, reconciles external business truth, recovers safely, and sends rejection, timeout, or unknown effects to a manual terminal.</desc>');
output.push('  <defs>');
for (const edge of model.edges) {
  const color = edge.style.get('strokeColor');
  output.push(`    <marker id="${markerId(edge)}" markerUnits="userSpaceOnUse" viewBox="0 0 16 16" markerWidth="16" markerHeight="16" refX="14" refY="8" orient="auto"><path d="M 0 0 L 16 8 L 0 16 Z" fill="${color}"/></marker>`);
}
output.push('  </defs>');
for (const region of model.regions) {
  output.push(`  <rect data-region-id="${region.id}" x="${region.geometry.x}" y="${region.geometry.y}" width="${region.geometry.width}" height="${region.geometry.height}" rx="24" fill="${region.style.get('fillColor')}" stroke="${region.style.get('strokeColor')}" stroke-width="${styleNumber(region, 'strokeWidth')}" stroke-dasharray="${region.style.get('dashPattern')}"/>`);
}
output.push('  <g font-family="system-ui, sans-serif">');
for (const region of model.regions) {
  output.push(`    <text data-region-label-for="${region.id}" x="${region.geometry.x + 28}" y="${region.geometry.y + 42}" font-size="${styleNumber(region, 'fontSize')}" font-weight="700" fill="#17202A">${escapeXml(region.value)}</text>`);
}
const sharedEdgeWidth = styleNumber(model.edges[0], 'strokeWidth');
if (model.edges.some((edge) => styleNumber(edge, 'strokeWidth') !== sharedEdgeWidth)) fail('edges must share one auditable inherited stroke width');
output.push(`    <g fill="none" stroke-linejoin="round" stroke-linecap="round" stroke-width="${sharedEdgeWidth}">`);
for (const edge of model.edges) {
  const dash = edge.style.get('dashed') === '1' ? ` stroke-dasharray="${edge.style.get('dashPattern')}"` : '';
  output.push(`      <path data-edge-id="${edge.id}" data-source="${edge.sourceId}" data-target="${edge.targetId}" d="${linePath(edge.route)}" stroke="${edge.style.get('strokeColor')}"${dash} marker-end="url(#${markerId(edge)})"/>`);
}
output.push('    </g>');
output.push('    <g fill="#FFFFFF">');
for (const node of model.nodes) {
  output.push(`      <rect data-node-id="${node.id}" data-padding-horizontal-css="16" data-padding-vertical-css="14" x="${node.geometry.x}" y="${node.geometry.y}" width="${node.geometry.width}" height="${node.geometry.height}" rx="20" fill="${node.style.get('fillColor')}" stroke="${node.style.get('strokeColor')}" stroke-width="${styleNumber(node, 'strokeWidth')}"/>`);
}
output.push('    </g>');
output.push('    <g text-anchor="middle" fill="#17202A">');
for (const node of model.nodes) {
  const caption = model.captions.find((item) => item.nodeId === node.id);
  const titleX = node.geometry.x + node.geometry.width / 2;
  const wrappedCaption = caption.geometry.width === 220 && caption.value.length > 25;
  output.push(`      <text data-title-for="${node.id}" x="${titleX}" y="${node.geometry.y + (wrappedCaption ? 35 : 45)}" font-size="${styleNumber(node, 'fontSize')}" font-weight="700" textLength="${nodeTitleLength(node)}" lengthAdjust="spacingAndGlyphs">${escapeXml(node.value)}</text>`);
  if (wrappedCaption) {
    const words = caption.value.split(' ');
    const split = Math.ceil(words.length / 2);
    const first = `${words.slice(0, split).join(' ')} `;
    const second = words.slice(split).join(' ');
    const x = caption.geometry.x + caption.geometry.width / 2;
    output.push(`      <text data-type-for="${node.id}" x="${x}" y="${caption.geometry.y + 5}" font-size="${styleNumber(caption, 'fontSize')}"><tspan x="${x}" y="${caption.geometry.y + 5}" textLength="${Math.min(caption.geometry.width - 40, first.length * 10)}" lengthAdjust="spacingAndGlyphs">${escapeXml(first)}</tspan><tspan x="${x}" y="${caption.geometry.y + 23}" textLength="${Math.min(caption.geometry.width - 40, second.length * 10)}" lengthAdjust="spacingAndGlyphs">${escapeXml(second)}</tspan></text>`);
  } else {
    output.push(`      <text data-type-for="${node.id}" x="${caption.geometry.x + caption.geometry.width / 2}" y="${caption.geometry.y + 20}" font-size="${styleNumber(caption, 'fontSize')}" textLength="${captionLength(caption)}" lengthAdjust="spacingAndGlyphs">${escapeXml(caption.value)}</text>`);
  }
}
output.push('    </g>');
output.push('    <g font-weight="650" fill="#17202A" text-anchor="middle">');
for (const label of model.edgeLabels) {
  output.push(`      <text data-edge-label-for="${label.edgeId}" data-stroke-clearance-css="8" data-arrow-clearance-css="16" data-node-clearance-css="12" x="${label.geometry.x + label.geometry.width / 2}" y="${label.geometry.y + label.geometry.height * 0.75}" font-size="${styleNumber(label, 'fontSize')}" textLength="${edgeLabelLength(label)}" lengthAdjust="spacingAndGlyphs">${escapeXml(label.value)}</text>`);
}
output.push('    </g>');
output.push('  </g>');
output.push('</svg>');
const svg = `${output.join('\n')}\n`;
await writeFile(outputPath, svg, 'utf8');
console.log(`Normalized authenticated AGT-P-08 visible raw export ${rawSha256} with Draw.io SHA-256 ${drawioSha256}`);
