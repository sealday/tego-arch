import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';

import {parseXml, xmlElements} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/xml-visible-copy.mjs';
import {
  SVG_NS, escapeXml, fail, number, parseDrawioModel, xmlText,
} from './agt-p-08-diagram-model.mjs';
import {
  parseSvgRenderedModel,
  parseViewBox,
  renderedColor,
  renderedCssDeclarations,
  renderedLength,
} from './agt-p-08-svg-rendered-model.mjs';

const [drawioPath, rawSvgPath, outputPath] = process.argv.slice(2);
if (!drawioPath || !rawSvgPath || !outputPath) {
  throw new Error('usage: normalize-agt-p-08-drawio-svg.mjs <source.drawio> <raw.svg> <published.svg>');
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const close = (actual, expected, label, tolerance = 0.06) => {
  if (Math.abs(actual - expected) > tolerance) fail(`${label} expected ${expected}, received ${actual}`);
};
const compact = (value) => value.replace(/\s+/gu, ' ').trim();
const closePixel = (actual, expected, label) => close(actual, expected, label, 0.51);
const normalizedDash = (value) => String(value ?? 'none').trim().replace(/[ ,]+/gu, ' ');
const distance = (left, right) => Math.hypot(left[0] - right[0], left[1] - right[1]);
const unit = (from, to, label) => {
  const length = distance(from, to);
  if (length === 0) fail(`${label} direction is zero`);
  return [(to[0] - from[0]) / length, (to[1] - from[1]) / length];
};
const dot = (left, right) => left[0] * right[0] + left[1] * right[1];
const geometryBox = (box) => ({
  height: box.bottom - box.top, width: box.right - box.left, x: box.left, y: box.top,
});
const cssValue = (element, name) => renderedCssDeclarations(element.attributes.get('style')).get(name)?.value;
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
const rawContext = parseSvgRenderedModel(stripRawDoctype(rawSvg), rawSvgPath);
const rawRoot = rawContext.root;
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

const allGroups = rawContext.elements.filter((item) => item.namespace === SVG_NS && item.localName === 'g');
const groups = new Map();
for (const group of allGroups) {
  const id = group.attributes.get('data-cell-id');
  if (!id) continue;
  if (groups.has(id)) fail(`raw export duplicates data-cell-id ${id}`);
  groups.set(id, group);
}
const expectedGroupIds = embeddedCells.map((cell) => cell.attributes.get('id')).sort();
const actualGroupIds = [...groups.keys()].sort();
if (JSON.stringify(actualGroupIds) !== JSON.stringify(expectedGroupIds)) fail('raw visible cell inventory differs from embedded/source cells');
const groupZero = groups.get('0');
const groupOne = groups.get('1');
const wrapper = rawContext.parents.get(groupZero);
if (!wrapper || wrapper.localName !== 'g' || wrapper.attributes.has('data-cell-id')
  || rawContext.parents.get(wrapper) !== rawRoot || rawContext.parents.get(groupOne) !== groupZero) fail('raw export cell-group root hierarchy drift');
const directCellGroups = groupOne.children.filter((item) => item.localName === 'g' && item.namespace === SVG_NS);
if (directCellGroups.length !== expectedGroupIds.length - 2
  || directCellGroups.some((item) => !actualGroupIds.includes(item.attributes.get('data-cell-id')))) fail('raw export direct cell-group inventory drift');
for (const group of allGroups) {
  if (rawContext.state(group).hidden || rawContext.effective(group, 'clip-path') !== 'none') fail('raw export contains a hidden or clipped group');
}

const rootState = rawContext.state(rawRoot);
const viewBox = parseViewBox(rawRoot.attributes.get('viewBox'), 'raw root viewBox');
if (rootState.hidden || rawContext.effective(rawRoot, 'clip-path') !== 'none' || viewBox[0] !== 0 || viewBox[1] !== 0) fail('raw root must remain visible, unclipped, and origin-aligned');
const rootWidth = renderedLength(rawRoot.attributes.get('width'), 'raw root width');
const rootHeight = renderedLength(rawRoot.attributes.get('height'), 'raw root height');
if (rootWidth !== viewBox[2] || rootHeight !== viewBox[3]) fail('raw root dimensions/viewBox drift');
if (rawContext.elements.some((item) => item.namespace === SVG_NS && ['clipPath', 'mask'].includes(item.localName))) fail('raw export must not introduce clipping or masking');
const rootBackgrounds = rawRoot.children.filter((item) => item.localName === 'rect' && item.namespace === SVG_NS);
if (rootBackgrounds.length !== 1 || rootBackgrounds[0].attributes.get('x') !== '0'
  || rootBackgrounds[0].attributes.get('y') !== '0' || rootBackgrounds[0].attributes.get('width') !== '100%'
  || rootBackgrounds[0].attributes.get('height') !== '100%' || !rawContext.state(rootBackgrounds[0]).paintedFill) fail('raw root background paint drift');

const allRects = rawContext.elements.filter((item) => item.namespace === SVG_NS && item.localName === 'rect');
const allPaths = rawContext.elements.filter((item) => item.namespace === SVG_NS && item.localName === 'path');
const allForeignObjects = rawContext.elements.filter((item) => item.namespace === SVG_NS && item.localName === 'foreignObject');
const allSvgText = rawContext.elements.filter((item) => item.namespace === SVG_NS && item.localName === 'text');
if (allRects.length !== visibleCells.length + 1 || allPaths.length !== model.edges.length * 2
  || allForeignObjects.length !== visibleCells.length || allSvgText.length !== 0) fail('raw complete rect/path/foreignObject/text inventory drift');
const expectedElementInventory = new Map([
  [`${SVG_NS}|defs`, 1], [`${SVG_NS}|foreignObject`, visibleCells.length],
  [`${SVG_NS}|g`, 3 + visibleCells.length * 4 + model.edges.length * 2],
  [`${SVG_NS}|image`, visibleCells.length], [`${SVG_NS}|path`, model.edges.length * 2],
  [`${SVG_NS}|rect`, visibleCells.length + 1], [`${SVG_NS}|style`, 1],
  [`${SVG_NS}|svg`, 1], [`${SVG_NS}|switch`, visibleCells.length],
  ['http://www.w3.org/1999/xhtml|div', visibleCells.length * 3],
]);
const actualElementInventory = new Map();
for (const element of rawContext.elements) {
  const key = `${element.namespace}|${element.localName}`;
  actualElementInventory.set(key, (actualElementInventory.get(key) ?? 0) + 1);
}
if (JSON.stringify([...actualElementInventory].sort()) !== JSON.stringify([...expectedElementInventory].sort())) {
  fail('raw complete rendered element inventory drift');
}

const anchor = model.edgeLabels[0];
const anchorGroup = groups.get(idMap.get(anchor.id));
const anchorRects = xmlElements(anchorGroup, 'rect', SVG_NS);
if (anchorRects.length !== 1) fail('raw anchor label box drift');
const anchorBox = rawContext.rectBox(anchorRects[0], `${anchor.id}.raw.box`, {paint: false});
const anchorGeometry = geometryBox(anchorBox.geometry);
const translateX = anchor.geometry.x - anchorGeometry.x;
const translateY = anchor.geometry.y - anchorGeometry.y;
const paintedBoxes = [];
const rawVisibleLabels = [];
for (const item of visibleCells) {
  const group = groups.get(idMap.get(item.id));
  if (!group) fail(`raw export lacks visible group ${item.id}`);
  if (xmlElements(group, 'g', SVG_NS).length !== 4 || xmlElements(group, 'image', SVG_NS).length !== 1
    || xmlElements(group, 'switch', SVG_NS).length !== 1) fail(`raw export ${item.id} group structure drift`);
  const rects = xmlElements(group, 'rect', SVG_NS);
  const foreignObjects = xmlElements(group, 'foreignObject', SVG_NS);
  if (rects.length !== 1 || foreignObjects.length !== 1) fail(`raw export ${item.id} must own one box and one text object`);
  const rect = rawContext.rectBox(rects[0], `${item.id}.raw.box`, {paint: false});
  const geometry = geometryBox(rect.geometry);
  closePixel(geometry.x + translateX, item.geometry.x, `${item.id}.raw.x`);
  closePixel(geometry.y + translateY, item.geometry.y, `${item.id}.raw.y`);
  closePixel(geometry.width, item.geometry.width, `${item.id}.raw.width`);
  closePixel(geometry.height, item.geometry.height, `${item.id}.raw.height`);
  const expectedFill = renderedColor(item.style.get('fillColor') ?? 'none');
  const expectedStroke = renderedColor(item.style.get('strokeColor') ?? 'none');
  if (expectedFill === 'none' ? rect.state.paintedFill : !rect.state.paintedFill || rect.state.fill !== expectedFill || rect.state.fillOpacity !== 1) fail(`${item.id} raw fill paint drift`);
  if (expectedStroke === 'none' ? rect.state.paintedStroke : !rect.state.paintedStroke || rect.state.stroke !== expectedStroke || rect.state.strokeOpacity !== 1) fail(`${item.id} raw stroke paint drift`);
  const sourceStrokeWidth = expectedStroke === 'none' ? 0 : number(item.style.get('strokeWidth'), `${item.id}.source.strokeWidth`);
  close(rect.strokeWidth, sourceStrokeWidth, `${item.id}.raw.strokeWidth`);
  const expectedDash = item.style.get('dashed') === '1'
    ? item.style.get('dashPattern').split(/\s+/u).map((value) => number(value, `${item.id}.dash`) * sourceStrokeWidth).join(' ')
    : 'none';
  if (normalizedDash(rawContext.effective(rects[0], 'stroke-dasharray')) !== normalizedDash(expectedDash)) fail(`${item.id} raw dash paint drift`);
  if (rect.state.paintedFill || rect.state.paintedStroke) paintedBoxes.push(rect);

  const foreignObject = foreignObjects[0];
  if (rawContext.state(foreignObject).hidden || rawContext.effective(foreignObject, 'clip-path') !== 'none'
    || foreignObject.attributes.get('width') !== '100%' || foreignObject.attributes.get('height') !== '100%') fail(`${item.id} raw foreignObject visibility/bounds drift`);
  const groupMatrix = rawContext.matrix(group);
  const textMatrix = rawContext.matrix(foreignObject);
  for (let index = 0; index < groupMatrix.length; index += 1) close(textMatrix[index], groupMatrix[index], `${item.id}.foreignObject.matrix${index}`);
  if (compact(xmlText(foreignObject)) !== item.value) fail(`raw visible label drift for ${item.id}`);
  rawVisibleLabels.push(item.value);
  const divs = xmlElements(foreignObject, 'div', 'http://www.w3.org/1999/xhtml');
  if (divs.length !== 3 || rawContext.state(divs[2]).hidden) fail(`${item.id} raw text layout structure/visibility drift`);
  const alignLeft = item.style.get('align') === 'left';
  const spacingLeft = number(item.style.get('spacingLeft') ?? '0', `${item.id}.spacingLeft`);
  const topAligned = item.style.get('verticalAlign') === 'top';
  const spacingTop = number(item.style.get('spacingTop') ?? '0', `${item.id}.spacingTop`);
  close(renderedLength(cssValue(divs[0], 'margin-left'), `${item.id}.text.margin-left`), rect.x + (alignLeft ? spacingLeft + 2 : 1), `${item.id}.text.margin-left`);
  close(renderedLength(cssValue(divs[0], 'width'), `${item.id}.text.width`), rect.width - (alignLeft ? spacingLeft + 2 : 2), `${item.id}.text.width`);
  close(renderedLength(cssValue(divs[0], 'padding-top'), `${item.id}.text.padding-top`), rect.y + (topAligned ? spacingTop + 7 : rect.height / 2), `${item.id}.text.padding-top`);
  close(renderedLength(cssValue(divs[2], 'font-size'), `${item.id}.text.font-size`), number(item.style.get('fontSize'), `${item.id}.source.fontSize`), `${item.id}.text.font-size`);
  if (cssValue(divs[0], 'display') !== 'flex' || cssValue(divs[2], 'display') !== 'inline-block'
    || (item.style.get('fontStyle') === '1') !== (cssValue(divs[2], 'font-weight') === 'bold')) fail(`${item.id} raw text alignment/weight drift`);
}
if (JSON.stringify(rawVisibleLabels.sort()) !== JSON.stringify(model.visibleLabels)) fail('raw/source visible-label multiset drift');

for (const edge of model.edges) {
  const group = groups.get(idMap.get(edge.id));
  if (!group || xmlElements(group, 'g', SVG_NS).length !== 2) fail(`raw export ${edge.id} group structure drift`);
  const paths = xmlElements(group, 'path', SVG_NS);
  if (paths.length !== 2) fail(`raw export ${edge.id} must contain exactly one connector and one arrow`);
  const connector = paths.find((item) => rawContext.state(item).fill === 'none');
  const arrow = paths.find((item) => item !== connector);
  if (!connector || !arrow) fail(`raw export ${edge.id} connector/arrow structure drift`);
  const renderedConnector = rawContext.pathGeometry(connector, `${edge.id}.raw.connector`);
  const renderedArrow = rawContext.pathGeometry(arrow, `${edge.id}.raw.arrow`);
  paintedBoxes.push(renderedConnector, renderedArrow);
  const sourceWidth = number(edge.style.get('strokeWidth'), `${edge.id}.source.strokeWidth`);
  close(renderedConnector.strokeWidth, sourceWidth, `${edge.id}.raw.strokeWidth`);
  const sourceColor = edge.style.get('strokeColor')?.toLowerCase();
  if (renderedConnector.state.stroke !== sourceColor || renderedConnector.state.strokeOpacity !== 1
    || renderedConnector.state.paintedFill || renderedArrow.state.fill !== sourceColor
    || renderedArrow.state.stroke !== sourceColor || renderedArrow.state.fillOpacity !== 1
    || renderedArrow.state.strokeOpacity !== 1) fail(`${edge.id} raw paint drift`);
  const expectedDash = edge.style.get('dashed') === '1'
    ? edge.style.get('dashPattern').split(/\s+/u).map((value) => number(value, `${edge.id}.dash`) * sourceWidth).join(' ')
    : 'none';
  if (normalizedDash(rawContext.effective(connector, 'stroke-dasharray')) !== normalizedDash(expectedDash)) fail(`${edge.id} raw dash drift`);
  const translated = renderedConnector.points.map(([x, y]) => [x + translateX, y + translateY]);
  const expected = edge.route;
  if (translated.length !== expected.length) fail(`${edge.id} raw route point count drift`);
  for (let index = 0; index < expected.length - 1; index += 1) {
    close(translated[index][0], expected[index][0], `${edge.id}.raw.point${index}.x`);
    close(translated[index][1], expected[index][1], `${edge.id}.raw.point${index}.y`);
  }
  const arrowPoints = renderedArrow.points;
  if (!/\bZ\s*$/u.test(arrow.attributes.get('d') ?? '') || arrowPoints.length !== 3) fail(`${edge.id} raw arrow must be a closed three-point triangle`);
  const baseMidpoint = [(arrowPoints[1][0] + arrowPoints[2][0]) / 2, (arrowPoints[1][1] + arrowPoints[2][1]) / 2];
  const connectorEnd = renderedConnector.points.at(-1);
  close(distance(baseMidpoint, connectorEnd), 0, `${edge.id}.raw.connector-arrow attachment`);
  const arrowLength = distance(baseMidpoint, arrowPoints[0]);
  const arrowWidth = distance(arrowPoints[1], arrowPoints[2]);
  close(arrowLength, sourceWidth * 2.5, `${edge.id}.raw.arrow.length`);
  close(arrowWidth, sourceWidth * 2.5, `${edge.id}.raw.arrow.width`);
  const target = [expected.at(-1)[0] - translateX, expected.at(-1)[1] - translateY];
  const sourceDirection = unit(expected.at(-2), expected.at(-1), `${edge.id}.source.final`);
  const connectorDirection = unit(renderedConnector.points.at(-2), connectorEnd, `${edge.id}.raw.connector.final`);
  const arrowDirection = unit(baseMidpoint, arrowPoints[0], `${edge.id}.raw.arrow`);
  const targetDirection = unit(arrowPoints[0], target, `${edge.id}.raw.target`);
  if (dot(sourceDirection, connectorDirection) < 0.999 || dot(sourceDirection, arrowDirection) < 0.999
    || dot(sourceDirection, targetDirection) < 0.999) fail(`${edge.id} raw connector/arrow/target direction drift`);
  const targetNode = model.nodes.find(({id}) => id === edge.targetId);
  const targetStroke = number(targetNode.style.get('strokeWidth'), `${edge.id}.target.strokeWidth`);
  const targetClearance = sourceWidth / 2 + targetStroke / 2 + 1;
  close(distance(arrowPoints[0], target), targetClearance, `${edge.id}.raw.arrow-tip target continuity`);
  close(distance(baseMidpoint, target), arrowLength + targetClearance, `${edge.id}.raw.arrow-base target continuity`);
}

const paintedBounds = {
  bottom: Math.max(...paintedBoxes.map((box) => box.bottom)),
  left: Math.min(...paintedBoxes.map((box) => box.left)),
  right: Math.max(...paintedBoxes.map((box) => box.right)),
  top: Math.min(...paintedBoxes.map((box) => box.top)),
};
if (Math.floor(paintedBounds.left) !== viewBox[0] || Math.floor(paintedBounds.top) !== viewBox[1]
  || Math.ceil(paintedBounds.right) - Math.floor(paintedBounds.left) + 1 !== viewBox[2]
  || Math.ceil(paintedBounds.bottom) - Math.floor(paintedBounds.top) + 1 !== viewBox[3]) fail('raw root viewBox does not tightly contain the complete painted model');

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
