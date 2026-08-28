import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {
  parseXml,
  xmlElements,
} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/xml-visible-copy.mjs';

const drawioPath = 'diagrams/production-incident-response-agent.drawio';
const svgPath = 'static/img/diagrams/production-incident-response-agent.svg';
const nodeTitles = [
  'Alert / Incident',
  'Policy Router',
  'Read-only Diagnostic Agent',
  'Telemetry',
  'Hypothesis Ledger',
  'Evaluator',
  'Incident Commander',
  'Approval Gate',
  'Change Executor',
  'Authority Systems',
  'Recovery Verifier',
  'Manual Control',
];
const boundaryTitles = [
  'Read-only control',
  'Human command',
  'Write execution',
  'Service authority',
];
const relationLabels = [
  'severity / route',
  'read-only scope',
  'query evidence',
  'telemetry signals',
  'version hypothesis',
  'rank / challenge',
  'recommend action',
  'command decision',
  'approved intent',
  'idempotent change',
  'authority result',
  'verify indicators',
  'recovery confirmed',
  'rollback request',
  'uncertainty / manual',
  'manual authority',
];
const helveticaWidths = {
  ' ': 278, '+': 584, '-': 333, '/': 278, ':': 278, '.': 278,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556,
  h: 556, i: 222, j: 222, k: 500, l: 222, m: 833, n: 556,
  o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556,
  v: 500, w: 722, x: 500, y: 500, z: 500,
};

const number = (element, name, fallback = 0) => Number(element.attributes.get(name) ?? fallback);
const textContent = (element) => element.content.map((child) => (
  child.type === 'text' ? child.text : textContent(child)
)).join('');
const styleMap = (element) => new Map((element.attributes.get('style') ?? '')
  .split(';')
  .filter(Boolean)
  .map((part) => {
    const separator = part.indexOf(':');
    return [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
  }));

function translated(offset, element) {
  const transform = element.attributes.get('transform') ?? '';
  const match = transform.match(/translate\(\s*(-?[0-9.]+)(?:[ ,]+(-?[0-9.]+))?\s*\)/u);
  return match
    ? {x: offset.x + Number(match[1]), y: offset.y + Number(match[2] ?? 0)}
    : offset;
}

function descendants(element, inherited = {}, offset = {x: 0, y: 0}, records = []) {
  const ownStyle = styleMap(element);
  const nextInherited = {
    fill: element.attributes.get('fill') ?? ownStyle.get('fill') ?? inherited.fill,
    fontSize: element.attributes.get('font-size') ?? inherited.fontSize,
    stroke: element.attributes.get('stroke') ?? ownStyle.get('stroke') ?? inherited.stroke,
    strokeWidth: element.attributes.get('stroke-width') ?? inherited.strokeWidth,
    textAnchor: element.attributes.get('text-anchor') ?? inherited.textAnchor,
  };
  const nextOffset = translated(offset, element);
  records.push({element, inherited: nextInherited, offset: nextOffset});
  for (const child of element.children) descendants(child, nextInherited, nextOffset, records);
  return records;
}

function groupMap(svgRoot) {
  return new Map(xmlElements(svgRoot, 'g', 'http://www.w3.org/2000/svg')
    .filter((element) => element.attributes.has('data-cell-id'))
    .map((element) => [element.attributes.get('data-cell-id'), element]));
}

function cellInventory(drawioRoot) {
  const cells = xmlElements(drawioRoot, 'mxCell', '');
  const byValue = new Map(cells.filter((cell) => cell.attributes.get('value'))
    .map((cell) => [cell.attributes.get('value'), cell]));
  const nodeShapes = new Map();
  const relationEdges = new Map();
  const relationRecords = [];
  const boundaryShapes = cells.filter((cell) => {
    if (cell.attributes.get('vertex') !== '1' || cell.attributes.get('value')) return false;
    const geometry = xmlElements(cell, 'mxGeometry', '')[0];
    return number(geometry, 'width') >= 800 && number(geometry, 'height') >= 800;
  }).map((cell) => cell.attributes.get('id'));
  let lastShape;
  let lastEdge;
  for (const cell of cells) {
    if (cell.attributes.get('edge') === '1') {
      lastEdge = cell.attributes.get('id');
      continue;
    }
    const value = cell.attributes.get('value') ?? '';
    if (nodeTitles.includes(value)) nodeShapes.set(value, lastShape);
    if (relationLabels.includes(value)) {
      relationEdges.set(value, lastEdge);
      relationRecords.push({edgeId: lastEdge, labelId: cell.attributes.get('id'), value});
    }
    if (cell.attributes.get('vertex') === '1' && !value) lastShape = cell.attributes.get('id');
  }
  return {boundaryShapes, byValue, nodeShapes, relationEdges, relationRecords};
}

function pathPoints(path) {
  const commands = path.attributes.get('d')?.match(/[MLHVCSQTAZ]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/giu) ?? [];
  const points = [];
  let command = '';
  let x = 0;
  let y = 0;
  let index = 0;
  const args = {M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7};
  while (index < commands.length) {
    if (/^[A-Z]$/iu.test(commands[index])) {
      command = commands[index].toUpperCase();
      index += 1;
      if (command === 'Z') continue;
    }
    const count = args[command];
    if (!count || index + count > commands.length) break;
    const values = commands.slice(index, index + count).map(Number);
    if (command === 'H') x = values[0];
    else if (command === 'V') y = values[0];
    else {
      for (let point = 0; point < values.length; point += 2) {
        if (command === 'A' && point === 0) continue;
        x = values[point];
        y = values[point + 1];
        if (Number.isFinite(x) && Number.isFinite(y)) points.push({x, y});
      }
    }
    if (command === 'H' || command === 'V') points.push({x, y});
    index += count;
    if (command === 'M') command = 'L';
  }
  return points;
}

function elementBox(record) {
  const {element, offset} = record;
  if (element.localName === 'rect') {
    const stroke = number(element, 'stroke-width', Number(record.inherited.strokeWidth ?? 0));
    return {
      left: number(element, 'x') + offset.x - stroke / 2,
      right: number(element, 'x') + offset.x + number(element, 'width') + stroke / 2,
      top: number(element, 'y') + offset.y - stroke / 2,
      bottom: number(element, 'y') + offset.y + number(element, 'height') + stroke / 2,
    };
  }
  if (element.localName === 'path') {
    const points = pathPoints(element).map((point) => ({x: point.x + offset.x, y: point.y + offset.y}));
    if (!points.length) return undefined;
    const stroke = number(element, 'stroke-width', Number(record.inherited.strokeWidth ?? 0));
    return {
      left: Math.min(...points.map(({x}) => x)) - stroke / 2,
      right: Math.max(...points.map(({x}) => x)) + stroke / 2,
      top: Math.min(...points.map(({y}) => y)) - stroke / 2,
      bottom: Math.max(...points.map(({y}) => y)) + stroke / 2,
    };
  }
  return undefined;
}

function unionBoxes(boxes) {
  const present = boxes.filter(Boolean);
  return {
    left: Math.min(...present.map(({left}) => left)),
    right: Math.max(...present.map(({right}) => right)),
    top: Math.min(...present.map(({top}) => top)),
    bottom: Math.max(...present.map(({bottom}) => bottom)),
  };
}

function textBox(group) {
  const texts = descendants(group).filter(({element}) => element.localName === 'text');
  assert.equal(texts.length, 1, `one rendered text element for ${group.attributes.get('data-cell-id')}`);
  const record = texts[0];
  const fontSize = Number.parseFloat(record.inherited.fontSize);
  const value = textContent(record.element);
  const width = [...value].reduce((total, character) => {
    const lower = character.toLowerCase();
    return total + (helveticaWidths[character] ?? helveticaWidths[lower] ?? 667);
  }, 0) * fontSize / 1000;
  const x = number(record.element, 'x') + record.offset.x;
  const baseline = number(record.element, 'y') + record.offset.y;
  const anchor = record.inherited.textAnchor ?? 'start';
  const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  return {
    baseline,
    bottom: baseline + fontSize * 0.4,
    fontSize,
    left,
    right: left + width,
    top: baseline - fontSize * 1.05,
    value,
  };
}

function boxDistance(left, right) {
  const dx = Math.max(left.left - right.right, right.left - left.right, 0);
  const dy = Math.max(left.top - right.bottom, right.top - left.bottom, 0);
  return Math.hypot(dx, dy);
}

function pointSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const progress = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - (start.x + progress * dx), point.y - (start.y + progress * dy));
}

function segmentIntersectsBox(start, end, box) {
  let lower = 0;
  let upper = 1;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  for (const [p, q] of [
    [-dx, start.x - box.left], [dx, box.right - start.x],
    [-dy, start.y - box.top], [dy, box.bottom - start.y],
  ]) {
    if (p === 0 && q < 0) return false;
    if (p < 0) lower = Math.max(lower, q / p);
    else if (p > 0) upper = Math.min(upper, q / p);
    if (lower > upper) return false;
  }
  return true;
}

function segmentBoxDistance(start, end, box) {
  if (segmentIntersectsBox(start, end, box)) return 0;
  const corners = [
    {x: box.left, y: box.top}, {x: box.right, y: box.top},
    {x: box.right, y: box.bottom}, {x: box.left, y: box.bottom},
  ];
  const endpointDistance = Math.min(
    ...[start, end].map((point) => boxDistance({...point, left: point.x, right: point.x, top: point.y, bottom: point.y}, box)),
  );
  return Math.min(endpointDistance, ...corners.map((corner) => pointSegmentDistance(corner, start, end)));
}

function roundedRectPoints(record) {
  const {element, offset} = record;
  const x = number(element, 'x') + offset.x;
  const y = number(element, 'y') + offset.y;
  const width = number(element, 'width');
  const height = number(element, 'height');
  const rx = Math.min(number(element, 'rx'), width / 2);
  const ry = Math.min(number(element, 'ry'), height / 2);
  const points = [{x: x + rx, y}, {x: x + width - rx, y}];
  const arc = (centerX, centerY, start, end) => {
    for (let step = 1; step <= 16; step += 1) {
      const angle = start + (end - start) * step / 16;
      points.push({x: centerX + Math.cos(angle) * rx, y: centerY + Math.sin(angle) * ry});
    }
  };
  arc(x + width - rx, y + ry, -Math.PI / 2, 0);
  points.push({x: x + width, y: y + height - ry});
  arc(x + width - rx, y + height - ry, 0, Math.PI / 2);
  points.push({x: x + rx, y: y + height});
  arc(x + rx, y + height - ry, Math.PI / 2, Math.PI);
  points.push({x, y: y + ry});
  arc(x + rx, y + ry, Math.PI, Math.PI * 1.5);
  return points;
}

function firstPaintedPath(group, predicate) {
  return descendants(group).find(({element, inherited}) => (
    element.localName === 'path' && predicate(element, inherited)
  ));
}

function perimeterClearance(box, points, stroke) {
  return Math.min(...points.map((end, index) => segmentBoxDistance(
    points[(index + points.length - 1) % points.length],
    end,
    box,
  ) - stroke / 2));
}

function validateGeometry(drawio, svg) {
  const drawioRoot = parseXml(drawio, '<drawio>').root;
  const svgRoot = parseXml(svg, '<svg>').root;
  const viewBox = (svgRoot.attributes.get('viewBox') ?? '').trim().split(/\s+/u).map(Number);
  assert.equal(viewBox.length, 4, 'SVG viewBox');
  const scale = 800 / viewBox[2];
  const groups = groupMap(svgRoot);
  const inventory = cellInventory(drawioRoot);
  const failures = [];
  const boundaryTitleMeasurements = [];
  const nodeBoxes = new Map();
  const nodeMeasurements = [];
  const relationMeasurements = [];

  assert.deepEqual([...inventory.nodeShapes.keys()].sort(), [...nodeTitles].sort(), 'all twelve node mappings');
  assert.deepEqual(
    inventory.relationRecords.map(({value}) => value).sort(),
    [...relationLabels].sort(),
    'all sixteen relationship-label mappings',
  );
  assert.equal(inventory.boundaryShapes.length, 4, 'all four visible boundary shapes');

  const cells = xmlElements(drawioRoot, 'mxCell', '');
  for (const title of nodeTitles) {
    const titleCell = inventory.byValue.get(title);
    const titleIndex = cells.indexOf(titleCell);
    const subtitleCell = cells.slice(titleIndex + 1).find((cell) => cell.attributes.get('value'));
    const shapeGroup = groups.get(inventory.nodeShapes.get(title));
    const titleGroup = groups.get(titleCell.attributes.get('id'));
    const subtitleGroup = groups.get(subtitleCell.attributes.get('id'));
    assert.ok(shapeGroup && titleGroup && subtitleGroup, `rendered groups for ${title}`);
    const shapeBox = unionBoxes(descendants(shapeGroup)
      .filter(({element, inherited}) => ['rect', 'path'].includes(element.localName) && inherited.stroke !== 'none')
      .map(elementBox));
    const titleBox = textBox(titleGroup);
    const subtitleBox = textBox(subtitleGroup);
    nodeBoxes.set(title, shapeBox);
    const measures = {
      top: (titleBox.top - shapeBox.top) * scale,
      bottom: (shapeBox.bottom - subtitleBox.bottom) * scale,
      left: (Math.min(titleBox.left, subtitleBox.left) - shapeBox.left) * scale,
      right: (shapeBox.right - Math.max(titleBox.right, subtitleBox.right)) * scale,
    };
    nodeMeasurements.push({
      title,
      ...measures,
      titleFont: titleBox.fontSize * scale,
      typeFont: subtitleBox.fontSize * scale,
      baseline: (subtitleBox.baseline - titleBox.baseline) * scale,
    });
    if (measures.top < 14 || measures.bottom < 14 || measures.left < 16 || measures.right < 16) {
      failures.push(`${title}: node clearance ${JSON.stringify(measures)}`);
    }
    if (titleBox.fontSize * scale < 15 || subtitleBox.fontSize * scale < 10) {
      failures.push(`${title}: type too small`);
    }
    if ((subtitleBox.baseline - titleBox.baseline) * scale < 22) failures.push(`${title}: baseline gap`);
  }

  const allNodeBoxes = [...nodeBoxes.entries()];
  const relationEdgeIds = cells.filter((cell) => cell.attributes.get('edge') === '1')
    .map((cell) => cell.attributes.get('id'));
  assert.equal(relationEdgeIds.length, 16, 'all sixteen unique relationship routes');
  const edgeGeometry = relationEdgeIds.map((edgeId) => {
    const edgeGroup = groups.get(edgeId);
    assert.ok(edgeGroup, `rendered edge group ${edgeId}`);
    const route = firstPaintedPath(edgeGroup, (element) => (
      (element.attributes.get('fill') ?? 'none') === 'none'
    ));
    const marker = firstPaintedPath(edgeGroup, (element, inherited) => (
      (element.attributes.get('fill') ?? inherited.fill ?? 'none') !== 'none'
    ));
    assert.ok(route && marker, `route and marker for edge ${edgeId}`);
    const routePoints = pathPoints(route.element).map((point) => ({
      x: point.x + route.offset.x,
      y: point.y + route.offset.y,
    }));
    assert.ok(routePoints.length >= 2, `measurable route for edge ${edgeId}`);
    return {
      edgeId,
      markerBox: elementBox(marker),
      routePoints,
      routeStroke: Number(route.element.attributes.get('stroke-width') ?? route.inherited.strokeWidth ?? 0),
    };
  });
  const boundaryGeometry = inventory.boundaryShapes.map((boundaryId) => {
    const boundaryGroup = groups.get(boundaryId);
    assert.ok(boundaryGroup, `rendered boundary group ${boundaryId}`);
    const boundary = descendants(boundaryGroup).find(({element, inherited}) => (
      element.localName === 'rect' && inherited.stroke !== 'none'
    ));
    assert.ok(boundary, `visible stroked rectangle for boundary ${boundaryId}`);
    return {
      boundaryId,
      boundaryPoints: roundedRectPoints(boundary),
      boundaryStroke: Number(boundary.element.attributes.get('stroke-width') ?? boundary.inherited.strokeWidth ?? 0),
    };
  });
  const boxAgainstAll = (box) => {
    const connectorClearances = edgeGeometry.map(({edgeId, routePoints, routeStroke}) => ({
      clearance: Math.min(...routePoints.slice(1).map((end, index) => (
        segmentBoxDistance(routePoints[index], end, box) - routeStroke / 2
      ))) * scale,
      edgeId,
    }));
    const arrowClearances = edgeGeometry.map(({edgeId, markerBox}) => ({
      clearance: boxDistance(box, markerBox) * scale,
      edgeId,
    }));
    const boundaryClearances = boundaryGeometry.map(({boundaryId, boundaryPoints, boundaryStroke}) => ({
      boundaryId,
      clearance: perimeterClearance(box, boundaryPoints, boundaryStroke) * scale,
    }));
    return {arrowClearances, boundaryClearances, connectorClearances};
  };

  const boundaryTitleBoxes = boundaryTitles.map((title) => {
    const titleCell = inventory.byValue.get(title);
    const titleGroup = groups.get(titleCell?.attributes.get('id'));
    assert.ok(titleGroup, `rendered boundary title group for ${title}`);
    const titleBox = textBox(titleGroup);
    const {arrowClearances, boundaryClearances, connectorClearances} = boxAgainstAll(titleBox);
    for (const {clearance, edgeId} of connectorClearances) {
      if (clearance < 8) failures.push(`${title}: boundary-title connector ${edgeId} clearance ${clearance}`);
    }
    for (const {clearance, edgeId} of arrowClearances) {
      if (clearance < 16) failures.push(`${title}: boundary-title arrow ${edgeId} clearance ${clearance}`);
    }
    for (const {boundaryId, clearance} of boundaryClearances) {
      if (clearance < 8) failures.push(`${title}: boundary-title boundary ${boundaryId} clearance ${clearance}`);
    }
    const nodeClearance = Math.min(...allNodeBoxes.map(([, box]) => boxDistance(titleBox, box))) * scale;
    if (nodeClearance < 12) failures.push(`${title}: boundary-title node clearance ${nodeClearance}`);
    const font = titleBox.fontSize * scale;
    if (font < 10) failures.push(`${title}: boundary-title type too small`);
    boundaryTitleMeasurements.push({
      title,
      arrow: Math.min(...arrowClearances.map(({clearance}) => clearance)),
      boundary: Math.min(...boundaryClearances.map(({clearance}) => clearance)),
      connector: Math.min(...connectorClearances.map(({clearance}) => clearance)),
      font,
      node: nodeClearance,
    });
    return [title, titleBox];
  });

  const labelBoxes = [];
  for (const {labelId, value: label} of inventory.relationRecords) {
    const labelGroup = groups.get(labelId);
    assert.ok(labelGroup, `rendered relationship group for ${label}`);
    const labelBox = textBox(labelGroup);
    labelBoxes.push([label, labelBox]);
    const opaqueBackgrounds = descendants(labelGroup).filter(({element, inherited}) => {
      if (!['rect', 'path'].includes(element.localName)) return false;
      const fill = element.attributes.get('fill') ?? inherited.fill ?? 'none';
      const opacity = Number(element.attributes.get('fill-opacity') ?? element.attributes.get('opacity') ?? 1);
      return fill !== 'none' && fill !== 'transparent' && opacity > 0;
    });
    if (opaqueBackgrounds.length) failures.push(`${label}: opaque label background`);
    const {arrowClearances, boundaryClearances, connectorClearances} = boxAgainstAll(labelBox);
    for (const {clearance, edgeId} of connectorClearances) {
      if (clearance < 8) failures.push(`${label}: connector ${edgeId} clearance ${clearance}`);
    }
    for (const {clearance, edgeId} of arrowClearances) {
      if (clearance < 16) failures.push(`${label}: arrow ${edgeId} clearance ${clearance}`);
    }
    for (const {boundaryId, clearance} of boundaryClearances) {
      if (clearance < 8) failures.push(`${label}: boundary ${boundaryId} clearance ${clearance}`);
    }
    const nodeClearance = Math.min(...allNodeBoxes.map(([, box]) => boxDistance(labelBox, box))) * scale;
    if (nodeClearance < 12) failures.push(`${label}: node clearance ${nodeClearance}`);
    relationMeasurements.push({
      label,
      arrow: Math.min(...arrowClearances.map(({clearance}) => clearance)),
      boundary: Math.min(...boundaryClearances.map(({clearance}) => clearance)),
      connector: Math.min(...connectorClearances.map(({clearance}) => clearance)),
      node: nodeClearance,
      transparent: opaqueBackgrounds.length === 0,
    });
  }
  for (let left = 0; left < labelBoxes.length; left += 1) {
    for (let right = left + 1; right < labelBoxes.length; right += 1) {
      if (boxDistance(labelBoxes[left][1], labelBoxes[right][1]) === 0) {
        failures.push(`${labelBoxes[left][0]}: overlaps label ${labelBoxes[right][0]}`);
      }
    }
  }
  for (const [title, titleBox] of boundaryTitleBoxes) {
    for (const [label, labelBox] of labelBoxes) {
      if (boxDistance(titleBox, labelBox) === 0) {
        failures.push(`${title}: boundary-title overlaps label ${label}`);
      }
    }
  }
  return {boundaryTitleMeasurements, failures, nodeMeasurements, relationMeasurements, scale};
}

function mutateGroup(svg, cellId, mutation) {
  const escaped = cellId.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const pattern = new RegExp(`(<g data-cell-id="${escaped}"[^>]*)(>)`, 'u');
  assert.match(svg, pattern, `mutation group ${cellId}`);
  return svg.replace(pattern, (_, start, end) => `${mutation(start)}${end}`);
}

test('production incident response agent diagram enforces measured geometry for all nodes, relationships, and boundaries', () => {
  const drawio = readFileSync(drawioPath, 'utf8');
  const svg = readFileSync(svgPath, 'utf8');
  const audit = validateGeometry(drawio, svg);
  if (process.env.REPORT_PRODUCTION_INCIDENT_RESPONSE_AGENT_GEOMETRY === '1') {
    console.log(JSON.stringify(audit));
  }
  assert.deepEqual(audit.failures, []);
});

test('production incident response geometry rejects six real clearance mutants', () => {
  const drawio = readFileSync(drawioPath, 'utf8');
  const svg = readFileSync(svgPath, 'utf8');
  const {boundaryShapes, byValue, nodeShapes, relationEdges} = cellInventory(parseXml(drawio, drawioPath).root);

  const movedHypothesis = mutateGroup(svg, nodeShapes.get('Hypothesis Ledger'), (start) => `${start} transform="translate(0 90)"`);
  assert.ok(validateGeometry(drawio, movedHypothesis).failures.some((failure) => failure.startsWith('Hypothesis Ledger: node clearance')));

  const labelId = byValue.get('authority result').attributes.get('id');
  const nearArrow = mutateGroup(svg, labelId, (start) => `${start} transform="translate(0 -220)"`);
  assert.ok(validateGeometry(drawio, nearArrow).failures.some((failure) => failure.startsWith('authority result: arrow ')));

  const foreignEdgeId = relationEdges.get('rollback request');
  const foreignCrossing = mutateGroup(svg, foreignEdgeId, (start) => `${start} transform="translate(900 350)"`);
  assert.ok(validateGeometry(drawio, foreignCrossing).failures.some((failure) => (
    failure.startsWith(`recovery confirmed: connector ${foreignEdgeId} clearance`)
  )));

  const backgroundId = byValue.get('uncertainty / manual').attributes.get('id');
  const escaped = backgroundId.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const backgroundPattern = new RegExp(`(<g data-cell-id="${escaped}"><g><rect[^>]*width=")[^"]*("[^>]*fill=")none("[^>]*>)`, 'u');
  assert.match(svg, backgroundPattern, 'transparent rendered label background mutation target');
  const opaqueTruncation = svg.replace(backgroundPattern, '$1120$2#ffffff$3');
  assert.ok(validateGeometry(drawio, opaqueTruncation).failures.includes('uncertainty / manual: opaque label background'));

  const serviceBoundaryId = boundaryShapes[3];
  const boundaryCrossing = mutateGroup(svg, serviceBoundaryId, (start) => `${start} transform="translate(-280 -180)"`);
  assert.ok(validateGeometry(drawio, boundaryCrossing).failures.some((failure) => (
    failure.startsWith(`verify indicators: boundary ${serviceBoundaryId} clearance`)
  )));

  const severityEdgeId = relationEdges.get('severity / route');
  const boundaryTitleCrossing = mutateGroup(svg, severityEdgeId, (start) => `${start} transform="translate(-220 -330)"`);
  assert.ok(validateGeometry(drawio, boundaryTitleCrossing).failures.some((failure) => (
    failure.startsWith(`Read-only control: boundary-title connector ${severityEdgeId} clearance`)
  )));
});
