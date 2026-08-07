import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {isDeepStrictEqual} from 'node:util';

import {
  validateInventoryLedgerConsistency,
  validateSourceLicenseInventory,
} from '../scripts/validate-source-license-inventory.mjs';

const [ledger, linkHealth, licenseInventory] = await Promise.all([
  readFile(new URL('../data/source-ledger.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/source-link-health.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../docs/source-license-inventory.md', import.meta.url), 'utf8'),
]);

const licenseScope = 'The named article/page and bibliographic facts only; prose, code, diagrams, images, marks, comments, linked works, and third-party material excluded';
const migrationPolicy = 'Facts summary and reviewed short quotation only; no adaptation or copied structure';

const expectedNewSources = new Map([
  ['src-cockburn-hexagonal-architecture-2005', {
    canonical_locator: 'https://alistair.cockburn.us/hexagonal-architecture/',
    transport_locator: 'https://alistair.cockburn.us/hexagonal-architecture/',
    query_insensitive: false,
    locator_aliases: [],
    tombstone: null,
    title: 'Hexagonal architecture the original 2005 article',
    author_or_org: 'Alistair Cockburn',
    published_at: '2005-09-04',
    registered_at: '2026-08-07',
    checked_at: '2026-08-07',
    version: 'HaT Technical Report 2005.02, version 0.9 dated 2005-09-04; page checked 2026-08-07',
    source_kind: 'paper',
    tier: 'primary',
    allowed_evidence_roles: ['comparison', 'definition', 'historical-context', 'implementation', 'learning'],
    license: 'LicenseRef-All-Rights-Reserved',
    license_scope: licenseScope,
    license_evidence_url: 'https://alistair.cockburn.us/hexagonal-architecture/',
    license_evidence_note: 'The Alistair Cockburn article at https://alistair.cockburn.us/hexagonal-architecture/ was checked on 2026-08-07; the page carries Copyright © Alistair Cockburn 2022 All Rights Reserved and exposes no reusable license for the work. Tego Arch retains attribution, a link, and original factual summary only.',
    license_family_id: 'https://alistair.cockburn.us/hexagonal-architecture/',
    license_family_grouping: 'identity',
    family_grouping_evidence_url: null,
    copyright_policy: 'facts-and-short-quotation',
    usage_boundary: 'Defines the original Ports and Adapters intent, purposeful ports, adapters, primary and secondary actors, and isolated application testing; source diagrams, code structure, and later interpretations are not copied.',
    link_policy: 'stable',
    expected_final_transport_locator: 'https://alistair.cockburn.us/hexagonal-architecture',
    expected_final_approved_at: '2026-08-07',
    expected_final_approval_note: 'Approved the 2026-08-07 live 301 normalization from the canonical trailing-slash transport to the author-hosted no-trailing-slash final transport.',
  }],
  ['src-palermo-onion-architecture-part-1', {
    canonical_locator: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    transport_locator: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    query_insensitive: false,
    locator_aliases: [],
    tombstone: null,
    title: 'The Onion Architecture : part 1',
    author_or_org: 'Jeffrey Palermo',
    published_at: '2008-07-29',
    registered_at: '2026-08-07',
    checked_at: '2026-08-07',
    version: 'Original article published 2008-07-29; page checked 2026-08-07',
    source_kind: 'engineering-blog',
    tier: 'primary',
    allowed_evidence_roles: ['comparison', 'definition', 'historical-context', 'learning'],
    license: 'LicenseRef-All-Rights-Reserved',
    license_scope: licenseScope,
    license_evidence_url: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    license_evidence_note: 'The Jeffrey Palermo article “The Onion Architecture : part 1” at https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/ was checked on 2026-08-07; the author-hosted page exposes no reusable license for this work. Tego Arch retains attribution, a link, and original factual summary only.',
    license_family_id: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    license_family_grouping: 'identity',
    family_grouping_evidence_url: null,
    copyright_policy: 'facts-and-short-quotation',
    usage_boundary: 'Defines Onion Architecture scope, inward coupling, the independent Domain Model, core-owned repository interfaces, and external infrastructure; maintenance claims remain attributed author experience.',
    link_policy: 'stable',
    expected_final_transport_locator: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    expected_final_approved_at: '2026-08-07',
    expected_final_approval_note: 'Reviewed canonical identity and current author-hosted transport on 2026-08-07.',
  }],
  ['src-palermo-onion-architecture-part-3', {
    canonical_locator: 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    transport_locator: 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    query_insensitive: false,
    locator_aliases: [],
    tombstone: null,
    title: 'The Onion Architecture : part 3',
    author_or_org: 'Jeffrey Palermo',
    published_at: '2008-08-04',
    registered_at: '2026-08-07',
    checked_at: '2026-08-07',
    version: 'Original article published 2008-08-04; page checked 2026-08-07',
    source_kind: 'engineering-blog',
    tier: 'primary',
    allowed_evidence_roles: ['comparison', 'definition', 'historical-context', 'learning'],
    license: 'LicenseRef-All-Rights-Reserved',
    license_scope: licenseScope,
    license_evidence_url: 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    license_evidence_note: 'The Jeffrey Palermo article “The Onion Architecture : part 3” at https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/ was checked on 2026-08-07; the author-hosted page exposes no reusable license for this work. Tego Arch retains attribution, a link, and original factual summary only.',
    license_family_id: 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    license_family_grouping: 'identity',
    family_grouping_evidence_url: null,
    copyright_policy: 'facts-and-short-quotation',
    usage_boundary: 'Defines the four Onion tenets and its contrast with traditional layered dependencies; C#, IoC product recommendations, source diagrams, and universal outcome claims are excluded.',
    link_policy: 'stable',
    expected_final_transport_locator: 'https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/',
    expected_final_approved_at: '2026-08-07',
    expected_final_approval_note: 'Reviewed canonical identity and current author-hosted transport on 2026-08-07.',
  }],
  ['src-martin-clean-architecture-2012', {
    canonical_locator: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    transport_locator: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    query_insensitive: false,
    locator_aliases: [],
    tombstone: null,
    title: 'The Clean Architecture',
    author_or_org: 'Robert C. Martin',
    published_at: '2012-08-13',
    registered_at: '2026-08-07',
    checked_at: '2026-08-07',
    version: 'Original article published 2012-08-13; page checked 2026-08-07',
    source_kind: 'engineering-blog',
    tier: 'primary',
    allowed_evidence_roles: ['comparison', 'definition', 'historical-context', 'implementation', 'learning'],
    license: 'LicenseRef-All-Rights-Reserved',
    license_scope: licenseScope,
    license_evidence_url: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    license_evidence_note: 'The Robert C. Martin article “The Clean Architecture” at https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html was checked on 2026-08-07; the author-hosted page exposes no reusable license for this work. Tego Arch retains attribution, a link, and original factual summary only.',
    license_family_id: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    license_family_grouping: 'identity',
    family_grouping_evidence_url: null,
    copyright_policy: 'facts-and-short-quotation',
    usage_boundary: 'Defines the Dependency Rule, Entities, Use Cases, Interface Adapters, Frameworks and Drivers, boundary crossing, and simple boundary data; the source diagram and fixed four-circle layout are not copied or required.',
    link_policy: 'stable',
    expected_final_transport_locator: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    expected_final_approved_at: '2026-08-07',
    expected_final_approval_note: 'Reviewed canonical identity and current author-hosted transport on 2026-08-07.',
  }],
]);

const inventoryColumns = [
  'source_family',
  'current_urls',
  'author_or_org',
  'license_evidence_url',
  'license_evidence_note',
  'checked_at',
  'exact_license',
  'scope_exclusions',
  'migration_policy',
  'family_grouping',
  'grouping_evidence_url',
];

const expectedInventoryEntries = [...expectedNewSources.values()].map((source) => ({
  source_family: source.license_family_id,
  current_urls: [source.canonical_locator],
  author_or_org: source.author_or_org,
  license_evidence_url: source.license_evidence_url,
  license_evidence_note: source.license_evidence_note,
  checked_at: source.checked_at,
  exact_license: source.license,
  scope_exclusions: source.license_scope,
  migration_policy: migrationPolicy,
  family_grouping: source.license_family_grouping,
  grouping_evidence_url: 'not-applicable',
}));

function selectFields(record, expected) {
  return Object.fromEntries(Object.keys(expected).map((field) => [field, record?.[field]]));
}

function sourceContractErrors(sources) {
  const records = new Map(sources.map((source) => [source.id, source]));
  const errors = [];
  for (const [id, expected] of expectedNewSources) {
    const record = records.get(id);
    if (!record) {
      errors.push(`${id}: missing record`);
      continue;
    }
    for (const [field, value] of Object.entries(expected)) {
      if (isDeepStrictEqual(record[field], value)) continue;
      errors.push(`${id}: ${field}`);
    }
  }
  return errors;
}

function inventoryTable(entries) {
  const rows = entries.map((entry) => inventoryColumns.map((column) =>
    column === 'current_urls' ? entry.current_urls.join('<br>') : entry[column]));
  return [
    `| ${inventoryColumns.join(' | ')} |`,
    `| ${inventoryColumns.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

test('governs the four original STY-02 sources with complete exact records', () => {
  const records = new Map(ledger.sources.map((source) => [source.id, source]));
  for (const [id, expected] of expectedNewSources) {
    assert.deepEqual(selectFields(records.get(id), expected), expected, id);
  }
});

test('parses and matches all eleven inventory columns against ledger authority', () => {
  const inventory = validateSourceLicenseInventory(licenseInventory, []);
  const entries = new Map(inventory.entries.map((entry) => [entry.source_family, entry]));
  for (const expected of expectedInventoryEntries) {
    assert.deepEqual(selectFields(entries.get(expected.source_family), expected), expected);
  }

  const focusedInventory = validateSourceLicenseInventory(
    inventoryTable(expectedInventoryEntries),
    expectedInventoryEntries.flatMap(({current_urls}) => current_urls),
  );
  assert.deepEqual(focusedInventory.errors, []);
  assert.deepEqual(
    validateInventoryLedgerConsistency(
      focusedInventory.entries,
      ledger.sources,
      ledger.documents,
    ).errors,
    [],
  );
});

test('rejects copied or non-canonical ARR evidence notes', () => {
  const copied = structuredClone(expectedInventoryEntries);
  copied[2].license_evidence_note = copied[1].license_evidence_note;
  const copiedResult = validateSourceLicenseInventory(
    inventoryTable(copied),
    copied.flatMap(({current_urls}) => current_urls),
  );
  assert.match(copiedResult.errors.join('\n'), /ARR evidence note.*reused|ARR evidence note.*evidence URL/iu);

  const vague = structuredClone(expectedInventoryEntries);
  vague[0].license_evidence_note = 'A unique but non-canonical note about an unavailable reuse license.';
  const vagueResult = validateSourceLicenseInventory(
    inventoryTable(vague),
    vague.flatMap(({current_urls}) => current_urls),
  );
  assert.match(vagueResult.errors.join('\n'), /ARR evidence note.*author/iu);
  assert.match(vagueResult.errors.join('\n'), /ARR evidence note.*evidence URL/iu);
});

test('detects inventory scope drift from authoritative ledger records', () => {
  const drifted = structuredClone(expectedInventoryEntries);
  drifted[0].scope_exclusions = 'The named page only';
  const result = validateInventoryLedgerConsistency(drifted, ledger.sources, ledger.documents);
  assert.match(result.errors.join('\n'), /field "license_scope" differs/iu);
});

test('detects controlled evidence-role and usage-boundary mutations', () => {
  const roleMutation = structuredClone(ledger.sources);
  roleMutation.find(({id}) => id === 'src-palermo-onion-architecture-part-1')
    .allowed_evidence_roles = ['definition', 'historical-context', 'learning'];
  assert.match(sourceContractErrors(roleMutation).join('\n'), /allowed_evidence_roles/u);

  const boundaryMutation = structuredClone(ledger.sources);
  boundaryMutation.find(({id}) => id === 'src-martin-clean-architecture-2012')
    .usage_boundary = 'Generic architecture summary.';
  assert.match(sourceContractErrors(boundaryMutation).join('\n'), /usage_boundary/u);
});

test('bounds the reused AWS source for STY-01 comparison and STY-02 implementation context', () => {
  const record = ledger.sources.find(({id}) => id === 'src-aws-hexagonal-layered-overview');
  assert.equal(record?.canonical_locator, 'https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/overview.html');
  assert.deepEqual(record.allowed_evidence_roles, ['comparison', 'definition', 'implementation', 'learning']);
  assert.match(record.usage_boundary, /STY-01/u);
  assert.match(record.usage_boundary, /STY-02/u);
  assert.match(record.usage_boundary, /AWS-specific/u);
});

test('keeps every new STY-02 transport in the reviewed health cache', () => {
  const results = new Map(linkHealth.results.flatMap((result) =>
    result.source_ids.map((sourceId) => [sourceId, result])));
  for (const id of expectedNewSources.keys()) {
    const result = results.get(id);
    assert.ok(result, `${id} health result`);
    assert.equal(result.last_attempt.outcome, 'healthy', `${id} current transport`);
    assert.equal(result.review_status, 'healthy', `${id} review status`);
  }
});

const diagramSourceUrl = new URL('../diagrams/sty-02-hexagonal-onion-clean-order.drawio', import.meta.url);
const diagramSvgUrl = new URL('../static/img/diagrams/sty-02-hexagonal-onion-clean-order.svg', import.meta.url);
const requiredDiagramLabels = [
  '外部驱动方', '应用核心', '外部机制',
  'HTTP / CLI / 自动化测试', '输入适配器', '提交订单用例', '订单领域规则',
  '库存端口', '订单仓储端口', '库存服务适配器', '数据库适配器',
  'Driving Adapter / UI Edge / Controller',
  'Driving Port / Application Interface / Input Boundary',
  'Domain Model / Entity Policy',
  'Driven Port / Core Interface / Output Gateway',
  'Driven Adapter / Infrastructure / Interface Adapter',
  '运行时控制流', '源码依赖指向内侧接口',
];

test('publishes the synchronized STY-02 Draw.io and SVG pair', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(diagramSourceUrl, 'utf8'),
    readFile(diagramSvgUrl, 'utf8'),
  ]);
  for (const label of requiredDiagramLabels) {
    assert.ok(drawio.includes(label), `Draw.io label: ${label}`);
    assert.ok(svg.includes(label), `SVG label: ${label}`);
  }
  assert.match(svg, /viewBox="0 0 1200 760"/u);
  assert.doesNotMatch(svg, /<svg[^>]+(?:width|height)="[0-9]/u);
  assert.match(svg, /role="img"/u);
  assert.match(svg, /aria-labelledby="diagram-title diagram-description"/u);
});

function parseXmlAttributes(fragment) {
  return Object.fromEntries(
    [...fragment.matchAll(/([\w:-]+)="([^"]*)"/gu)].map(([, name, value]) => [name, value]),
  );
}

function xmlElements(xml, name) {
  return [...xml.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gu'))]
    .map(([fragment]) => parseXmlAttributes(fragment));
}

function drawioCells(drawio) {
  return new Map(xmlElements(drawio, 'mxCell').map((cell) => [cell.id, cell]));
}

function drawioGeometries(drawio) {
  const geometries = new Map();
  for (const match of drawio.matchAll(/<mxCell\b([^>]*)>\s*<mxGeometry\b([^>]*)\/>/gu)) {
    const cell = parseXmlAttributes(match[1]);
    const geometry = parseXmlAttributes(match[2]);
    geometries.set(cell.id, ['x', 'y', 'width', 'height'].map((field) => Number(geometry[field])));
  }
  return geometries;
}

function svgElementsById(svg, name, idAttribute) {
  return new Map(xmlElements(svg, name).map((element) => [element[idAttribute], element]));
}

function svgNodeShapes(svg) {
  return new Map([...svg.matchAll(/<g\b([^>]*\bdata-node-id="[^"]+"[^>]*)>[\s\S]*?<path\b([^>]*)\/>/gu)]
    .map((match) => {
      const group = parseXmlAttributes(match[1]);
      return [group['data-node-id'], parseXmlAttributes(match[2])];
    }));
}

function svgPathBounds(pathData) {
  const tokens = pathData.match(/[MHVQZ]|-?\d+(?:\.\d+)?/gu) ?? [];
  const points = [];
  let cursor = 0;
  let command;
  let x = 0;
  let y = 0;
  while (cursor < tokens.length) {
    if (/^[MHVQZ]$/u.test(tokens[cursor])) command = tokens[cursor++];
    if (command === 'M') {
      x = Number(tokens[cursor++]); y = Number(tokens[cursor++]); points.push([x, y]); command = 'L';
    } else if (command === 'H') {
      x = Number(tokens[cursor++]); points.push([x, y]);
    } else if (command === 'V') {
      y = Number(tokens[cursor++]); points.push([x, y]);
    } else if (command === 'Q') {
      const controlX = Number(tokens[cursor++]); const controlY = Number(tokens[cursor++]);
      x = Number(tokens[cursor++]); y = Number(tokens[cursor++]);
      points.push([controlX, controlY], [x, y]);
    } else if (command === 'Z') {
      command = undefined;
    } else {
      assert.fail(`unsupported SVG path command in ${pathData}`);
    }
  }
  const xs = points.map(([pointX]) => pointX);
  const ys = points.map(([, pointY]) => pointY);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
}

function svgMarker(svg, id) {
  const match = svg.match(new RegExp(`<marker\\b([^>]*\\bid="${id}"[^>]*)>([\\s\\S]*?)<\\/marker>`, 'u'));
  assert.ok(match, `${id} marker`);
  const pathMatch = match[2].match(/<path\b([^>]*)\/>/u);
  assert.ok(pathMatch, `${id} marker path`);
  return {attributes: parseXmlAttributes(match[1]), path: parseXmlAttributes(pathMatch[1])};
}

function parsePathEndpoint(pathData) {
  const coordinates = [...pathData.matchAll(/([HV])(-?\d+(?:\.\d+)?)/gu)];
  assert.ok(coordinates.length > 0, `path coordinates: ${pathData}`);
  let [x, y] = pathData.match(/^M(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/u)
    .slice(1).map(Number);
  for (const [, axis, value] of coordinates) {
    if (axis === 'H') x = Number(value);
    else y = Number(value);
  }
  return {x, y};
}

const plannedDiagramGeometries = new Map([
  ['b-driver', [30, 100, 220, 520]],
  ['b-core', [400, 70, 550, 620]],
  ['b-mechanism', [980, 100, 190, 520]],
  ['n-driver', [60, 310, 160, 100]],
  ['n-input-adapter', [270, 310, 110, 100]],
  ['n-usecase', [450, 270, 210, 110]],
  ['n-domain', [450, 450, 210, 110]],
  ['n-inventory-port', [750, 175, 160, 100]],
  ['n-order-port', [750, 485, 160, 100]],
  ['n-inventory-adapter', [995, 175, 160, 100]],
  ['n-database-adapter', [995, 485, 160, 100]],
]);

const plannedDiagramRelations = new Map([
  ['c1', ['n-driver', 'n-input-adapter']],
  ['c2', ['n-input-adapter', 'n-usecase']],
  ['c3', ['n-usecase', 'n-domain']],
  ['c4', ['n-usecase', 'n-inventory-port']],
  ['c5', ['n-inventory-port', 'n-inventory-adapter']],
  ['c6', ['n-usecase', 'n-order-port']],
  ['c7', ['n-order-port', 'n-database-adapter']],
  ['d1', ['n-input-adapter', 'n-usecase']],
  ['d2', ['n-inventory-adapter', 'n-inventory-port']],
  ['d3', ['n-database-adapter', 'n-order-port']],
]);

test('parses the exact STY-02 geometry and directed relation inventory', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(diagramSourceUrl, 'utf8'),
    readFile(diagramSvgUrl, 'utf8'),
  ]);
  const geometries = drawioGeometries(drawio);
  const cells = drawioCells(drawio);
  const svgNodes = svgNodeShapes(svg);
  const svgBoundaries = svgElementsById(svg, 'path', 'data-boundary-id');
  const svgEdges = svgElementsById(svg, 'path', 'data-edge-id');

  for (const [id, geometry] of plannedDiagramGeometries) {
    assert.deepEqual(geometries.get(id), geometry, `${id} Draw.io geometry`);
    const svgElement = id.startsWith('b-') ? svgBoundaries.get(id) : svgNodes.get(id);
    assert.deepEqual(svgPathBounds(svgElement?.d), geometry, `${id} SVG rendered path geometry`);
  }

  for (const [id, [source, target]] of plannedDiagramRelations) {
    assert.deepEqual([cells.get(id)?.source, cells.get(id)?.target], [source, target], `${id} Draw.io relation`);
    assert.deepEqual([svgEdges.get(id)?.['data-source'], svgEdges.get(id)?.['data-target']], [source, target], `${id} SVG relation`);
  }
});

test('parses distinct runtime and inward source-dependency routing contracts', async () => {
  const [drawio, svg] = await Promise.all([
    readFile(diagramSourceUrl, 'utf8'),
    readFile(diagramSvgUrl, 'utf8'),
  ]);
  const cells = drawioCells(drawio);
  const edges = svgElementsById(svg, 'path', 'data-edge-id');
  const runtimeMarker = svgMarker(svg, 'arrow-runtime');
  const dependencyMarker = svgMarker(svg, 'arrow-dependency');

  for (const id of ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']) {
    assert.match(cells.get(id).style, /strokeWidth=3/u, `${id} Draw.io runtime width`);
    assert.doesNotMatch(cells.get(id).style, /dashed=1/u, `${id} Draw.io runtime solid`);
    assert.match(cells.get(id).style, /endArrow=block;endFill=1/u, `${id} Draw.io runtime marker`);
    assert.equal(edges.get(id).stroke, '#263238', `${id} SVG runtime stroke`);
    assert.equal(edges.get(id)['stroke-dasharray'], undefined, `${id} SVG runtime solid`);
    assert.equal(edges.get(id)['marker-end'], 'url(#arrow-runtime)', `${id} SVG runtime marker`);
  }
  for (const id of ['d1', 'd2', 'd3']) {
    assert.match(cells.get(id).style, /dashed=1/u, `${id} Draw.io dependency dashed`);
    assert.match(cells.get(id).style, /endArrow=open;endFill=0/u, `${id} Draw.io dependency marker`);
    assert.equal(edges.get(id).stroke, '#2F6F9F', `${id} SVG dependency stroke`);
    assert.ok(edges.get(id)['stroke-dasharray'], `${id} SVG dependency dashed`);
    assert.equal(edges.get(id)['marker-end'], 'url(#arrow-dependency)', `${id} SVG dependency marker`);
  }

  assert.notEqual(edges.get('c2').d, edges.get('d1').d, 'input runtime/dependency lanes');
  assert.notEqual(parsePathEndpoint(edges.get('c5').d).y, parsePathEndpoint(edges.get('d2').d).y, 'inventory lanes');
  assert.notEqual(parsePathEndpoint(edges.get('c7').d).y, parsePathEndpoint(edges.get('d3').d).y, 'repository lanes');
  assert.ok(parsePathEndpoint(edges.get('d2').d).x < 995, 'd2 points inward');
  assert.ok(parsePathEndpoint(edges.get('d3').d).x < 995, 'd3 points inward');
  assert.equal(runtimeMarker.attributes.markerUnits, 'userSpaceOnUse');
  assert.notEqual(runtimeMarker.path.fill, 'none', 'runtime arrowhead is filled');
  assert.equal(dependencyMarker.attributes.markerUnits, 'userSpaceOnUse');
  assert.equal(dependencyMarker.path.fill, 'none', 'dependency arrowhead is open');
  assert.ok(dependencyMarker.path.stroke, 'dependency arrowhead has a visible outline');
});

test('connects every visible SVG arrow tip to its target-node boundary', async () => {
  const svg = await readFile(diagramSvgUrl, 'utf8');
  const edges = svgElementsById(svg, 'path', 'data-edge-id');
  const expectedTips = new Map([
    ['c1', {x: 270, y: 360}], ['c2', {x: 450, y: 345}], ['c3', {x: 505, y: 450}],
    ['c4', {x: 750, y: 225}], ['c5', {x: 995, y: 225}], ['c6', {x: 750, y: 535}],
    ['c7', {x: 995, y: 535}], ['d1', {x: 450, y: 365}], ['d2', {x: 910, y: 260}],
    ['d3', {x: 910, y: 570}],
  ]);
  const markerTipOffset = new Map(['arrow-runtime', 'arrow-dependency'].map((id) => {
    const marker = svgMarker(svg, id);
    const xCoordinates = [...marker.path.d.matchAll(/[ML](-?\d+(?:\.\d+)?)[ ,]-?\d+(?:\.\d+)?/gu)]
      .map(([, x]) => Number(x));
    return [`url(#${id})`, Math.max(...xCoordinates) - Number(marker.attributes.refX)];
  }));

  for (const [id, expectedTip] of expectedTips) {
    const edge = edges.get(id);
    const endpoint = parsePathEndpoint(edge.d);
    const previousHorizontal = /H/u.test(edge.d.slice(edge.d.lastIndexOf('V') + 1));
    const offset = markerTipOffset.get(edge['marker-end']);
    const direction = id === 'd2' || id === 'd3' ? -1 : 1;
    const actualTip = previousHorizontal
      ? {x: endpoint.x + (offset * direction), y: endpoint.y}
      : {x: endpoint.x, y: endpoint.y + offset};
    assert.deepEqual(actualTip, expectedTip, `${id} visible marker tip`);
  }
});
