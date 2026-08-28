import {parseXml, xmlElements} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/xml-visible-copy.mjs';
import {SVG_NS, fail, number, parsePath, xmlText} from './agt-p-08-diagram-model.mjs';

const INHERITED = new Set([
  'color', 'fill', 'fill-opacity', 'font-family', 'font-size', 'font-style', 'font-weight',
  'marker-end', 'marker-mid', 'marker-start', 'stroke', 'stroke-dasharray', 'stroke-linecap',
  'stroke-linejoin', 'stroke-opacity', 'stroke-width', 'text-anchor', 'visibility',
]);
const INITIAL = new Map([
  ['clip-path', 'none'], ['display', 'inline'], ['fill', 'black'], ['fill-opacity', '1'],
  ['font-size', '16'], ['marker-end', 'none'], ['opacity', '1'], ['overflow', 'visible'],
  ['stroke', 'none'], ['stroke-dasharray', 'none'], ['stroke-opacity', '1'],
  ['stroke-width', '1'], ['text-anchor', 'start'], ['vector-effect', 'none'], ['visibility', 'visible'],
]);
const identity = Object.freeze([1, 0, 0, 1, 0, 0]);

const declarations = (source = '') => {
  const result = new Map();
  for (const [order, declaration] of source.split(';').entries()) {
    const separator = declaration.indexOf(':');
    if (separator < 0) continue;
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const raw = declaration.slice(separator + 1).trim();
    if (!property || !raw) continue;
    const important = /\s*!important\s*$/iu.test(raw);
    const candidate = {important, order, value: raw.replace(/\s*!important\s*$/iu, '').trim()};
    const previous = result.get(property);
    if (!previous || candidate.important || !previous.important) result.set(property, candidate);
  }
  return result;
};

const specificity = (selector) => [
  (selector.match(/#[\w-]+/gu) ?? []).length,
  (selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/gu) ?? []).length,
  (selector.match(/(?:^|[\s>])([A-Za-z][\w-]*)/gu) ?? []).length,
];
const compareSpecificity = (left, right) => left[0] - right[0] || left[1] - right[1] || left[2] - right[2];

const simpleSelectorMatches = (element, selector) => {
  const simple = selector.trim();
  if (!simple || /[+~>\s]/u.test(simple)) return false;
  if (simple.includes(':root') && element.localName !== 'svg') return false;
  const withoutRoot = simple.replace(':root', '');
  const id = withoutRoot.match(/#([\w-]+)/u)?.[1];
  const tag = withoutRoot.match(/^[A-Za-z][\w-]*/u)?.[0];
  const classes = [...withoutRoot.matchAll(/\.([\w-]+)/gu)].map((match) => match[1]);
  const attributes = [...withoutRoot.matchAll(/\[([\w:-]+)(?:\s*=\s*["']?([^\]"']+)["']?)?\]/gu)];
  return (!tag || element.localName === tag)
    && (!id || element.attributes.get('id') === id)
    && classes.every((name) => (element.attributes.get('class') ?? '').split(/\s+/u).includes(name))
    && attributes.every(([, name, value]) => element.attributes.has(name)
      && (value === undefined || element.attributes.get(name) === value.trim()));
};

const selectorMatches = (element, selector, parents) => {
  const parts = selector.trim().replace(/\s*>\s*/gu, ' > ').split(/\s+/u).filter(Boolean);
  let candidate = element;
  let cursor = parts.length - 1;
  if (!simpleSelectorMatches(candidate, parts[cursor])) return false;
  cursor -= 1;
  while (cursor >= 0) {
    if (parts[cursor] === '>') {
      candidate = parents.get(candidate);
      if (!candidate || cursor === 0 || !simpleSelectorMatches(candidate, parts[cursor - 1])) return false;
      cursor -= 2;
    } else {
      candidate = parents.get(candidate);
      while (candidate && !simpleSelectorMatches(candidate, parts[cursor])) candidate = parents.get(candidate);
      if (!candidate) return false;
      cursor -= 1;
    }
  }
  return true;
};

const buildParents = (root) => {
  const parents = new Map();
  const elements = [];
  const visit = (element) => {
    elements.push(element);
    for (const child of element.children) {
      parents.set(child, element);
      visit(child);
    }
  };
  visit(root);
  return {elements, parents};
};

const stylesheetRules = (root) => {
  const rules = [];
  let order = 0;
  for (const style of xmlElements(root, 'style', SVG_NS)) {
    let sheet = xmlText(style).replace(/\/\*[\s\S]*?\*\//gu, '').trim();
    const supported = sheet.match(/^@supports\s*\([^{}]*\)\s*\{([\s\S]*)\}\s*$/u);
    if (supported) sheet = supported[1];
    for (const match of sheet.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
      for (const selector of match[1].split(',').map((item) => item.trim()).filter(Boolean)) {
        rules.push({declarations: declarations(match[2]), order: order++, selector, specificity: specificity(selector)});
      }
    }
    if (sheet.replace(/([^{}]+)\{([^{}]*)\}/gu, '').trim()) fail('unsupported SVG stylesheet syntax');
  }
  return rules;
};

const multiply = (left, right) => [
  left[0] * right[0] + left[2] * right[1],
  left[1] * right[0] + left[3] * right[1],
  left[0] * right[2] + left[2] * right[3],
  left[1] * right[2] + left[3] * right[3],
  left[0] * right[4] + left[2] * right[5] + left[4],
  left[1] * right[4] + left[3] * right[5] + left[5],
];
const applyMatrix = (matrix, [x, y]) => [
  matrix[0] * x + matrix[2] * y + matrix[4],
  matrix[1] * x + matrix[3] * y + matrix[5],
];
const translate = (x, y = 0) => [1, 0, 0, 1, x, y];

const transformMatrix = (value = '', label = 'transform') => {
  let matrix = [...identity];
  let cursor = 0;
  for (const match of value.matchAll(/([A-Za-z]+)\s*\(([^)]*)\)/gu)) {
    if (value.slice(cursor, match.index).trim().replaceAll(',', '')) fail(`${label} has unsupported transform syntax`);
    cursor = match.index + match[0].length;
    const values = match[2].trim().split(/[\s,]+/u).filter(Boolean).map((item) => number(item, label));
    let operation;
    if (match[1] === 'matrix' && values.length === 6) operation = values;
    else if (match[1] === 'translate' && [1, 2].includes(values.length)) operation = translate(values[0], values[1] ?? 0);
    else if (match[1] === 'scale' && [1, 2].includes(values.length)) operation = [values[0], 0, 0, values[1] ?? values[0], 0, 0];
    else if (match[1] === 'rotate' && [1, 3].includes(values.length)) {
      const radians = values[0] * Math.PI / 180;
      const rotation = [Math.cos(radians), Math.sin(radians), -Math.sin(radians), Math.cos(radians), 0, 0];
      operation = values.length === 1 ? rotation : multiply(translate(values[1], values[2]), multiply(rotation, translate(-values[1], -values[2])));
    } else if (match[1] === 'skewX' && values.length === 1) operation = [1, 0, Math.tan(values[0] * Math.PI / 180), 1, 0, 0];
    else if (match[1] === 'skewY' && values.length === 1) operation = [1, Math.tan(values[0] * Math.PI / 180), 0, 1, 0, 0];
    else fail(`${label} has unsupported ${match[1]} transform`);
    matrix = multiply(matrix, operation);
  }
  if (value.slice(cursor).trim()) fail(`${label} has trailing transform syntax`);
  return matrix;
};

const length = (value, label) => {
  const match = String(value ?? '').trim().match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))(?:px)?$/u);
  if (!match) fail(`${label} must be a user-space length`);
  return number(match[1], label);
};
const opacity = (value, label) => {
  const text = String(value ?? '').trim();
  const result = text.endsWith('%') ? number(text.slice(0, -1), label) / 100 : number(text, label);
  if (result < 0 || result > 1) fail(`${label} must be between zero and one`);
  return result;
};
const boxFromPoints = (points, expansion = 0) => ({
  bottom: Math.max(...points.map(([, y]) => y)) + expansion,
  left: Math.min(...points.map(([x]) => x)) - expansion,
  right: Math.max(...points.map(([x]) => x)) + expansion,
  top: Math.min(...points.map(([, y]) => y)) - expansion,
});
const uniformScale = (matrix, label) => {
  const horizontal = Math.hypot(matrix[0], matrix[1]);
  const vertical = Math.hypot(matrix[2], matrix[3]);
  const orthogonality = matrix[0] * matrix[2] + matrix[1] * matrix[3];
  const determinant = matrix[0] * matrix[3] - matrix[1] * matrix[2];
  if (horizontal <= 0 || vertical <= 0 || determinant <= 0
    || Math.abs(horizontal - vertical) > 1e-9 || Math.abs(orthogonality) > 1e-9) {
    fail(`${label} must use a non-reflecting uniform rendered scale`);
  }
  return horizontal;
};
const lightColor = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  const selected = normalized.match(/^light-dark\(\s*(rgb\([^)]+\)|#[0-9a-f]{3,8})\s*,/u)?.[1] ?? normalized;
  const rgb = selected.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/u);
  if (!rgb) return selected;
  return `#${rgb.slice(1).map((item) => Number(item).toString(16).padStart(2, '0')).join('')}`;
};

export function parseSvgRenderedModel(source, file = '<svg>') {
  const root = parseXml(source, file).root;
  if (root.localName !== 'svg' || root.namespace !== SVG_NS) fail(`${file} root must be SVG`);
  const {elements, parents} = buildParents(root);
  const rules = stylesheetRules(root);
  const ownCache = new Map();
  const effectiveCache = new Map();
  const matrixCache = new Map();

  const own = (element, property) => {
    let values = ownCache.get(element);
    if (!values) { values = new Map(); ownCache.set(element, values); }
    if (values.has(property)) return values.get(property);
    let winner = element.attributes.has(property)
      ? {order: -1, specificity: [0, 0, 0], tier: 0, value: element.attributes.get(property)}
      : undefined;
    for (const rule of rules) {
      const declaration = rule.declarations.get(property);
      if (!declaration || !selectorMatches(element, rule.selector, parents)) continue;
      const candidate = {order: rule.order, specificity: rule.specificity, tier: declaration.important ? 3 : 1, value: declaration.value};
      if (!winner || candidate.tier > winner.tier || candidate.tier === winner.tier
        && (compareSpecificity(candidate.specificity, winner.specificity) > 0
          || compareSpecificity(candidate.specificity, winner.specificity) === 0 && candidate.order >= winner.order)) winner = candidate;
    }
    const inline = declarations(element.attributes.get('style')).get(property);
    if (inline) {
      const candidate = {order: Number.MAX_SAFE_INTEGER, specificity: [1, 0, 0], tier: inline.important ? 4 : 2, value: inline.value};
      if (!winner || candidate.tier >= winner.tier) winner = candidate;
    }
    values.set(property, winner?.value);
    return winner?.value;
  };

  const effective = (element, property) => {
    let values = effectiveCache.get(element);
    if (!values) { values = new Map(); effectiveCache.set(element, values); }
    if (values.has(property)) return values.get(property);
    const initial = INITIAL.get(property);
    const ownValue = own(element, property)?.trim();
    let result;
    if (ownValue === 'inherit' || ownValue === 'unset' && INHERITED.has(property)
      || ownValue === undefined && INHERITED.has(property)) {
      result = parents.has(element) ? effective(parents.get(element), property) : initial;
    } else if (ownValue === 'initial' || ownValue === 'unset' || ownValue === undefined) result = initial;
    else if (ownValue === 'revert' || ownValue === 'revert-layer') fail(`${file}:${element.line} unsupported CSS-wide ${ownValue}`);
    else result = ownValue;
    values.set(property, result);
    return result;
  };

  const state = (element) => {
    const ancestors = [];
    for (let current = element; current; current = parents.get(current)) ancestors.unshift(current);
    let hidden = false;
    let compositeOpacity = 1;
    for (const ancestor of ancestors) {
      hidden ||= effective(ancestor, 'display')?.toLowerCase() === 'none'
        || ancestor.attributes.get('aria-hidden')?.trim().toLowerCase() === 'true';
      compositeOpacity *= opacity(effective(ancestor, 'opacity') ?? '1', `${file}:${ancestor.line} opacity`);
    }
    const visibility = effective(element, 'visibility')?.toLowerCase();
    hidden ||= visibility === 'hidden' || visibility === 'collapse' || compositeOpacity === 0;
    const fillOpacity = opacity(effective(element, 'fill-opacity') ?? '1', `${file}:${element.line} fill-opacity`) * compositeOpacity;
    const strokeOpacity = opacity(effective(element, 'stroke-opacity') ?? '1', `${file}:${element.line} stroke-opacity`) * compositeOpacity;
    const fill = lightColor(effective(element, 'fill'));
    const stroke = lightColor(effective(element, 'stroke'));
    return {
      compositeOpacity, fill, fillOpacity, hidden,
      paintedFill: !hidden && fill !== 'none' && fillOpacity > 0,
      paintedStroke: !hidden && stroke !== 'none' && strokeOpacity > 0,
      stroke, strokeOpacity, visibility,
    };
  };

  const matrix = (element, stopExclusive) => {
    if (!stopExclusive && matrixCache.has(element)) return matrixCache.get(element);
    const chain = [];
    for (let current = element; current && current !== stopExclusive; current = parents.get(current)) chain.unshift(current);
    let result = [...identity];
    for (const current of chain) result = multiply(result, transformMatrix(current.attributes.get('transform'), `${file}:${current.line}`));
    if (!stopExclusive) matrixCache.set(element, result);
    return result;
  };

  const rectBox = (element, label, {paint = true} = {}) => {
    const x = length(element.attributes.get('x'), `${label}.x`);
    const y = length(element.attributes.get('y'), `${label}.y`);
    const width = length(element.attributes.get('width'), `${label}.width`);
    const height = length(element.attributes.get('height'), `${label}.height`);
    if (width < 0 || height < 0) fail(`${label} rectangle dimensions must be nonnegative`);
    const points = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]].map((point) => applyMatrix(matrix(element), point));
    const rendered = state(element);
    if (paint && !rendered.paintedFill && !rendered.paintedStroke) fail(`${label} rectangle is not painted`);
    const vectorEffect = effective(element, 'vector-effect');
    if (!['none', 'non-scaling-stroke'].includes(vectorEffect)) fail(`${label} unsupported vector-effect`);
    const strokeScale = vectorEffect === 'non-scaling-stroke' ? 1 : uniformScale(matrix(element), `${label}.stroke-transform`);
    const strokeWidth = rendered.paintedStroke ? length(effective(element, 'stroke-width'), `${label}.stroke-width`) * strokeScale : 0;
    return {...boxFromPoints(points, strokeWidth / 2), element, geometry: boxFromPoints(points), height, points, state: rendered, strokeWidth, width, x, y};
  };

  const pathGeometry = (element, label, {relativeTo} = {}) => {
    const points = parsePath(element.attributes.get('d') ?? '', label).map((point) => applyMatrix(matrix(element, relativeTo), point));
    const rendered = state(element);
    if (!rendered.paintedFill && !rendered.paintedStroke) fail(`${label} path is not painted`);
    const vectorEffect = effective(element, 'vector-effect');
    if (!['none', 'non-scaling-stroke'].includes(vectorEffect)) fail(`${label} unsupported vector-effect`);
    const strokeScale = vectorEffect === 'non-scaling-stroke' ? 1 : uniformScale(matrix(element, relativeTo), `${label}.stroke-transform`);
    const strokeWidth = rendered.paintedStroke ? length(effective(element, 'stroke-width'), `${label}.stroke-width`) * strokeScale : 0;
    return {...boxFromPoints(points, strokeWidth / 2), element, points, state: rendered, strokeWidth};
  };

  const textBox = (element, label) => {
    const tspans = element.children.filter((child) => child.namespace === SVG_NS && child.localName === 'tspan');
    if (tspans.length) {
      const boxes = tspans.map((item, index) => textBox(item, `${label}.line${index + 1}`));
      return {
        bottom: Math.max(...boxes.map((box) => box.bottom)), font: boxes[0].font,
        left: Math.min(...boxes.map((box) => box.left)), right: Math.max(...boxes.map((box) => box.right)),
        top: Math.min(...boxes.map((box) => box.top)),
      };
    }
    const rendered = state(element);
    if (rendered.hidden || !rendered.paintedFill && !rendered.paintedStroke) fail(`${label} text is not visibly painted`);
    const x = length(element.attributes.get('x'), `${label}.x`);
    const y = length(element.attributes.get('y'), `${label}.y`);
    const localFont = length(effective(element, 'font-size'), `${label}.font-size`);
    const font = localFont * uniformScale(matrix(element), `${label}.font-transform`);
    const measuredText = xmlText(element);
    const textLength = element.attributes.has('textLength')
      ? length(element.attributes.get('textLength'), `${label}.textLength`)
      : [...measuredText].reduce((total, character) => total + (/^[\u0000-\u00ff]$/u.test(character) ? 0.64 : 1), 0) * localFont;
    const anchor = effective(element, 'text-anchor') ?? 'start';
    if (!['start', 'middle', 'end'].includes(anchor)) fail(`${label} unsupported text-anchor`);
    const left = anchor === 'middle' ? x - textLength / 2 : anchor === 'end' ? x - textLength : x;
    const corners = [[left, y - localFont * 0.9], [left + textLength, y - localFont * 0.9], [left + textLength, y + localFont * 0.25], [left, y + localFont * 0.25]]
      .map((point) => applyMatrix(matrix(element), point));
    return {...boxFromPoints(corners), font};
  };

  return {effective, elements, file, matrix, parents, pathGeometry, rectBox, root, state, textBox};
}

export const parseViewBox = (value, label) => {
  const values = String(value ?? '').trim().split(/[\s,]+/u).filter(Boolean).map((item) => number(item, label));
  if (values.length !== 4 || values[2] <= 0 || values[3] <= 0) fail(`${label} must contain four values with positive dimensions`);
  return values;
};

export const renderedMarker = (context, marker, endpoint, previous, expectedColor, label) => {
  if (marker.attributes.get('markerUnits') !== 'userSpaceOnUse' || marker.attributes.get('orient') !== 'auto') fail(`${label} marker units/orientation drift`);
  if (marker.attributes.has('transform')) fail(`${label} marker transform drift`);
  const viewBox = parseViewBox(marker.attributes.get('viewBox'), `${label}.viewBox`);
  const [minX, minY, viewWidth, viewHeight] = viewBox;
  const markerWidth = length(marker.attributes.get('markerWidth'), `${label}.markerWidth`);
  const markerHeight = length(marker.attributes.get('markerHeight'), `${label}.markerHeight`);
  const refX = length(marker.attributes.get('refX'), `${label}.refX`);
  const refY = length(marker.attributes.get('refY'), `${label}.refY`);
  if (markerWidth !== viewWidth || markerHeight !== viewHeight) fail(`${label} marker viewport must preserve one-to-one block geometry`);
  if (refX !== minX + viewWidth * 0.875 || refY !== minY + viewHeight / 2) fail(`${label} marker reference drift`);
  if ((marker.attributes.get('preserveAspectRatio') ?? 'xMidYMid meet') !== 'xMidYMid meet') fail(`${label} marker aspect-ratio drift`);
  const paths = marker.children.filter((child) => child.localName === 'path' && child.namespace === SVG_NS);
  if (paths.length !== 1) fail(`${label} marker must contain exactly one direct painted path`);
  const path = context.pathGeometry(paths[0], `${label}.path`, {relativeTo: marker});
  if (path.state.fill !== expectedColor.toLowerCase() || path.state.fillOpacity !== 1 || path.state.paintedStroke) fail(`${label} marker paint drift`);
  if (!/\bZ\s*$/u.test(paths[0].attributes.get('d') ?? '') || path.points.length !== 3) fail(`${label} marker must be a closed triangle`);
  const expected = [[minX, minY], [minX + viewWidth, minY + viewHeight / 2], [minX, minY + viewHeight]];
  const sorted = (points) => [...points].sort(([ax, ay], [bx, by]) => ax - bx || ay - by);
  if (JSON.stringify(sorted(path.points)) !== JSON.stringify(sorted(expected))) fail(`${label} marker block path geometry drift`);
  const dx = endpoint[0] - previous[0];
  const dy = endpoint[1] - previous[1];
  const terminalLength = Math.hypot(dx, dy);
  if (terminalLength === 0) fail(`${label} marker terminal direction is zero`);
  const unit = [dx / terminalLength, dy / terminalLength];
  const normal = [-unit[1], unit[0]];
  const transform = ([x, y]) => {
    const localX = (x - refX) * markerWidth / viewWidth;
    const localY = (y - refY) * markerHeight / viewHeight;
    return [endpoint[0] + unit[0] * localX + normal[0] * localY, endpoint[1] + unit[1] * localX + normal[1] * localY];
  };
  const painted = path.points.map(transform);
  const tipIndex = path.points.findIndex(([x, y]) => x === minX + viewWidth && y === minY + viewHeight / 2);
  const base = path.points.filter((_, index) => index !== tipIndex).map(transform);
  const tip = painted[tipIndex];
  const baseMidpoint = [(base[0][0] + base[1][0]) / 2, (base[0][1] + base[1][1]) / 2];
  const direction = [tip[0] - baseMidpoint[0], tip[1] - baseMidpoint[1]];
  if ((direction[0] * unit[0] + direction[1] * unit[1]) / Math.hypot(...direction) < 0.999) fail(`${label} marker points away from its final segment`);
  return {baseMidpoint, box: boxFromPoints(painted, path.strokeWidth / 2), points: painted, reference: endpoint, tip};
};

export const renderedColor = lightColor;
export const renderedCssDeclarations = declarations;
export const renderedLength = length;
export const transformPoint = applyMatrix;
