import {
  parseXml,
  xmlElements,
} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/xml-visible-copy.mjs';

export const SVG_NS = 'http://www.w3.org/2000/svg';
export const NODE_IDS = [
  'control-store', 'checkpoint', 'approval-service', 'sandbox-tool',
  'authority-system', 'reconciliation', 'completed', 'manual-terminal',
];
export const REGION_IDS = ['control-plane', 'business-plane'];
export const EDGE_CONTRACTS = [
  ['edge-checkpoint', 'control-store', 'checkpoint'],
  ['edge-approval', 'checkpoint', 'approval-service'],
  ['edge-resume', 'approval-service', 'sandbox-tool'],
  ['edge-reject', 'approval-service', 'manual-terminal'],
  ['edge-effect', 'sandbox-tool', 'authority-system'],
  ['edge-reconcile', 'authority-system', 'reconciliation'],
  ['edge-recovery', 'reconciliation', 'control-store'],
  ['edge-unknown', 'reconciliation', 'manual-terminal'],
  ['edge-complete', 'control-store', 'completed'],
];
export const CAPTIONS = new Map([
  ['control-store', ['caption-control-store', 'Control state + checkpoint refs']],
  ['checkpoint', ['caption-checkpoint', 'Schema + version + operation ID']],
  ['approval-service', ['caption-approval-service', 'Context + authority + deadline']],
  ['sandbox-tool', ['caption-sandbox-tool', 'Scoped, idempotent action']],
  ['authority-system', ['caption-authority-system', 'External business truth']],
  ['reconciliation', ['caption-reconciliation', 'Read back before retry']],
  ['completed', ['caption-completed', 'Verified durable terminal']],
  ['manual-terminal', ['caption-manual-terminal', 'Reject, timeout, or unknown']],
]);
export const EDGE_LABELS = new Map([
  ['edge-resume', ['edge-label-resume', 'Resume']],
  ['edge-reject', ['edge-label-reject', 'Reject / timeout']],
  ['edge-reconcile', ['edge-label-reconcile', 'Authoritative read']],
  ['edge-recovery', ['edge-label-recovery', 'Recovery / replay']],
  ['edge-unknown', ['edge-label-unknown', 'Unknown effect']],
]);

export const fail = (message) => { throw new Error(`AGT-P-08 diagram contract: ${message}`); };
export const number = (value, label) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) fail(`${label} must be numeric`);
  return parsed;
};
export const parseStyle = (value = '') => new Map(value.split(';').filter(Boolean).map((item) => {
  const index = item.indexOf('=');
  return index === -1 ? [item, '1'] : [item.slice(0, index), item.slice(index + 1)];
}));
export const elementsById = (root) => new Map(xmlElements(root, 'mxCell', '').map((cell) => [cell.attributes.get('id'), cell]));
export const geometryOf = (cell, label) => {
  const geometry = xmlElements(cell, 'mxGeometry', '')[0];
  if (!geometry) fail(`${label} lacks mxGeometry`);
  const read = (name, fallback) => number(geometry.attributes.get(name) ?? fallback, `${label}.${name}`);
  return {
    element: geometry,
    x: read('x', '0'), y: read('y', '0'),
    width: read('width', '0'), height: read('height', '0'),
  };
};
const point = (box, xName, yName) => [
  box.x + number(xName, 'port.x') * box.width,
  box.y + number(yName, 'port.y') * box.height,
];
export const routeFor = (edge, cells) => {
  const id = edge.attributes.get('id');
  const style = parseStyle(edge.attributes.get('style'));
  if (style.get('edgeStyle') !== 'orthogonalEdgeStyle' || style.get('rounded') !== '0') fail(`${id} route style drift`);
  if (style.get('endArrow') !== 'block' || style.get('endFill') !== '1') fail(`${id} arrow style drift`);
  const sourceId = edge.attributes.get('source');
  const targetId = edge.attributes.get('target');
  const source = geometryOf(cells.get(sourceId), sourceId);
  const target = geometryOf(cells.get(targetId), targetId);
  const points = [
    point(source, style.get('exitX') ?? '0.5', style.get('exitY') ?? '0.5'),
    ...xmlElements(geometryOf(edge, id).element, 'mxPoint', '')
      .filter((item) => item.attributes.get('as') !== 'offset')
      .map((item) => [number(item.attributes.get('x'), `${id}.waypoint.x`), number(item.attributes.get('y'), `${id}.waypoint.y`)]),
    point(target, style.get('entryX') ?? '0.5', style.get('entryY') ?? '0.5'),
  ];
  const clean = points.filter((item, index) => index === 0 || item[0] !== points[index - 1][0] || item[1] !== points[index - 1][1]);
  for (let index = 1; index < clean.length; index += 1) {
    if (clean[index][0] !== clean[index - 1][0] && clean[index][1] !== clean[index - 1][1]) fail(`${id} contains a diagonal source segment`);
  }
  return clean;
};
const readCell = (cells, id) => {
  const cell = cells.get(id);
  if (!cell) fail(`source lacks ${id}`);
  return {cell, geometry: geometryOf(cell, id), style: parseStyle(cell.attributes.get('style')), value: cell.attributes.get('value') ?? ''};
};
export function parseDrawioModel(source, file = '<agt-p-08.drawio>', {strictPageName = true} = {}) {
  const root = parseXml(source, file).root;
  if (root.localName !== 'mxfile') fail('source root must be mxfile');
  const diagram = xmlElements(root, 'diagram', '');
  if (diagram.length !== 1) fail('source must contain exactly one diagram page');
  if (strictPageName && diagram[0].attributes.get('name') !== 'AGT-P-08 durable agent and human approval') fail('diagram page name drift');
  const cells = elementsById(root);
  const regions = REGION_IDS.map((id) => ({id, ...readCell(cells, id)}));
  const nodes = NODE_IDS.map((id) => ({id, ...readCell(cells, id)}));
  const captions = NODE_IDS.map((nodeId) => {
    const [id, expected] = CAPTIONS.get(nodeId);
    const caption = {id, nodeId, ...readCell(cells, id)};
    if (caption.value !== expected) fail(`${id} label drift`);
    return caption;
  });
  const edges = EDGE_CONTRACTS.map(([id, sourceId, targetId]) => {
    const edge = cells.get(id);
    if (!edge) fail(`source lacks ${id}`);
    if (edge.attributes.get('source') !== sourceId || edge.attributes.get('target') !== targetId) fail(`${id} endpoints drift`);
    if ((edge.attributes.get('value') ?? '') !== '') fail(`${id} must delegate its visible label to an explicit label cell`);
    return {id, sourceId, targetId, cell: edge, style: parseStyle(edge.attributes.get('style')), route: routeFor(edge, cells)};
  });
  const edgeLabels = [...EDGE_LABELS].map(([edgeId, [id, expected]]) => {
    const label = {id, edgeId, ...readCell(cells, id)};
    if (label.value !== expected) fail(`${id} label drift`);
    return label;
  });
  if (edges.some(({sourceId}) => sourceId === 'manual-terminal')) fail('manual terminal must not have an automatic outgoing edge');
  return {root, cells, regions, nodes, captions, edges, edgeLabels};
}

export const xmlText = (element) => element.content.map((item) => item.type === 'text' ? item.text : xmlText(item)).join('');
export const parsePath = (value, label) => {
  const tokens = value.trim().match(/[MLZ]|-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? [];
  const points = [];
  for (let index = 0; index < tokens.length;) {
    const command = tokens[index++];
    if (command === 'Z') break;
    if (command !== 'M' && command !== 'L') fail(`${label} path command drift`);
    points.push([number(tokens[index++], `${label}.x`), number(tokens[index++], `${label}.y`)]);
  }
  return points;
};
export const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
