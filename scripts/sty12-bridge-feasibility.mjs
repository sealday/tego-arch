import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SVG_PATH = resolve(ROOT, 'static/img/diagrams/sty-12-micro-frontend-commerce-runtime.svg');
const STROKE_WIDTH = 7;
const SAMPLE_MINIMUM = 7;

const SEMANTIC_ENDPOINT_CONTRACT = Object.freeze([
  ['catalog-release', 'catalog-pipeline', 'immutable-artifacts'], ['cart-release', 'cart-pipeline', 'immutable-artifacts'],
  ['checkout-release', 'checkout-pipeline', 'immutable-artifacts'], ['account-release', 'account-pipeline', 'immutable-artifacts'],
  ['store-artifacts', 'immutable-artifacts', 'compatibility-gate'], ['validate-candidate', 'compatibility-gate', 'versioned-manifest'],
  ['publish-manifest', 'versioned-manifest', 'atomic-promotion'], ['promote-manifest', 'atomic-promotion', 'shell'],
  ['resolve-manifest', 'versioned-manifest', 'shell'], ['route-control', 'shell', 'top-router'],
  ['activate-catalog', 'top-router', 'catalog-slice'], ['activate-cart', 'top-router', 'cart-slice'],
  ['activate-checkout', 'top-router', 'checkout-slice'], ['activate-account', 'top-router', 'account-slice'],
  ['share-runtime-catalog', 'shared-runtime', 'catalog-slice'], ['share-runtime-cart', 'shared-runtime', 'cart-slice'],
  ['share-runtime-checkout', 'shared-runtime', 'checkout-slice'], ['share-runtime-account', 'shared-runtime', 'account-slice'],
  ['checkout-read-cart', 'checkout-slice', 'cart-api'], ['checkout-submit-order', 'checkout-slice', 'order-api'],
  ['catalog-query', 'catalog-slice', 'catalog-api'], ['cart-query', 'cart-slice', 'cart-api'],
  ['account-query', 'account-slice', 'account-api'], ['load-failure', 'checkout-slice', 'slice-fallback'],
  ['rollback-manifest', 'slice-fallback', 'atomic-promotion'], ['return-catalog', 'catalog-api', 'catalog-slice'],
  ['return-cart-version', 'cart-api', 'checkout-slice'], ['return-order-id', 'order-api', 'checkout-slice'],
  ['return-account', 'account-api', 'account-slice'],
]);

const FIRST_FIVE_BRIDGE_CONTRACT = Object.freeze([
  ['share-runtime-catalog', 'cart-query', 760, 2320],
  ['share-runtime-account', 'checkout-read-cart', 1500, 2320],
  ['share-runtime-account', 'return-cart-version', 1580, 2320],
  ['share-runtime-account', 'return-order-id', 1660, 2320],
  ['share-runtime-account', 'checkout-submit-order', 1740, 2320],
]);

export const BRIDGE_SEARCH_DOMAIN = Object.freeze({
  recovery: Object.freeze({
    laneX: Object.freeze([1660, 1680, 1700]),
    lowerShelfY: Object.freeze([1940, 1941, 1942, 1943, 1944, 1945, 1946, 1947, 1948]),
    upperStartY: Object.freeze([1898, 1900, 1902, 1904]),
  }),
  sampleMinimum: SAMPLE_MINIMUM,
});

function attribute(tag, name) { return new RegExp(`\\b${name}="([^"]*)"`, 'u').exec(tag)?.[1]; }
function pathTags(source) { return [...source.matchAll(/<path\b[^>]*\/>/gu)].map(([tag]) => tag); }
function pathPoints(data) {
  const points = [...(data ?? '').matchAll(/[ML]\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/gu)].map(([, x, y]) => ({x: Number(x), y: Number(y)}));
  if (points.length < 2) throw new Error(`expected an orthogonal path with two points: ${data}`);
  return points;
}
function pathSegments(points) { return points.slice(1).map((end, index) => ({start: points[index], end})); }
function samePoint(left, right) { return left.x === right.x && left.y === right.y; }
function sameBridge(left, right) { return left.owner === right[0] && left.under === right[1] && left.at.x === right[2] && left.at.y === right[3]; }

function semanticEndpointTags(tags) {
  const edges = tags.filter((tag) => attribute(tag, 'data-edge-id'));
  if (edges.length !== SEMANTIC_ENDPOINT_CONTRACT.length) throw new Error('semantic endpoint contract must retain exactly 29 semantic edges');
  const byId = new Map(edges.map((tag) => [attribute(tag, 'data-edge-id'), tag]));
  if (byId.size !== edges.length) throw new Error('semantic endpoint contract has duplicate semantic edge identities');
  for (const [id, source, target] of SEMANTIC_ENDPOINT_CONTRACT) {
    const tag = byId.get(id);
    if (!tag || attribute(tag, 'data-source') !== source || attribute(tag, 'data-target') !== target) throw new Error(`semantic endpoint contract ${id}`);
  }
  return byId;
}

function bridgeRecords(tags) {
  return tags.filter((tag) => attribute(tag, 'data-bridge-for')).map((tag) => {
    const [x, y] = (attribute(tag, 'data-bridge-at') ?? '').split(/\s+/u).map(Number);
    return {tag, owner: attribute(tag, 'data-bridge-for'), under: attribute(tag, 'data-crosses-edge'), at: {x, y}};
  });
}

function assertFirstFiveBridgeContract(records) {
  const firstFive = records.filter(({under}) => under !== 'load-failure').sort((left, right) => left.at.x - right.at.x);
  if (records.length !== 6 || firstFive.length !== FIRST_FIVE_BRIDGE_CONTRACT.length || !firstFive.every((bridge, index) => sameBridge(bridge, FIRST_FIVE_BRIDGE_CONTRACT[index]))) throw new Error('first five bridge allowlist identities and coordinates');
}

function bridgeArc(records) {
  const sixth = records.find(({owner, under, at}) => owner === 'activate-account' && under === 'load-failure' && at.x === 1680 && at.y === 1920);
  if (!sixth) throw new Error('missing exact sixth recovery bridge allowlist witness');
  const values = [...(attribute(sixth.tag, 'd') ?? '').matchAll(/-?\d+(?:\.\d+)?/gu)].map(([value]) => Number(value));
  if (values.length !== 10) throw new Error('sixth bridge must retain M/L/Q/L geometry');
  const arc = {shoulder: {x: values[2], y: values[3]}, control: {x: values[4], y: values[5]}, curveEnd: {x: values[6], y: values[7]}};
  if (arc.control.x !== sixth.at.x || arc.control.y !== 1944) throw new Error('sixth bridge must use the downward control point (1680,1944)');
  if (attribute(sixth.tag, 'stroke-dasharray') !== '18 10') throw new Error('sixth bridge must visually synchronize the resolve dash pattern');
  return {...arc, bridge: sixth};
}

function activateAccountOwnerCorridor(semanticEdges, tags, bridge) {
  const primary = semanticEdges.get('activate-account');
  const continuation = tags.find((tag) => attribute(tag, 'data-edge-segment-for') === 'activate-account' && attribute(tag, 'data-segment-order') === '2');
  if (!primary || !continuation) throw new Error('activate-account fixed owner corridor route segments');
  const primarySegments = pathSegments(pathPoints(attribute(primary, 'd')));
  const continuationSegments = pathSegments(pathPoints(attribute(continuation, 'd')));
  const vertical = primarySegments.find(({start, end}) => start.x === end.x && end.y === bridge.at.y);
  const leftArcTerminal = {x: bridge.at.x - 18, y: bridge.at.y}; const rightArcTerminal = {x: bridge.at.x + 18, y: bridge.at.y};
  const hasLeftCorridor = primarySegments.some(({start, end}) => samePoint(start, vertical?.end ?? {}) && samePoint(end, leftArcTerminal));
  const rightCorridor = continuationSegments.find(({start, end}) => samePoint(start, rightArcTerminal) && start.y === end.y);
  if (!vertical || !hasLeftCorridor || !rightCorridor || vertical.start.y !== 1600 || rightCorridor.end.x !== 1840) throw new Error('activate-account fixed owner corridor');
  return {id: 'activate-account', horizontal: {from: vertical.start.x, to: rightCorridor.end.x, y: bridge.at.y}};
}

function loadFailureRoute(tags) {
  const primary = tags.find((tag) => attribute(tag, 'data-edge-id') === 'load-failure');
  const continuation = tags.find((tag) => attribute(tag, 'data-edge-segment-for') === 'load-failure' && attribute(tag, 'data-segment-order') === '2');
  if (!primary || !continuation) throw new Error('load-failure recovery route segments');
  const primaryPoints = pathPoints(attribute(primary, 'd')); const continuationPoints = pathPoints(attribute(continuation, 'd'));
  if (primaryPoints.length !== 4 || continuationPoints.length !== 2) throw new Error('load-failure bounded candidate shape');
  return {source: primaryPoints[0], spine: primaryPoints[1], lower: primaryPoints.at(-1), upper: continuationPoints[0], target: continuationPoints.at(-1), segments: [...pathSegments(primaryPoints), ...pathSegments(continuationPoints)]};
}

function quadraticPoint(arc, t) {
  const inverse = 1 - t;
  return {x: inverse * inverse * arc.shoulder.x + 2 * inverse * t * arc.control.x + t * t * arc.curveEnd.x, y: inverse * inverse * arc.shoulder.y + 2 * inverse * t * arc.control.y + t * t * arc.curveEnd.y};
}

function pointToStrokeEnvelope(point, {start, end}) {
  const half = STROKE_WIDTH / 2;
  const left = Math.min(start.x, end.x) - half; const right = Math.max(start.x, end.x) + half;
  const top = Math.min(start.y, end.y) - half; const bottom = Math.max(start.y, end.y) + half;
  return Math.hypot(Math.max(0, left - point.x, point.x - right), Math.max(0, top - point.y, point.y - bottom));
}

function sampledClearance(arc, segments) {
  return Math.min(...Array.from({length: 257}, (_, index) => {
    const point = quadraticPoint(arc, index / 256);
    return Math.min(...segments.map((segment) => pointToStrokeEnvelope(point, segment)));
  }));
}

function candidateTriples() {
  const {laneX, lowerShelfY, upperStartY} = BRIDGE_SEARCH_DOMAIN.recovery;
  return laneX.flatMap((x) => lowerShelfY.flatMap((lower) => upperStartY.map((upper) => ({laneX: x, lowerShelfY: lower, upperStartY: upper}))));
}

function candidateSegments({laneX, lowerShelfY, upperStartY}, recovery, bridged) {
  const lower = [{start: recovery.source, end: {x: recovery.spine.x, y: recovery.source.y}}, {start: {x: recovery.spine.x, y: recovery.source.y}, end: {x: recovery.spine.x, y: lowerShelfY}}, {start: {x: recovery.spine.x, y: lowerShelfY}, end: {x: laneX, y: lowerShelfY}}];
  if (!bridged) return [...lower, {start: {x: laneX, y: lowerShelfY}, end: {x: laneX, y: recovery.target.y}}, {start: {x: laneX, y: recovery.target.y}, end: recovery.target}];
  return [...lower, {start: {x: laneX, y: upperStartY}, end: {x: laneX, y: recovery.target.y}}, {start: {x: laneX, y: recovery.target.y}, end: recovery.target}];
}

function crossesFixedOwner(laneX, owner) { return laneX >= owner.horizontal.from && laneX <= owner.horizontal.to; }

function searchDomain(owner, recovery, bridge) {
  return {fixedOwner: owner, recovery: {source: recovery.source, target: recovery.target, laneX: BRIDGE_SEARCH_DOMAIN.recovery.laneX, lowerShelfY: BRIDGE_SEARCH_DOMAIN.recovery.lowerShelfY, upperStartY: BRIDGE_SEARCH_DOMAIN.recovery.upperStartY}, bridge: {owner: bridge.owner, under: bridge.under, at: bridge.at, sampleMinimum: SAMPLE_MINIMUM}};
}

function searchConstraints(owner, bridge) {
  return [
    'all 29 semantic endpoints and the first five bridge identities/coordinates remain fixed',
    `${owner.id} keeps its fixed horizontal owner corridor x=${owner.horizontal.from}..${owner.horizontal.to} at y=${owner.horizontal.y}`,
    'load-failure uses one local vertical lane between its fixed source and slice-fallback target',
    'five-bridge candidates may not leave a naked perpendicular intersection',
    `six-bridge candidates may use only ${bridge.owner} over ${bridge.under} at (${bridge.at.x},${bridge.at.y}) and require sampled clearance >= ${SAMPLE_MINIMUM}u`,
  ];
}

export function runBridgeFeasibilitySearch(svgSource = readFileSync(SVG_PATH, 'utf8')) {
  const tags = pathTags(svgSource); const semanticEdges = semanticEndpointTags(tags); const bridges = bridgeRecords(tags);
  assertFirstFiveBridgeContract(bridges);
  const arc = bridgeArc(bridges); const owner = activateAccountOwnerCorridor(semanticEdges, tags, arc.bridge); const recovery = loadFailureRoute(tags);
  const candidates = candidateTriples();
  const fiveFeasible = candidates.filter(({laneX}) => !crossesFixedOwner(laneX, owner));
  const sixFeasible = candidates.filter((candidate) => candidate.laneX === arc.bridge.at.x && sampledClearance(arc, candidateSegments(candidate, recovery, true)) >= SAMPLE_MINIMUM);
  const publishedCandidate = {laneX: recovery.lower.x, lowerShelfY: recovery.lower.y, upperStartY: recovery.upper.y};
  const actualClearance = sampledClearance(arc, recovery.segments);
  const publishedWitness = sixFeasible.find((candidate) => candidate.laneX === publishedCandidate.laneX && candidate.lowerShelfY === publishedCandidate.lowerShelfY && candidate.upperStartY === publishedCandidate.upperStartY);
  if (!publishedWitness || actualClearance < SAMPLE_MINIMUM) throw new Error('sixth bridge witness is not physically feasible in the published SVG');
  return {domain: searchDomain(owner, recovery, arc.bridge), constraints: searchConstraints(owner, arc.bridge), fiveBridge: {candidates: candidates.length, feasible: fiveFeasible.length}, sixBridge: {candidates: candidates.length, feasible: sixFeasible.length, witness: {...publishedWitness, sampledCenterlineToUnderEnvelope: actualClearance, allowlistedBridge: {owner: arc.bridge.owner, under: arc.bridge.under, at: arc.bridge.at, sampleMinimum: SAMPLE_MINIMUM}}}};
}

function cliSvgPath(args) {
  if (args.length === 0) return SVG_PATH;
  if (args.length === 2 && args[0] === '--svg') return resolve(args[1]);
  throw new Error('usage: node scripts/sty12-bridge-feasibility.mjs [--svg path]');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(runBridgeFeasibilitySearch(readFileSync(cliSvgPath(process.argv.slice(2)), 'utf8')))); }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
