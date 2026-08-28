import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';

import {
  parseXml,
  xmlElements,
} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/xml-visible-copy.mjs';

const [drawioPath, inputPath, outputPath] = process.argv.slice(2);
if (!drawioPath || !inputPath || !outputPath) {
  throw new Error('usage: normalize-agt-p-06-drawio-svg.mjs <source.drawio> <raw.svg> <published.svg>');
}
const drawio = await readFile(drawioPath, 'utf8');
const drawioSha256 = createHash('sha256').update(drawio).digest('hex');
let body = await readFile(inputPath, 'utf8');
const decodeAttribute = (value) => value
  .replace(/&#x([a-f0-9]+);/giu, (_, digits) => String.fromCodePoint(Number.parseInt(digits, 16)))
  .replace(/&#([0-9]+);/gu, (_, digits) => String.fromCodePoint(Number(digits)))
  .replaceAll('&quot;', '"').replaceAll('&apos;', "'")
  .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
const embeddedMatch = body.match(/\bcontent="([^"]+)"/u);
if (!embeddedMatch) throw new Error('Draw.io SVG export must embed its source XML');
const embedded = decodeAttribute(embeddedMatch[1]);
const sourceRoot = parseXml(drawio, drawioPath).root;
const embeddedRoot = parseXml(embedded, `${inputPath}#content`).root;
const sourceCells = xmlElements(sourceRoot, 'mxCell', '');
const embeddedCells = xmlElements(embeddedRoot, 'mxCell', '');
const stableContracts = [
  ['supervisor-region', '1 · Supervisor：保留控制'],
  ['handoff-region', '2 · Handoff：移动控制'],
  ['tool-region', '3 · Agent as Tool'],
  ['supervisor', 'Supervisor'], ['worker', 'Worker Agent'],
  ['handoff', 'Handoff'], ['active-agent', 'Active Agent'],
  ['parent-agent', 'Parent Agent'], ['agent-as-tool', 'Agent as Tool'],
  ['edge-supervisor-delegate', '反复委派'],
  ['edge-worker-return', '结构化结果返回'],
  ['edge-handoff-move', '当前会话与控制权移动'],
  ['edge-parent-call', '调用有界子任务'],
  ['edge-tool-return', '结果返回 Parent'],
];
const rawIds = new Map();
for (const [stableId, label] of stableContracts) {
  const source = sourceCells.find((cell) => cell.attributes.get('id') === stableId);
  const exported = embeddedCells.filter((cell) => cell.attributes.get('value') === label);
  if (!source || exported.length !== 1) throw new Error(`Raw export cannot map ${stableId}`);
  const sourceGeometry = xmlElements(source, 'mxGeometry', '')[0];
  const exportedGeometry = xmlElements(exported[0], 'mxGeometry', '')[0];
  for (const key of ['x', 'y', 'width', 'height']) {
    if ((sourceGeometry?.attributes.get(key) ?? '') !== (exportedGeometry?.attributes.get(key) ?? '')) {
      throw new Error(`Raw export geometry drift for ${stableId}.${key}`);
    }
  }
  rawIds.set(stableId, exported[0].attributes.get('id'));
}
for (const [edgeId, sourceId, targetId] of [
  ['edge-supervisor-delegate', 'supervisor', 'worker'],
  ['edge-worker-return', 'worker', 'supervisor'],
  ['edge-handoff-move', 'handoff', 'active-agent'],
  ['edge-parent-call', 'parent-agent', 'agent-as-tool'],
  ['edge-tool-return', 'agent-as-tool', 'parent-agent'],
]) {
  const exported = embeddedCells.find((cell) => cell.attributes.get('id') === rawIds.get(edgeId));
  if (exported.attributes.get('source') !== rawIds.get(sourceId)
      || exported.attributes.get('target') !== rawIds.get(targetId)) {
    throw new Error(`Raw export endpoint drift for ${edgeId}`);
  }
}
const rootEnd = body.indexOf('><style');
if (rootEnd < 0) throw new Error('Unexpected Draw.io SVG root');
body = body.slice(rootEnd + 1).replace(/<\/svg>\s*$/u, '');
body = body.replace(/<style\b[\s\S]*?<\/style>/u, '');
body = body.replace(/<switch>[\s\S]*?<\/switch>/gu, '');

const addToFirstShape = (stableId, attributes) => {
  const rawId = rawIds.get(stableId);
  const pattern = new RegExp(`(<g data-cell-id="${rawId}"><g(?: transform="[^"]+")?><(?:rect|path))`, 'u');
  if (!pattern.test(body)) throw new Error(`Cannot find first shape for ${stableId}`);
  body = body.replace(pattern, `$1 ${attributes}`);
};
for (const id of ['supervisor-region', 'handoff-region', 'tool-region']) {
  addToFirstShape(id, `data-region-id="${id}"`);
}
for (const id of ['supervisor', 'worker', 'handoff', 'active-agent', 'parent-agent', 'agent-as-tool']) {
  addToFirstShape(id, `data-node-id="${id}" data-padding-horizontal-css="16" data-padding-vertical-css="14"`);
}
for (const [id, source, target] of [
  ['edge-supervisor-delegate', 'supervisor', 'worker'],
  ['edge-worker-return', 'worker', 'supervisor'],
  ['edge-handoff-move', 'handoff', 'active-agent'],
  ['edge-parent-call', 'parent-agent', 'agent-as-tool'],
  ['edge-tool-return', 'agent-as-tool', 'parent-agent'],
]) {
  addToFirstShape(id, `data-edge-id="${id}" data-source="${source}" data-target="${target}"`);
  body = body.replace(
    `<g data-cell-id="${rawIds.get(id)}">`,
    `<g data-cell-id="${rawIds.get(id)}" data-edge-group-id="${id}">`,
  );
}

const tagText = (label, attributes) => {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const pattern = new RegExp(`<text ([^>]*)>${escaped}<\\/text>`, 'u');
  if (!pattern.test(body)) throw new Error(`Cannot find exported text ${label}`);
  body = body.replace(pattern, `<text ${attributes} $1>${label}</text>`);
};
for (const [id, label, length] of [
  ['edge-supervisor-delegate', '反复委派', 90],
  ['edge-worker-return', '结构化结果返回', 162],
  ['edge-handoff-move', '当前会话与控制权移动', 234],
  ['edge-parent-call', '调用有界子任务', 162],
  ['edge-tool-return', '结果返回 Parent', 168],
]) tagText(label, `data-edge-label-for="${id}" data-stroke-clearance-css="8" data-arrow-clearance-css="16" data-node-clearance-css="12" text-anchor="middle" font-size="24" textLength="${length}" lengthAdjust="spacingAndGlyphs"`);
for (const [id, label, length] of [
  ['supervisor', '全局控制与停止', 126], ['worker', '受限子任务', 90],
  ['handoff', '原会话所有者', 108], ['active-agent', '新会话所有者', 108],
  ['parent-agent', '保留任务与会话', 126], ['agent-as-tool', '有界专家调用', 108],
]) tagText(label, `data-type-for="${id}" data-bottom-clearance-css="20" text-anchor="middle" font-size="18" textLength="${length}" lengthAdjust="spacingAndGlyphs"`);

const semanticText = `
  <g font-family="system-ui, sans-serif">
    <text data-region-label-for="supervisor-region" x="46" y="78" font-size="24" font-weight="700" textLength="282" lengthAdjust="spacingAndGlyphs" fill="#34204D">1 · Supervisor：保留控制</text>
    <text data-region-label-for="handoff-region" x="446" y="78" font-size="24" font-weight="700" textLength="258" lengthAdjust="spacingAndGlyphs" fill="#53300A">2 · Handoff：移动控制</text>
    <text data-region-label-for="tool-region" x="846" y="78" font-size="24" font-weight="700" textLength="190" lengthAdjust="spacingAndGlyphs" fill="#173D2D">3 · Agent as Tool</text>
    <text data-title-for="supervisor" x="200" y="190" text-anchor="middle" font-size="24" font-weight="700" textLength="120" lengthAdjust="spacingAndGlyphs" fill="#34204D">Supervisor</text>
    <text data-title-for="worker" x="200" y="480" text-anchor="middle" font-size="24" font-weight="700" textLength="150" lengthAdjust="spacingAndGlyphs" fill="#1F2A30">Worker Agent</text>
    <text data-title-for="handoff" x="600" y="190" text-anchor="middle" font-size="24" font-weight="700" textLength="92" lengthAdjust="spacingAndGlyphs" fill="#53300A">Handoff</text>
    <text data-title-for="active-agent" x="600" y="480" text-anchor="middle" font-size="24" font-weight="700" textLength="142" lengthAdjust="spacingAndGlyphs" fill="#1F2A30">Active Agent</text>
    <text data-title-for="parent-agent" x="1000" y="190" text-anchor="middle" font-size="24" font-weight="700" textLength="146" lengthAdjust="spacingAndGlyphs" fill="#173D2D">Parent Agent</text>
    <text data-title-for="agent-as-tool" x="1000" y="480" text-anchor="middle" font-size="24" font-weight="700" textLength="156" lengthAdjust="spacingAndGlyphs" fill="#1F2A30">Agent as Tool</text>
  </g>`;

const normalized = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" role="img" aria-labelledby="agt-p-06-title agt-p-06-desc" data-drawio-sha256="${drawioSha256}">
  <title id="agt-p-06-title">Supervisor, Handoff, and Agent-as-Tool control ownership models</title>
  <desc id="agt-p-06-desc">Three separated regions compare a supervisor that delegates and receives results while retaining control, a handoff that moves the active conversation to another agent, and a parent agent that calls an agent as a bounded tool and receives the result.</desc>
  <g transform="translate(19 29)">${body}</g>
${semanticText}
</svg>
`;
await writeFile(outputPath, normalized, 'utf8');
console.log(`Normalized AGT-P-06 SVG with Draw.io SHA-256 ${drawioSha256}`);
