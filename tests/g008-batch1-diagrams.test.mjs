import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const diagrams = [
  {
    article: 'content/modeling/mod-03-c4-component-dynamic-deployment.mdx',
    route: '/modeling/mod-03#component',
    drawio: 'diagrams/mod-03-c4-component.drawio',
    svg: 'static/img/diagrams/mod-03-c4-component.svg',
    title: '申报 API Component 责任边界',
    note: '此图只展开一个申报 API Container，展示四个内部责任单元及直接依赖，不证明代码与图一致。',
    legends: [],
    nodes: [
      ['web', 'Web 应用', 'CONTAINER', null],
      ['submit', '提交用例', 'COMPONENT', 'boundary'],
      ['policy', '审批策略', 'COMPONENT', 'boundary'],
      ['payment', '付款编排', 'COMPONENT', 'boundary'],
      ['persistence', '持久化端口', 'COMPONENT', 'boundary'],
      ['db', '申报数据库', 'DATA STORE', null],
      ['worker', '支付任务执行器', 'CONTAINER', null],
    ],
    boundaries: [
      ['boundary', '申报 API', ['submit', 'policy', 'payment', 'persistence']],
    ],
    relations: [
      ['edge-web-submit', '提交请求', 'web', 'submit'],
      ['edge-submit-policy', '校验审批', 'submit', 'policy'],
      ['edge-submit-payment', '创建付款任务', 'submit', 'payment'],
      ['edge-payment-persistence', '保存任务', 'payment', 'persistence'],
      ['edge-persistence-db', '读写申报', 'persistence', 'db'],
      ['edge-payment-worker', '发布待执行任务', 'payment', 'worker'],
    ],
  },
  {
    article: 'content/modeling/mod-03-c4-component-dynamic-deployment.mdx',
    route: '/modeling/mod-03#deployment',
    drawio: 'diagrams/mod-03-c4-deployment.drawio',
    svg: 'static/img/diagrams/mod-03-c4-deployment.svg',
    title: '费用申报系统生产环境部署视图',
    note: '此图把费用申报系统的容器实例映射到生产环境节点，但不证明容量、冗余、韧性或故障切换能力。',
    legends: ['部署节点', '容器实例', '基础设施节点', '外部系统'],
    nodes: [
      ['employee-terminal', '员工终端', '部署节点', 'production'],
      ['web-node', 'Web 节点', '部署节点', 'production'],
      ['web-instance', 'Web 应用实例', '容器实例', 'production'],
      ['api-node', 'API 节点', '部署节点', 'production'],
      ['api-instance', '申报 API 实例', '容器实例', 'production'],
      ['db-node', '数据库节点', '基础设施节点', 'production'],
      ['db-instance', '申报数据库实例', '数据实例', 'production'],
      ['task-node', '任务执行节点', '部署节点', 'production'],
      ['worker-instance', '支付任务执行器实例', '容器实例', 'production'],
      ['bank', '外部银行', '外部系统', null],
    ],
    boundaries: [
      [
        'production',
        '生产环境',
        [
          'employee-terminal',
          'web-node',
          'web-instance',
          'api-node',
          'api-instance',
          'db-node',
          'db-instance',
          'task-node',
          'worker-instance',
        ],
      ],
    ],
    relations: [
      ['edge-employee-web', '访问页面', 'employee-terminal', 'web-instance'],
      ['edge-web-api', '提交申报', 'web-instance', 'api-instance'],
      ['edge-api-db', '读写申报', 'api-instance', 'db-instance'],
      ['edge-api-task', '发布付款任务', 'api-instance', 'worker-instance'],
      ['edge-task-bank', '发起付款', 'worker-instance', 'bank'],
    ],
  },
].map((diagram) => ({
  ...diagram,
  semanticLabels: [
    diagram.title,
    diagram.note,
    ...diagram.legends,
    ...diagram.boundaries.map(([, name]) => name),
    ...diagram.nodes.flatMap(([, title, type]) => [title, type]),
    ...diagram.relations.map(([, label]) => label),
  ],
}));

const validatorPath = fileURLToPath(
  new URL(
    '../.codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs',
    import.meta.url,
  ),
);
const purposeAlt = new Map([
  [
    '/modeling/mod-03#component',
    /申报 API[^。\]]*(?:责任单元|容器依赖)/u,
  ],
  [
    '/modeling/mod-03#deployment',
    /(?:容器实例|生产节点)[^。\]]*(?:映射|外部银行)/u,
  ],
]);

function absolute(relativePath) {
  return fileURLToPath(new URL(`../${relativePath}`, import.meta.url));
}

function runValidator(diagram) {
  return spawnSync(
    process.execPath,
    [
      validatorPath,
      absolute(diagram.drawio),
      absolute(diagram.svg),
      ...[...new Set(diagram.semanticLabels)].flatMap((label) => [
        '--label',
        label,
      ]),
    ],
    {encoding: 'utf8'},
  );
}

function architectureDiagramWrapperForSource(article, publicSvgPath) {
  const openings = article.matchAll(
    /<div className="architecture-diagram-scroll"[^>]*>/gu,
  );
  for (const opening of openings) {
    const contentStart = opening.index + opening[0].length;
    const contentEnd = article.indexOf('</div>', contentStart);
    if (contentEnd === -1) {
      continue;
    }
    const wrapper = article.slice(opening.index, contentEnd + '</div>'.length);
    if (wrapper.includes(`](${publicSvgPath})`)) {
      return wrapper;
    }
  }
  return null;
}

function decodeXmlText(value) {
  return value
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'")
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&amp;/gu, '&')
    .trim();
}

function xmlAttribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return decodeXmlText(
    tag.match(new RegExp(`\\b${escaped}="([^"]*)"`, 'u'))?.[1] ?? '',
  );
}

function drawioTextInventory(drawio) {
  return [...drawio.matchAll(/\bvalue="([^"]*)"/gu)]
    .map((match) => decodeXmlText(match[1]))
    .filter(Boolean);
}

function svgTextInventory(svg) {
  return [...svg.matchAll(/<text\b[^>]*>([^<]+)<\/text>/gu)]
      .map((match) => decodeXmlText(match[1]))
      .filter(Boolean);
}

function sortedInventory(values) {
  return [...values].sort((left, right) => left.localeCompare(right, 'zh-Hans'));
}

function absolutePathBounds(pathData) {
  const tokens =
    pathData.match(/[MHVQZ]|-?(?:\d+(?:\.\d+)?|\.\d+)/gu) ?? [];
  let index = 0;
  let x = 0;
  let y = 0;
  const points = [];
  const addPoint = (nextX, nextY) => {
    x = nextX;
    y = nextY;
    points.push([x, y]);
  };

  while (index < tokens.length) {
    const command = tokens[index++];
    if (command === 'Z') continue;
    assert.match(command, /^[MHVQ]$/u, `unsupported path command ${command}`);
    if (command === 'M') {
      addPoint(Number(tokens[index++]), Number(tokens[index++]));
    } else if (command === 'H') {
      addPoint(Number(tokens[index++]), y);
    } else if (command === 'V') {
      addPoint(x, Number(tokens[index++]));
    } else {
      addPoint(Number(tokens[index++]), Number(tokens[index++]));
      addPoint(Number(tokens[index++]), Number(tokens[index++]));
    }
  }

  const xs = points.map(([pointX]) => pointX);
  const ys = points.map(([, pointY]) => pointY);
  return [
    Math.min(...xs),
    Math.min(...ys),
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
  ];
}

function numericBounds(tag, attribute) {
  return xmlAttribute(tag, attribute).split(/\s+/u).map(Number);
}

function nodeOutlineTag(svg, nodeId) {
  const escaped = nodeId.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const contents =
    svg.match(
      new RegExp(
        `<g\\b[^>]*\\bdata-node-id="${escaped}"[^>]*>([\\s\\S]*?)<\\/g>`,
        'u',
      ),
    )?.[1] ?? '';
  return contents.match(/<path\b[^>]*\bstroke-width="[^"]+"[^>]*>/u)?.[0] ?? '';
}

function deploymentClearanceContract(svg) {
  const viewBox = svg.match(/\bviewBox="0 0 ([\d.]+) ([\d.]+)"/u);
  const boundary =
    svg.match(
      /<path\b[^>]*\bdata-boundary-id="production"[^>]*>/u,
    )?.[0] ?? '';
  const databaseGroup =
    svg.match(/<g\b[^>]*\bdata-node-id="db-node"[^>]*>/u)?.[0] ?? '';
  const bankGroup =
    svg.match(/<g\b[^>]*\bdata-node-id="bank"[^>]*>/u)?.[0] ?? '';
  const database = nodeOutlineTag(svg, 'db-node');
  const bank = nodeOutlineTag(svg, 'bank');

  assert.ok(viewBox && boundary && databaseGroup && bankGroup && database && bank);
  const boundaryMetadata = numericBounds(boundary, 'data-boundary-bounds');
  const databaseMetadata = numericBounds(databaseGroup, 'data-node-bounds');
  const bankMetadata = numericBounds(bankGroup, 'data-node-bounds');
  const boundaryActual = absolutePathBounds(xmlAttribute(boundary, 'd'));
  const databaseActual = absolutePathBounds(xmlAttribute(database, 'd'));
  const bankActual = absolutePathBounds(xmlAttribute(bank, 'd'));

  assert.deepEqual(
    boundaryMetadata,
    boundaryActual,
    'production boundary metadata must match its actual path',
  );
  assert.deepEqual(
    databaseMetadata,
    databaseActual,
    'database metadata must match its actual path',
  );
  assert.deepEqual(
    bankMetadata,
    bankActual,
    'bank metadata must match its actual path',
  );

  const scale = 800 / Number(viewBox[1]);
  const [boundaryX, , boundaryWidth] = boundaryActual;
  const [databaseX, , databaseWidth] = databaseActual;
  const [bankX, , bankWidth] = bankActual;
  const boundaryStroke = Number(xmlAttribute(boundary, 'stroke-width'));
  const databaseStroke = Number(xmlAttribute(database, 'stroke-width'));
  const bankStroke = Number(xmlAttribute(bank, 'stroke-width'));

  return {
    databaseToBoundary:
      (boundaryX +
        boundaryWidth -
        boundaryStroke / 2 -
        (databaseX + databaseWidth + databaseStroke / 2)) *
      scale,
    boundaryToBank:
      (bankX -
        bankStroke / 2 -
        (boundaryX + boundaryWidth + boundaryStroke / 2)) *
      scale,
    bankToViewBox:
      (Number(viewBox[1]) - (bankX + bankWidth + bankStroke / 2)) * scale,
  };
}

function drawioCellTag(drawio, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return (
    drawio.match(
      new RegExp(`<mxCell\\b(?=[^>]*\\bid="${escaped}")[^>]*>`, 'u'),
    )?.[0] ?? ''
  );
}

function drawioNodeContract(drawio, diagram) {
  return diagram.nodes.map(([id]) => {
    const node = drawioCellTag(drawio, id);
    const type = drawioCellTag(drawio, `${id}-type`);
    return [
      id,
      xmlAttribute(node, 'value'),
      xmlAttribute(type, 'value'),
      xmlAttribute(node, 'data-boundary-id') || null,
    ];
  });
}

function svgNodeContract(svg) {
  return [
    ...svg.matchAll(
      /(<g\b[^>]*\bdata-node-id="[^"]+"[^>]*>)([\s\S]*?)<\/g>/gu,
    ),
  ].map(([, groupTag, contents]) => [
    xmlAttribute(groupTag, 'data-node-id'),
    decodeXmlText(
      contents.match(
        /<text\b[^>]*\bdata-text-role="title"[^>]*>([^<]+)<\/text>/u,
      )?.[1] ?? '',
    ),
    decodeXmlText(
      contents.match(
        /<text\b[^>]*\bdata-text-role="type"[^>]*>([^<]+)<\/text>/u,
      )?.[1] ?? '',
    ),
    xmlAttribute(groupTag, 'data-boundary-id') || null,
  ]);
}

function boundaryContract(boundaryTags, nodes) {
  return boundaryTags.map((tag) => {
    const id =
      xmlAttribute(tag, 'data-boundary-id') || xmlAttribute(tag, 'id');
    const name =
      xmlAttribute(tag, 'data-boundary-name') || xmlAttribute(tag, 'value');
    return [
      id,
      name,
      nodes
        .filter(([, , , boundaryId]) => boundaryId === id)
        .map(([nodeId]) => nodeId),
    ];
  });
}

function drawioBoundaryContract(drawio, diagram, nodes) {
  return boundaryContract(
    diagram.boundaries.map(([id]) => drawioCellTag(drawio, id)),
    nodes,
  );
}

function svgBoundaryContract(svg, nodes) {
  return boundaryContract(
    svg.match(/<path\b[^>]*\bdata-boundary-id="[^"]+"[^>]*>/gu) ?? [],
    nodes,
  );
}

function drawioRelationContract(drawio) {
  return (drawio.match(/<mxCell\b(?=[^>]*\bedge="1")[^>]*>/gu) ?? []).map(
    (tag) => [
      xmlAttribute(tag, 'id'),
      xmlAttribute(tag, 'value'),
      xmlAttribute(tag, 'source'),
      xmlAttribute(tag, 'target'),
      /(?:^|;)endArrow=block(?:;|$)/u.test(xmlAttribute(tag, 'style')),
    ],
  );
}

function svgRelationContract(svg) {
  const labels = new Map(
    [
      ...svg.matchAll(
        /(<text\b[^>]*\bdata-edge-id="[^"]+"[^>]*>)([^<]+)<\/text>/gu,
      ),
    ].map(([, tag, label]) => [
      xmlAttribute(tag, 'data-edge-id'),
      decodeXmlText(label),
    ]),
  );
  return (
    svg.match(
      /<path\b(?=[^>]*\bdata-edge-id="[^"]+")(?=[^>]*\bdata-source="[^"]+")(?=[^>]*\bdata-target="[^"]+")[^>]*>/gu,
    ) ?? []
  ).map((tag) => [
    xmlAttribute(tag, 'data-edge-id'),
    labels.get(xmlAttribute(tag, 'data-edge-id')),
    xmlAttribute(tag, 'data-source'),
    xmlAttribute(tag, 'data-target'),
    /^url\(#.+-arrow\)$/u.test(xmlAttribute(tag, 'marker-end')),
  ]);
}

function assertDiagramContract(diagram, drawio, svg) {
  const expectedNodes = diagram.nodes;
  const drawioNodes = drawioNodeContract(drawio, diagram);
  const svgNodes = svgNodeContract(svg);
  assert.deepEqual(drawioNodes, expectedNodes, `${diagram.route} Draw.io nodes`);
  assert.deepEqual(svgNodes, expectedNodes, `${diagram.route} SVG nodes`);

  const drawioBoundaries = drawioBoundaryContract(
    drawio,
    diagram,
    drawioNodes,
  );
  const svgBoundaries = svgBoundaryContract(svg, svgNodes);
  assert.deepEqual(
    drawioBoundaries,
    diagram.boundaries,
    `${diagram.route} Draw.io boundaries`,
  );
  assert.deepEqual(
    svgBoundaries,
    diagram.boundaries,
    `${diagram.route} SVG boundaries`,
  );

  const expectedRelations = diagram.relations.map((relation) => [
    ...relation,
    true,
  ]);
  assert.deepEqual(
    drawioRelationContract(drawio),
    expectedRelations,
    `${diagram.route} Draw.io directed relations`,
  );
  assert.deepEqual(
    svgRelationContract(svg),
    expectedRelations,
    `${diagram.route} SVG directed relations`,
  );

  assert.deepEqual(
    sortedInventory(drawioTextInventory(drawio)),
    sortedInventory(diagram.semanticLabels),
    `${diagram.route} complete Draw.io text multiset`,
  );
  assert.deepEqual(
    sortedInventory(svgTextInventory(svg)),
    sortedInventory(diagram.semanticLabels),
    `${diagram.route} complete SVG text multiset`,
  );
}

for (const diagram of diagrams) {
  test(`embeds the local architecture diagram for ${diagram.route}`, async () => {
    const article = await readFile(absolute(diagram.article), 'utf8');
    const publicSvgPath = `/${diagram.svg.replace(/^static\//u, '')}`;
    const escapedPath = publicSvgPath.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    const wrapper = architectureDiagramWrapperForSource(article, publicSvgPath);

    assert.ok(wrapper !== null, `${diagram.route} exact diagram scroll wrapper`);
    assert.match(wrapper, /\brole="region"/u);
    assert.match(wrapper, /\baria-label="[^"]*(?:责任边界|部署视图)[^"]*"/u);
    assert.match(wrapper, /\btabIndex=\{0\}/u);

    const image = wrapper.match(
      new RegExp(`!\\[([^\\]]+)\\]\\(${escapedPath}\\)`, 'u'),
    );
    assert.ok(image, `${diagram.route} uses ${publicSvgPath}`);
    assert.match(
      image[1],
      purposeAlt.get(diagram.route),
      `${diagram.route} purpose-oriented alt`,
    );
    assert.doesNotMatch(image[1], /(?:\.svg|diagram|架构图)$/iu);
  });

  test(`publishes the accessible Draw.io and SVG pair for ${diagram.route}`, async () => {
    const [drawio, svg] = await Promise.all([
      readFile(absolute(diagram.drawio), 'utf8'),
      readFile(absolute(diagram.svg), 'utf8'),
    ]);
    const svgRoot = svg.match(/<svg\b[^>]*>/u)?.[0] ?? '';
    const title = svg.match(/<title\b[^>]*\bid="([^"]+)"[^>]*>[^<]+<\/title>/u);
    const description = svg.match(/<desc\b[^>]*\bid="([^"]+)"[^>]*>[^<]+<\/desc>/u);

    assert.match(drawio, /^<mxfile\b/u);
    assert.match(svgRoot, /\brole="img"/u);
    assert.match(svgRoot, /\bviewBox="[^"]+"/u);
    assert.doesNotMatch(svgRoot, /\bwidth=/u);
    assert.doesNotMatch(svgRoot, /\bheight=/u);
    assert.ok(title, `${diagram.route} accessible SVG title`);
    assert.ok(description, `${diagram.route} accessible SVG description`);
    assert.equal(
      decodeXmlText(title[0].replace(/^<title\b[^>]*>|<\/title>$/gu, '')),
      diagram.title,
    );
    assert.equal(
      decodeXmlText(
        description[0].replace(/^<desc\b[^>]*>|<\/desc>$/gu, ''),
      ),
      diagram.note,
    );
    assert.match(
      svgRoot,
      new RegExp(
        `\\baria-labelledby="${title[1].replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}\\s+${description[1].replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}"`,
        'u',
      ),
    );
    assertDiagramContract(diagram, drawio, svg);

    const validation = runValidator(diagram);
    assert.equal(
      validation.status,
      0,
      `${diagram.route} validator\n${validation.stdout}${validation.stderr}`,
    );
  });
}

test('keeps the Deployment boundary and external bank visibly separated', async () => {
  const svg = await readFile(
    absolute('static/img/diagrams/mod-03-c4-deployment.svg'),
    'utf8',
  );
  const clearances = deploymentClearanceContract(svg);
  assert.ok(
    clearances.databaseToBoundary >= 12,
    'database node to production boundary clearance',
  );
  assert.ok(
    clearances.boundaryToBank >= 12,
    'production boundary to external bank clearance',
  );
  assert.ok(
    clearances.bankToViewBox >= 12,
    'external bank to viewBox clearance',
  );
});

test('rejects Deployment metadata that drifts from actual path geometry', async () => {
  const svg = await readFile(
    absolute('static/img/diagrams/mod-03-c4-deployment.svg'),
    'utf8',
  );
  const mutated = svg.replace(
    'data-node-bounds="700 270 248 250"',
    'data-node-bounds="700 270 240 250"',
  );

  assert.throws(
    () => deploymentClearanceContract(mutated),
    /database metadata must match its actual path/u,
  );
});

test('detects a node type swap even when the unique text inventory is unchanged', async () => {
  const diagram = diagrams[1];
  const [drawio, svg] = await Promise.all([
    readFile(absolute(diagram.drawio), 'utf8'),
    readFile(absolute(diagram.svg), 'utf8'),
  ]);
  const mutated = svg
    .replace(
      /(<g data-node-id="employee-terminal"[\s\S]*?data-text-role="type">)部署节点/u,
      '$1外部系统',
    )
    .replace(
      /(<g data-node-id="bank"[\s\S]*?data-text-role="type">)外部系统/u,
      '$1部署节点',
    );

  assert.deepEqual(
    sortedInventory(new Set(svgTextInventory(mutated))),
    sortedInventory(new Set(svgTextInventory(svg))),
    'the former unique-text check is intentionally unchanged',
  );
  assert.throws(
    () => assertDiagramContract(diagram, drawio, mutated),
    /SVG nodes/u,
  );
});

test('detects boundary membership drift without relying on text changes', async () => {
  const diagram = diagrams[1];
  const [drawio, svg] = await Promise.all([
    readFile(absolute(diagram.drawio), 'utf8'),
    readFile(absolute(diagram.svg), 'utf8'),
  ]);
  const mutated = svg.replace(
    'data-node-id="bank"',
    'data-node-id="bank" data-boundary-id="production"',
  );

  assert.deepEqual(
    sortedInventory(new Set(svgTextInventory(mutated))),
    sortedInventory(new Set(svgTextInventory(svg))),
    'the former unique-text check is intentionally unchanged',
  );
  assert.throws(
    () => assertDiagramContract(diagram, drawio, mutated),
    /SVG nodes/u,
  );
});

test('detects a reversed relationship without relying on text changes', async () => {
  const diagram = diagrams[1];
  const [drawio, svg] = await Promise.all([
    readFile(absolute(diagram.drawio), 'utf8'),
    readFile(absolute(diagram.svg), 'utf8'),
  ]);
  const mutated = svg.replace(
    'data-edge-id="edge-employee-web" data-source="employee-terminal" data-target="web-instance"',
    'data-edge-id="edge-employee-web" data-source="web-instance" data-target="employee-terminal"',
  );

  assert.deepEqual(
    sortedInventory(new Set(svgTextInventory(mutated))),
    sortedInventory(new Set(svgTextInventory(svg))),
    'the former unique-text check is intentionally unchanged',
  );
  assert.throws(
    () => assertDiagramContract(diagram, drawio, mutated),
    /SVG directed relations/u,
  );
});
