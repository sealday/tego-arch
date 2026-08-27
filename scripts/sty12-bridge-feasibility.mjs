import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SVG_PATH = resolve(ROOT, 'static/img/diagrams/sty-12-micro-frontend-commerce-runtime.svg');
const STROKE_WIDTH = 7;
const SAMPLE_MINIMUM = 7;

export const BRIDGE_SEARCH_DOMAIN = Object.freeze({
  fixedOwner: Object.freeze({id: 'activate-account', horizontal: Object.freeze({from: 1365, to: 1840, y: 1920})}),
  recovery: Object.freeze({
    source: Object.freeze({x: 1700, y: 1960}), target: Object.freeze({x: 1680, y: 1910}),
    laneX: Object.freeze([1660, 1680, 1700]),
    lowerShelfY: Object.freeze([1940, 1941, 1942, 1943, 1944, 1945, 1946, 1947, 1948]),
    upperStartY: Object.freeze([1898, 1900, 1902, 1904]),
  }),
  bridge: Object.freeze({owner: 'activate-account', under: 'load-failure', at: Object.freeze({x: 1680, y: 1920}), sampleMinimum: SAMPLE_MINIMUM}),
});

export const BRIDGE_SEARCH_CONSTRAINTS = Object.freeze([
  'all 29 semantic endpoints and the first five bridge identities/coordinates remain fixed',
  'activate-account keeps its fixed horizontal owner corridor x=1365..1840 at y=1920',
  'load-failure uses one local vertical lane between its fixed source and slice-fallback target',
  'five-bridge candidates may not leave a naked perpendicular intersection',
  'six-bridge candidates may use only activate-account over load-failure at (1680,1920) and require sampled clearance >= 7u',
]);

function attribute(tag, name) { return new RegExp(`\\b${name}="([^"]*)"`, 'u').exec(tag)?.[1]; }

function pathPoints(data) {
  const points = [...(data ?? '').matchAll(/[ML]\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/gu)].map(([, x, y]) => ({x: Number(x), y: Number(y)}));
  if (points.length < 2) throw new Error(`expected an orthogonal path with two points: ${data}`);
  return points;
}

function pathSegments(points) { return points.slice(1).map((end, index) => ({start: points[index], end})); }

function bridgeArc(source) {
  const tag = [...source.matchAll(/<path\b[^>]*data-bridge-for="activate-account"[^>]*\/>/gu)].map(([item]) => item)[0];
  if (!tag || attribute(tag, 'data-crosses-edge') !== 'load-failure' || attribute(tag, 'data-bridge-at') !== '1680 1920') throw new Error('missing exact sixth recovery bridge allowlist witness');
  const values = [...(attribute(tag, 'd') ?? '').matchAll(/-?\d+(?:\.\d+)?/gu)].map(([value]) => Number(value));
  if (values.length !== 10) throw new Error('sixth bridge must retain M/L/Q/L geometry');
  const arc = {shoulder: {x: values[2], y: values[3]}, control: {x: values[4], y: values[5]}, curveEnd: {x: values[6], y: values[7]}};
  if (arc.control.x !== 1680 || arc.control.y !== 1944) throw new Error('sixth bridge must use the downward control point (1680,1944)');
  if (attribute(tag, 'stroke-dasharray') !== '18 10') throw new Error('sixth bridge must visually synchronize the resolve dash pattern');
  return arc;
}

function quadraticPoint(arc, t) {
  const inverse = 1 - t;
  return {
    x: inverse * inverse * arc.shoulder.x + 2 * inverse * t * arc.control.x + t * t * arc.curveEnd.x,
    y: inverse * inverse * arc.shoulder.y + 2 * inverse * t * arc.control.y + t * t * arc.curveEnd.y,
  };
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

function actualLoadSegments(source) {
  const tags = [...source.matchAll(/<path\b[^>]*\/>/gu)].map(([item]) => item).filter((tag) => attribute(tag, 'data-edge-id') === 'load-failure' || attribute(tag, 'data-edge-segment-for') === 'load-failure');
  return tags.flatMap((tag) => pathSegments(pathPoints(attribute(tag, 'd'))));
}

function crossesFixedOwner(laneX) {
  const {horizontal} = BRIDGE_SEARCH_DOMAIN.fixedOwner;
  return laneX >= horizontal.from && laneX <= horizontal.to;
}

function candidateTriples() {
  const {laneX, lowerShelfY, upperStartY} = BRIDGE_SEARCH_DOMAIN.recovery;
  return laneX.flatMap((x) => lowerShelfY.flatMap((lower) => upperStartY.map((upper) => ({laneX: x, lowerShelfY: lower, upperStartY: upper}))));
}

function candidateSegments({laneX, lowerShelfY, upperStartY}, bridged) {
  const {source, target} = BRIDGE_SEARCH_DOMAIN.recovery;
  const lower = [{start: source, end: {x: 1280, y: source.y}}, {start: {x: 1280, y: source.y}, end: {x: 1280, y: lowerShelfY}}, {start: {x: 1280, y: lowerShelfY}, end: {x: laneX, y: lowerShelfY}}];
  if (!bridged) return [...lower, {start: {x: laneX, y: lowerShelfY}, end: {x: laneX, y: target.y}}, {start: {x: laneX, y: target.y}, end: target}];
  return [...lower, {start: {x: laneX, y: upperStartY}, end: {x: laneX, y: target.y}}, {start: {x: laneX, y: target.y}, end: target}];
}

export function runBridgeFeasibilitySearch(svgSource = readFileSync(SVG_PATH, 'utf8')) {
  const arc = bridgeArc(svgSource); const candidates = candidateTriples();
  const fiveFeasible = candidates.filter(({laneX}) => !crossesFixedOwner(laneX));
  const sixFeasible = candidates.filter((candidate) => candidate.laneX === 1680 && sampledClearance(arc, candidateSegments(candidate, true)) >= SAMPLE_MINIMUM);
  const actualClearance = sampledClearance(arc, actualLoadSegments(svgSource));
  const witness = sixFeasible.find(({laneX, lowerShelfY, upperStartY}) => laneX === 1680 && lowerShelfY === 1944 && upperStartY === 1902);
  if (!witness || actualClearance < SAMPLE_MINIMUM) throw new Error('sixth bridge witness is not physically feasible in the published SVG');
  return {
    domain: BRIDGE_SEARCH_DOMAIN,
    constraints: BRIDGE_SEARCH_CONSTRAINTS,
    fiveBridge: {candidates: candidates.length, feasible: fiveFeasible.length},
    sixBridge: {candidates: candidates.length, feasible: sixFeasible.length, witness: {...witness, sampledCenterlineToUnderEnvelope: actualClearance, allowlistedBridge: BRIDGE_SEARCH_DOMAIN.bridge}},
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(runBridgeFeasibilitySearch()));
