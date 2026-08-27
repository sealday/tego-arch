import {createHash} from 'node:crypto';

import {xmlElements} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/xml-visible-copy.mjs';
import {SVG_NS, fail, number, xmlText} from './agt-p-08-diagram-model.mjs';

const XHTML_NS = 'http://www.w3.org/1999/xhtml';
const EXTENSIBILITY = 'http://www.w3.org/TR/SVG11/feature#Extensibility';
const ACCESSIBLE_TITLE = 'Durable agent recovery and human approval control flow';
const ACCESSIBLE_DESCRIPTION = 'The durable control plane checkpoints execution, waits for approval, resumes through a sandbox, reconciles external business truth, recovers safely, and sends rejection, timeout, or unknown effects to a manual terminal.';
const FALLBACKS = new Map(Object.entries({
  'Durable control plane|23|24.5': '10f759f292bac7b40fba45ea7504ca45c474440490377b7743b6194bf888aa41',
  'External business truth|923|24.5': '2c60095547246e218635d34ac51b3c1f958acc75a49892fd0a060ce9c4f6e690',
  'Durable control store|332|82.5': 'a3b971698ab47ddac536cca9688a6c3ec0013da55d896ddc862192c88516499e',
  'Control state + checkpoint refs|352|107.5': '9f1894e6909d352988c7c4a38023851063280805a7e5fa7068d7a0385567b9c4',
  'Checkpoint|52|262.5': '39b430d65a833be0c844487eca0a11fea61e447d4872ecbdfbdfd8d8f7642104',
  'Schema + version + operation ID|72|287.5': '1e4843202ad426b0025ab5f7f0dc30d2893f4735409ea328d11efbe9545b0915',
  'Approval required|372|262.5': '7e4ef5708a1fccc8ff495abd54e045ab51e454c4de01dbc39fb3adbb1f5f8989',
  'Context + authority + deadline|392|287.5': '74539da6c9242ae028e747795cf21a27468cb5b3a8010af7907a8f47aa391da4',
  'Sandbox / Tool|52|492.5': '16579e3576bb7186ffce4cbe48561a771cf2c2be7353b949f4bb905651310db8',
  'Scoped, idempotent action|72|517.5': '5b1f92e0f9aecc59ac242733a5e1d7494898b6ed8fba3cf2ea63426fa616b4a7',
  'Authority system|992|262.5': 'c3d177ba38b4389412009fc864125a5ab9601ca6b7fe44d18ef9c6ba5f6a2d13',
  'External business truth|1012|299.5': '33f7a296b4a8a36bdceb10a51dab3aa8a4afa24892a792b2a42ab22841025944',
  'Result reconciliation|372|492.5': '4ee4d88b58a9d666bf77583e3e9f3c67cc35d8d02f078cd7d8c00e98cecb36e0',
  'Read back before retry|392|529.5': '6caaf1c6e768fba9de13bb427584556c020dec30397fb1b7627ee371a08f84a5',
  'Completed|372|712.5': '1154ae6498af30f0cfaf156e8af474de05975dab8c724aad991ac46a973d7ac8',
  'Verified durable terminal|392|749.5': '32a8ad1d2034fc75d4e13cc2835e9334bd3cf826bc26ce07730d13b20a0020cb',
  'Manual terminal|992|712.5': 'd5a975b950579700353e5c39303a16285356807d4e491d5c9bfc9913e12aeaa0',
  'Reject, timeout, or unknown|1012|749.5': 'a6753993b59f2f7ac85c02ecf5c2f0a7cc5cb4346bcfc17e895eb081c027afd1',
  'Resume|172|376.5': '7b16b1df7dec7b91d8cbd5fa9525784c03ce86fdac4689405750a9bdd6c7cd39',
  'Reject / timeout|912|425': 'ce54634fe9999d7935e720884098e128737780c782989fa4ff27d2efe2b564b6',
  'Authoritative read|1152|365': '3593d23f8dbc1eb473bae51d2922243ce1d834187ddf5c9450bceaa97c6c4669',
  'Recovery / replay|482|360': 'b5f093239cbb8dc3825e9fd98f124b008dbad6d5710f61fe82f64a89be19805f',
  'Unknown effect|1152|485': 'f6e21596cee057175d461c8aafff9b5223e0954678c88ab92f2b8a9827643fa3',
}));
const DARK_COLORS = new Map(Object.entries({
  '#f7f3ff': 'rgb(28, 25, 35)', '#f2fbf6': 'rgb(17, 25, 20)',
  '#ede8ff': 'rgb(38, 33, 53)', '#ffffff': 'rgb(18, 18, 18)',
  '#fff7e6': 'rgb(31, 24, 10)', '#e8f3ff': 'rgb(21, 31, 41)',
  '#e6f7ed': 'rgb(18, 32, 24)', '#fff0f0': 'rgb(38, 25, 25)',
  '#6b4eff': 'rgb(162, 137, 255)', '#227a4b': 'rgb(94, 170, 129)',
  '#5b3fd6': 'rgb(178, 154, 255)', '#334155': 'rgb(172, 184, 201)',
  '#b66a00': 'rgb(197, 132, 41)', '#2365a7': 'rgb(109, 166, 222)',
  '#b4232c': 'rgb(255, 153, 161)',
}));

const attrs = (element) => Object.fromEntries(element.attributes);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sortedObject = (value) => Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
const expectAttributes = (element, expected, label) => {
  if (!same(sortedObject(attrs(element)), sortedObject(expected))) fail(`${label} attribute capability drift`);
};
const expectAttributeNames = (element, expected, label) => {
  const actual = [...element.attributes.keys()].sort();
  if (!same(actual, [...expected].sort())) fail(`${label} attribute allowlist drift`);
};
const direct = (element, localName, namespace = SVG_NS) => element.children
  .filter((child) => child.localName === localName && child.namespace === namespace);
const uniqueByAttribute = (context, localName, name, value) => {
  const matches = context.elements.filter((element) => element.namespace === SVG_NS
    && element.localName === localName && element.attributes.get(name) === value);
  if (matches.length !== 1) fail(`${localName}[${name}=${value}] capability inventory drift`);
  return matches[0];
};
const compact = (value) => value.replace(/\s+/gu, ' ').trim();
const styleNumber = (item, name, fallback = '0') => number(item.style.get(name) ?? fallback, `${item.id}.${name}`);
const markerId = (edge) => `arrow-${edge.id}`;
const linePath = (points) => points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
const nodeTitleLength = (item) => Math.min(item.geometry.width - 64, item.value.length * 14);
const captionLength = (item) => Math.min(item.geometry.width - 24, item.value.length * 10);
const edgeLabelLength = (item) => item.geometry.width - 20;
const rgb = (hex, label) => {
  const match = String(hex).toLowerCase().match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/u);
  if (!match) fail(`${label} unsupported adaptive color`);
  return `rgb(${parseInt(match[1], 16)}, ${parseInt(match[2], 16)}, ${parseInt(match[3], 16)})`;
};
const adaptive = (hex, label) => {
  const dark = DARK_COLORS.get(String(hex).toLowerCase());
  if (!dark) fail(`${label} unregistered dark-mode color`);
  return `light-dark(${rgb(hex, label)}, ${dark})`;
};

const strictDeclarations = (source, label) => {
  const result = new Map();
  for (const declaration of String(source ?? '').split(';')) {
    if (!declaration.trim()) continue;
    const separator = declaration.indexOf(':');
    if (separator < 1) fail(`${label} malformed inline property`);
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const value = declaration.slice(separator + 1).trim();
    if (!property || !value || result.has(property) || /!important/iu.test(value)) fail(`${label} unsupported inline declaration`);
    result.set(property, value);
  }
  return result;
};
const expectDeclarations = (element, expected, label) => {
  const actual = strictDeclarations(element.attributes.get('style'), label);
  if (!same([...actual], Object.entries(expected))) fail(`${label} inline-property/value allowlist drift`);
};

export function assertPublishedCapabilityAllowlist(context, model, drawioSha256) {
  const {root} = context;
  const rawSha = root.attributes.get('data-raw-export-sha256');
  if (!/^[a-f0-9]{64}$/u.test(rawSha ?? '')) fail('published raw-export hash capability drift');
  expectAttributes(root, {
    xmlns: SVG_NS, viewBox: '0 0 1400 900', role: 'img',
    'aria-labelledby': 'agt-p-08-title agt-p-08-desc',
    'data-drawio-sha256': drawioSha256, 'data-raw-export-sha256': rawSha,
  }, 'published root');
  if (!same(root.children.map((item) => item.localName), ['title', 'desc', 'defs', 'rect', 'rect', 'g'])) fail('published root child order drift');
  const title = direct(root, 'title')[0];
  const description = direct(root, 'desc')[0];
  expectAttributes(title, {id: 'agt-p-08-title'}, 'published title');
  expectAttributes(description, {id: 'agt-p-08-desc'}, 'published description');
  if (xmlText(title) !== ACCESSIBLE_TITLE || xmlText(description) !== ACCESSIBLE_DESCRIPTION) fail('published accessibility copy drift');
  const definitions = direct(root, 'defs')[0];
  expectAttributes(definitions, {}, 'published defs');
  if (!same(definitions.children.map((item) => item.localName), model.edges.map(() => 'marker'))) fail('published defs inventory drift');

  for (const edge of model.edges) {
    const marker = uniqueByAttribute(context, 'marker', 'id', markerId(edge));
    expectAttributes(marker, {
      id: markerId(edge), markerUnits: 'userSpaceOnUse', viewBox: '0 0 16 16',
      markerWidth: '16', markerHeight: '16', refX: '14', refY: '8', orient: 'auto',
    }, `${edge.id} marker`);
    const markerPath = direct(marker, 'path')[0];
    if (direct(marker, 'path').length !== 1) fail(`${edge.id} marker path inventory drift`);
    expectAttributes(markerPath, {d: 'M 0 0 L 16 8 L 0 16 Z', fill: edge.style.get('strokeColor')}, `${edge.id} marker path`);
    const published = uniqueByAttribute(context, 'path', 'data-edge-id', edge.id);
    const expected = {
      'data-edge-id': edge.id, 'data-source': edge.sourceId, 'data-target': edge.targetId,
      d: linePath(edge.route), stroke: edge.style.get('strokeColor'),
      'marker-end': `url(#${markerId(edge)})`,
    };
    if (edge.style.get('dashed') === '1') expected['stroke-dasharray'] = edge.style.get('dashPattern');
    expectAttributes(published, expected, `${edge.id} published path`);
  }

  for (const region of model.regions) {
    const rectangle = uniqueByAttribute(context, 'rect', 'data-region-id', region.id);
    expectAttributes(rectangle, {
      'data-region-id': region.id, x: String(region.geometry.x), y: String(region.geometry.y),
      width: String(region.geometry.width), height: String(region.geometry.height), rx: '24',
      fill: region.style.get('fillColor'), stroke: region.style.get('strokeColor'),
      'stroke-width': String(styleNumber(region, 'strokeWidth')),
      'stroke-dasharray': region.style.get('dashPattern'),
    }, `${region.id} published region`);
    const label = uniqueByAttribute(context, 'text', 'data-region-label-for', region.id);
    expectAttributes(label, {
      'data-region-label-for': region.id, x: String(region.geometry.x + 28), y: String(region.geometry.y + 42),
      'font-size': String(styleNumber(region, 'fontSize')), 'font-weight': '700', fill: '#17202A',
    }, `${region.id} published region label`);
    if (xmlText(label) !== region.value) fail(`${region.id} published region copy drift`);
  }

  for (const node of model.nodes) {
    const rectangle = uniqueByAttribute(context, 'rect', 'data-node-id', node.id);
    expectAttributes(rectangle, {
      'data-node-id': node.id, 'data-padding-horizontal-css': '16', 'data-padding-vertical-css': '14',
      x: String(node.geometry.x), y: String(node.geometry.y), width: String(node.geometry.width),
      height: String(node.geometry.height), rx: '20', fill: node.style.get('fillColor'),
      stroke: node.style.get('strokeColor'), 'stroke-width': String(styleNumber(node, 'strokeWidth')),
    }, `${node.id} published node`);
    const caption = model.captions.find((item) => item.nodeId === node.id);
    const wrapped = caption.geometry.width === 220 && caption.value.length > 25;
    const titleElement = uniqueByAttribute(context, 'text', 'data-title-for', node.id);
    expectAttributes(titleElement, {
      'data-title-for': node.id, x: String(node.geometry.x + node.geometry.width / 2),
      y: String(node.geometry.y + (wrapped ? 35 : 45)), 'font-size': String(styleNumber(node, 'fontSize')),
      'font-weight': '700', textLength: String(nodeTitleLength(node)), lengthAdjust: 'spacingAndGlyphs',
    }, `${node.id} published title`);
    if (xmlText(titleElement) !== node.value) fail(`${node.id} published title copy drift`);
    const captionElement = uniqueByAttribute(context, 'text', 'data-type-for', node.id);
    if (wrapped) {
      expectAttributes(captionElement, {
        'data-type-for': node.id, x: String(caption.geometry.x + caption.geometry.width / 2),
        y: String(caption.geometry.y + 5), 'font-size': String(styleNumber(caption, 'fontSize')),
      }, `${node.id} published wrapped caption`);
      const words = caption.value.split(' ');
      const split = Math.ceil(words.length / 2);
      const lines = [`${words.slice(0, split).join(' ')} `, words.slice(split).join(' ')];
      const tspans = direct(captionElement, 'tspan');
      if (tspans.length !== 2) fail(`${node.id} published tspan inventory drift`);
      for (let index = 0; index < 2; index += 1) {
        expectAttributes(tspans[index], {
          x: String(caption.geometry.x + caption.geometry.width / 2), y: String(caption.geometry.y + 5 + index * 18),
          textLength: String(Math.min(caption.geometry.width - 40, lines[index].length * 10)), lengthAdjust: 'spacingAndGlyphs',
        }, `${node.id} published tspan ${index + 1}`);
        if (xmlText(tspans[index]) !== lines[index]) fail(`${node.id} published tspan copy drift`);
      }
    } else {
      expectAttributes(captionElement, {
        'data-type-for': node.id, x: String(caption.geometry.x + caption.geometry.width / 2),
        y: String(caption.geometry.y + 20), 'font-size': String(styleNumber(caption, 'fontSize')),
        textLength: String(captionLength(caption)), lengthAdjust: 'spacingAndGlyphs',
      }, `${node.id} published caption`);
    }
    if (xmlText(captionElement) !== caption.value) fail(`${node.id} published caption copy drift`);
  }

  for (const label of model.edgeLabels) {
    const text = uniqueByAttribute(context, 'text', 'data-edge-label-for', label.edgeId);
    expectAttributes(text, {
      'data-edge-label-for': label.edgeId, 'data-stroke-clearance-css': '8',
      'data-arrow-clearance-css': '16', 'data-node-clearance-css': '12',
      x: String(label.geometry.x + label.geometry.width / 2),
      y: String(label.geometry.y + label.geometry.height * 0.75),
      'font-size': String(styleNumber(label, 'fontSize')), textLength: String(edgeLabelLength(label)),
      lengthAdjust: 'spacingAndGlyphs',
    }, `${label.edgeId} published label`);
    if (xmlText(text) !== label.value) fail(`${label.edgeId} published label copy drift`);
  }

  const groups = context.elements.filter((item) => item.namespace === SVG_NS && item.localName === 'g');
  const actualGroups = groups.map((group) => sortedObject(attrs(group)));
  const expectedGroups = [
    {'font-family': 'system-ui, sans-serif'},
    {fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-width': '4'},
    {fill: '#FFFFFF'}, {fill: '#17202A', 'text-anchor': 'middle'},
    {'font-weight': '650', fill: '#17202A', 'text-anchor': 'middle'},
  ].map(sortedObject);
  if (!same(actualGroups, expectedGroups)) fail('published group capability drift');
}

const expectedOuterStyle = (item, rectangle) => {
  const alignLeft = item.style.get('align') === 'left';
  const topAligned = item.style.get('verticalAlign') === 'top';
  const spacingLeft = number(item.style.get('spacingLeft') ?? '0', `${item.id}.spacingLeft`);
  const spacingTop = number(item.style.get('spacingTop') ?? '0', `${item.id}.spacingTop`);
  const x = number(rectangle.attributes.get('x'), `${item.id}.raw.x`);
  const y = number(rectangle.attributes.get('y'), `${item.id}.raw.y`);
  const width = number(rectangle.attributes.get('width'), `${item.id}.raw.width`);
  const height = number(rectangle.attributes.get('height'), `${item.id}.raw.height`);
  return {
    display: 'flex', 'align-items': `unsafe ${topAligned ? 'flex-start' : 'center'}`,
    'justify-content': `unsafe ${alignLeft ? 'flex-start' : 'center'}`,
    width: `${width - (alignLeft ? spacingLeft + 2 : 2)}px`, height: '1px',
    'padding-top': `${y + (topAligned ? spacingTop + 7 : height / 2)}px`,
    'margin-left': `${x + (alignLeft ? spacingLeft + 2 : 1)}px`,
  };
};

export function assertRawCapabilityAllowlist(context, model, groups, idMap) {
  const {root} = context;
  expectAttributeNames(root, ['xmlns', 'style', 'xmlns:xlink', 'version', 'width', 'height', 'viewBox', 'id', 'content'], 'raw root');
  if (root.attributes.get('xmlns') !== SVG_NS || root.attributes.get('xmlns:xlink') !== 'http://www.w3.org/1999/xlink'
    || root.attributes.get('version') !== '1.1') fail('raw root namespace/version capability drift');
  expectDeclarations(root, {
    background: '#ffffff', 'background-color': 'var(--ge-adaptive-bg, #ffffff)', 'color-scheme': 'light dark',
  }, 'raw root');
  const rootId = root.attributes.get('id');
  if (!/^ge-svg-[\w-]+$/u.test(rootId ?? '')) fail('raw root ID capability drift');
  const styles = context.elements.filter((item) => item.namespace === SVG_NS && item.localName === 'style');
  if (styles.length !== 1) fail('raw stylesheet inventory drift');
  expectAttributes(styles[0], {type: 'text/css'}, 'raw stylesheet');
  const canonicalStylesheet = `@supports (color: light-dark(#000, #fff)) { #${rootId} { --ge-adaptive-bg: light-dark(#ffffff, var(--ge-dark-color, #121212)); } }`;
  if (xmlText(styles[0]).trim() !== canonicalStylesheet) fail('raw stylesheet capability drift');
  if (!same(root.children.map((item) => item.localName), ['style', 'defs', 'rect', 'g'])) fail('raw root child order drift');
  expectAttributes(root.children[1], {}, 'raw defs');
  expectAttributes(root.children[2], {
    fill: '#ffffff', width: '100%', height: '100%', x: '0', y: '0',
    style: 'fill: var(--ge-adaptive-bg, #ffffff);',
  }, 'raw background');

  const elements = context.elements.filter((item) => item.namespace === SVG_NS);
  for (const element of elements) {
    if (element.localName === 'g') {
      const names = [...element.attributes.keys()].sort();
      if (![[], ['data-cell-id'], ['transform']].some((expected) => same(names, expected))) fail('raw group attribute allowlist drift');
    } else if (element.localName === 'foreignObject') {
      expectAttributes(element, {
        width: '100%', height: '100%', 'pointer-events': 'none',
        requiredFeatures: EXTENSIBILITY, style: 'overflow: visible; text-align: left;',
      }, 'raw foreignObject');
    } else if (element.localName === 'switch') expectAttributes(element, {}, 'raw switch');
    else if (element.localName === 'image') expectAttributeNames(element, ['x', 'y', 'width', 'height', 'xlink:href'], 'raw fallback image');
    else if (element.localName === 'path') {
      const allowed = ['d', 'fill', 'pointer-events', 'stroke', 'stroke-miterlimit', 'stroke-width', 'style'];
      if (element.attributes.has('stroke-dasharray')) allowed.push('stroke-dasharray');
      expectAttributeNames(element, allowed, 'raw path');
      const declarations = strictDeclarations(element.attributes.get('style'), 'raw path');
      const expectedProperties = element.attributes.get('fill') === 'none' ? ['stroke'] : ['fill', 'stroke'];
      if (!same([...declarations.keys()], expectedProperties)) fail('raw path inline-property allowlist drift');
    } else if (element.localName === 'rect') {
      const allowedSignatures = [
        ['fill', 'height', 'style', 'width', 'x', 'y'],
        ['fill', 'height', 'pointer-events', 'rx', 'ry', 'stroke', 'stroke-dasharray', 'stroke-width', 'style', 'width', 'x', 'y'],
        ['fill', 'height', 'pointer-events', 'rx', 'ry', 'stroke', 'stroke-width', 'style', 'width', 'x', 'y'],
        ['fill', 'height', 'pointer-events', 'stroke', 'width', 'x', 'y'],
        ['fill', 'height', 'pointer-events', 'stroke', 'style', 'width', 'x', 'y'],
      ];
      const names = [...element.attributes.keys()].sort();
      if (!allowedSignatures.some((expected) => same(names, expected))) fail('raw rect attribute allowlist drift');
      if (element.attributes.has('style')) {
        const properties = [...strictDeclarations(element.attributes.get('style'), 'raw rect').keys()];
        const expected = element.attributes.get('stroke') === 'none' || !element.attributes.has('stroke') ? ['fill'] : ['fill', 'stroke'];
        if (!same(properties, expected)) fail('raw rect inline-property allowlist drift');
      }
    } else if (element.localName === 'defs') expectAttributes(element, {}, 'raw defs');
  }
  const transforms = elements.filter((item) => item.attributes.has('transform'));
  if (transforms.length !== 10 || transforms.some((item) => item.localName !== 'g'
    || item.attributes.get('transform') !== 'translate(0.5,0.5)')) fail('raw transform allowlist drift');

  const visibleCells = [...model.regions, ...model.nodes, ...model.captions, ...model.edgeLabels];
  const fallbackKeys = new Set();
  for (const item of visibleCells) {
    const group = groups.get(idMap.get(item.id));
    const switches = xmlElements(group, 'switch', SVG_NS);
    if (switches.length !== 1 || !same(switches[0].children.map((child) => `${child.namespace}|${child.localName}`),
      [`${SVG_NS}|foreignObject`, `${SVG_NS}|image`])) fail(`${item.id} raw switch order drift`);
    const [foreignObject, image] = switches[0].children;
    const rectangle = xmlElements(group, 'rect', SVG_NS)[0];
    const fill = item.style.get('fillColor') ?? 'none';
    const stroke = item.style.get('strokeColor') ?? 'none';
    const rectangleExpected = {
      x: rectangle.attributes.get('x'), y: rectangle.attributes.get('y'),
      width: rectangle.attributes.get('width'), height: rectangle.attributes.get('height'),
      fill: fill.toLowerCase(), stroke: stroke.toLowerCase(), 'pointer-events': 'all',
    };
    if (fill !== 'none') {
      rectangleExpected.style = `fill: ${adaptive(fill, `${item.id}.fill`)};${stroke === 'none' ? '' : ` stroke: ${adaptive(stroke, `${item.id}.stroke`)};`}`;
    }
    if (stroke !== 'none') rectangleExpected['stroke-width'] = String(styleNumber(item, 'strokeWidth'));
    if (model.regions.some(({id}) => id === item.id) || model.nodes.some(({id}) => id === item.id)) {
      const radius = String(Math.min(
        number(rectangle.attributes.get('width'), `${item.id}.rectangle.width`),
        number(rectangle.attributes.get('height'), `${item.id}.rectangle.height`),
      ) * 0.15);
      rectangleExpected.rx = radius;
      rectangleExpected.ry = radius;
      if (model.regions.some(({id}) => id === item.id)) rectangleExpected['stroke-dasharray'] = '30 24';
    }
    expectAttributes(rectangle, rectangleExpected, `${item.id} raw rectangle`);
    const divs = xmlElements(foreignObject, 'div', XHTML_NS);
    if (divs.length !== 3 || foreignObject.children.length !== 1 || foreignObject.children[0] !== divs[0]
      || divs[0].children.length !== 1 || divs[0].children[0] !== divs[1]
      || divs[1].children.length !== 1 || divs[1].children[0] !== divs[2]) fail(`${item.id} raw XHTML hierarchy drift`);
    expectAttributeNames(divs[0], ['xmlns', 'style'], `${item.id} outer XHTML div`);
    if (divs[0].attributes.get('xmlns') !== XHTML_NS) fail(`${item.id} XHTML namespace drift`);
    expectAttributeNames(divs[1], ['style'], `${item.id} middle XHTML div`);
    expectAttributeNames(divs[2], ['style'], `${item.id} inner XHTML div`);
    const fontColor = item.style.get('fontColor') ?? '#000000';
    const align = item.style.get('align') ?? 'center';
    expectDeclarations(divs[0], expectedOuterStyle(item, rectangle), `${item.id} outer XHTML div`);
    expectDeclarations(divs[1], {
      'box-sizing': 'border-box', 'font-size': '0', 'text-align': align, color: fontColor,
    }, `${item.id} middle XHTML div`);
    const innerExpected = {
      display: 'inline-block', 'font-size': `${styleNumber(item, 'fontSize')}px`, 'font-family': 'Helvetica',
      color: `light-dark(${fontColor}, ${fontColor === '#000000' ? '#ffffff' : '#cdd4dd'})`,
      'line-height': '1.2', 'pointer-events': 'all',
    };
    if (item.style.get('fontStyle') === '1') innerExpected['font-weight'] = 'bold';
    innerExpected['white-space'] = 'normal';
    innerExpected['word-wrap'] = 'normal';
    expectDeclarations(divs[2], innerExpected, `${item.id} inner XHTML div`);
    const href = image.attributes.get('xlink:href') ?? '';
    if (!href.startsWith('data:image/png;base64,')) fail(`${item.id} fallback image media capability drift`);
    const key = `${compact(xmlText(foreignObject))}|${image.attributes.get('x')}|${image.attributes.get('y')}`;
    const expectedHash = FALLBACKS.get(key);
    const imageBytes = Buffer.from(href.slice('data:image/png;base64,'.length), 'base64');
    const imageHash = createHash('sha256').update(imageBytes).digest('hex');
    const fallbackWidth = number(image.attributes.get('width'), `${item.id}.fallback.width`);
    const fallbackHeight = number(image.attributes.get('height'), `${item.id}.fallback.height`);
    const pngDimensionsMatch = imageBytes.length >= 24
      && imageBytes.readUInt32BE(16) === fallbackWidth * 4
      && imageBytes.readUInt32BE(20) === fallbackHeight * 4;
    if (!expectedHash || imageHash !== expectedHash || !pngDimensionsMatch || fallbackKeys.has(key)) fail(`${item.id} fallback image bounds/content drift`);
    fallbackKeys.add(key);
  }
  if (fallbackKeys.size !== FALLBACKS.size) fail('raw semantic fallback inventory drift');

  for (const edge of model.edges) {
    const group = groups.get(idMap.get(edge.id));
    const edgePaths = xmlElements(group, 'path', SVG_NS);
    const connector = edgePaths.find((item) => item.attributes.get('fill') === 'none');
    const arrow = edgePaths.find((item) => item !== connector);
    if (!connector || !arrow) fail(`${edge.id} raw path capability inventory drift`);
    const color = edge.style.get('strokeColor').toLowerCase();
    const connectorExpected = {
      d: connector.attributes.get('d'), fill: 'none', stroke: color, 'stroke-width': '4',
      'stroke-miterlimit': '10', 'pointer-events': 'stroke', style: `stroke: ${adaptive(color, `${edge.id}.stroke`)};`,
    };
    if (edge.style.get('dashed') === '1') connectorExpected['stroke-dasharray'] = '40 32';
    expectAttributes(connector, connectorExpected, `${edge.id} raw connector`);
    expectAttributes(arrow, {
      d: arrow.attributes.get('d'), fill: color, stroke: color, 'stroke-width': '4',
      'stroke-miterlimit': '10', 'pointer-events': 'all',
      style: `fill: ${adaptive(color, `${edge.id}.fill`)}; stroke: ${adaptive(color, `${edge.id}.stroke`)};`,
    }, `${edge.id} raw arrow`);
  }
}
