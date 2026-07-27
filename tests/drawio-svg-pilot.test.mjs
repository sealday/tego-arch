import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const pagePath = '../content/modeling/mod-02-c4-context-container.mdx';
const drawioPath = '../diagrams/mod-02-c4-context-container.drawio';
const svgPath = '../static/img/diagrams/mod-02-c4-context-container.svg';
const cssPath = '../src/css/custom.css';
const pilotDesignPath =
  '../docs/superpowers/specs/2026-07-27-drawio-svg-pilot-design.md';
const validatorPath = fileURLToPath(
  new URL(
    '../.codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs',
    import.meta.url,
  ),
);

function source(relativePath) {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

function xmlAttribute(tag, name) {
  return (
    tag.match(
      new RegExp(
        `(?:^|\\s)${name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}="([^"]*)"`,
        'u',
      ),
    )?.[1] ?? ''
  );
}

function selectorProperty(svg, selector, property) {
  const rule =
    svg.match(
      new RegExp(
        `${selector.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}\\s*\\{([^}]*)\\}`,
        'u',
      ),
    )?.[1] ?? '';
  return (
    rule.match(
      new RegExp(
        `(?:^|;)\\s*${property.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}\\s*:\\s*([^;]+)`,
        'u',
      ),
    )?.[1]?.trim() ?? ''
  );
}

function styleProperty(svg, className, property) {
  return selectorProperty(svg, `.${className}`, property);
}

function numericStyle(style, name) {
  return Number(
    style.match(
      new RegExp(
        `(?:^|;)${name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}=([^;]+)`,
        'u',
      ),
    )?.[1],
  );
}

function drawioCellTag(drawio, id) {
  return (
    drawio.match(
      new RegExp(
        `<mxCell\\b[^>]*\\bid="${id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}"[^>]*>`,
        'u',
      ),
    )?.[0] ?? ''
  );
}

function drawioCellBlock(drawio, id) {
  return (
    drawio.match(
      new RegExp(
        `<mxCell\\b[^>]*\\bid="${id.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}"[^>]*>[\\s\\S]*?<\\/mxCell>`,
        'u',
      ),
    )?.[0] ?? ''
  );
}

function relativeLuminance(hex) {
  const channels = hex
    .slice(1)
    .match(/../gu)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return (
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  );
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

test('publishes the MOD-02 Draw.io source and responsive SVG pair', async () => {
  const page = await source(pagePath);

  assert.doesNotMatch(page, /```mermaid/u);
  assert.match(
    page,
    /!\[[^\]]+\]\(\/img\/diagrams\/mod-02-c4-context-container\.svg\)/u,
  );
  assert.match(
    page,
    /<div className="architecture-diagram-scroll"[^>]*>[\s\S]*mod-02-c4-context-container\.svg[\s\S]*<\/div>/u,
  );

  const [drawio, svg, css] = await Promise.all([
    source(drawioPath),
    source(svgPath),
    source(cssPath),
  ]);

  assert.match(drawio, /<mxfile\b/u);
  assert.match(drawio, /<diagram\b[^>]*name="Context → Container"/u);
  assert.match(svg, /<svg\b/u);
  assert.match(svg, /\bviewBox="0 0 1200 1160"/u);
  const svgRoot = svg.match(/<svg\b[^>]*>/u)?.[0] ?? '';
  assert.doesNotMatch(svgRoot, /\bwidth=/u);
  assert.doesNotMatch(svgRoot, /\bheight=/u);
  assert.doesNotMatch(svg, /class="edge-label-background"/u);
  assert.match(svg, /class="edge-label"/u);
  assert.match(svg, /data-stroke-clearance-css="8"/u);
  assert.match(drawio, /html=0/u);
  assert.doesNotMatch(drawio, /html=1/u);
  assert.doesNotMatch(drawio, /labelBackgroundColor=/u);
  assert.match(
    css,
    /\.architecture-diagram-scroll\s*\{[^}]*overflow-x:\s*auto;/su,
  );
  assert.match(
    css,
    /\.architecture-diagram-scroll img\s*\{[^}]*width:\s*50rem;[^}]*max-width:\s*none;/su,
  );
  assert.match(
    page,
    /<div className="architecture-diagram-scroll" role="region" aria-label="[^"]+" tabIndex=\{0\}>/u,
  );
  assert.match(
    css,
    /\.theme-doc-markdown \.architecture-diagram-scroll:focus-visible\s*\{[^}]*outline:/su,
  );

  const majorLabels = [
    'Context：费用申报系统边界',
    'Container：展开费用申报系统',
    '员工',
    '费用申报系统',
    '银行支付服务',
    'Web 应用',
    '申报 API',
    '申报数据库',
    '支付任务执行器',
  ];

  for (const label of majorLabels) {
    assert.match(drawio, new RegExp(label, 'u'));
    assert.match(svg, new RegExp(label, 'u'));
  }

  const validator = spawnSync(
    process.execPath,
    [
      validatorPath,
      fileURLToPath(new URL(drawioPath, import.meta.url)),
      fileURLToPath(new URL(svgPath, import.meta.url)),
      ...majorLabels.flatMap((label) => ['--label', label]),
    ],
    {encoding: 'utf8'},
  );

  assert.equal(validator.status, 0, validator.stderr);
});

test('treats diagram thresholds as final CSS pixels at the 800px render width', async () => {
  const [drawio, svg] = await Promise.all([source(drawioPath), source(svgPath)]);
  const viewBox = xmlAttribute(svg.match(/<svg\b[^>]*>/u)?.[0] ?? '', 'viewBox')
    .split(/\s+/u)
    .map(Number);
  const renderedWidth = 800;
  const renderedScale = renderedWidth / viewBox[2];

  assert.equal(renderedScale, 2 / 3);

  const renderedFontThresholds = new Map([
    ['section-note', 15],
    ['node-title', 15],
    ['edge-label', 15],
    ['node-type', 10],
    ['badge', 10],
  ]);

  for (const [className, minimumCssPixels] of renderedFontThresholds) {
    const authoredPixels = Number.parseFloat(
      styleProperty(svg, className, 'font-size'),
    );
    assert.ok(
      authoredPixels * renderedScale >= minimumCssPixels,
      `${className} renders at ${authoredPixels * renderedScale}px; expected at least ${minimumCssPixels}px`,
    );
  }

  const expectedAuthoredSizes = {
    nodeTitle: Number.parseFloat(styleProperty(svg, 'node-title', 'font-size')),
    nodeType: Number.parseFloat(styleProperty(svg, 'node-type', 'font-size')),
    edgeLabel: Number.parseFloat(styleProperty(svg, 'edge-label', 'font-size')),
  };
  const nodeIds = [
    'employee',
    'expense-system',
    'bank-context',
    'employee-container',
    'web-app',
    'expense-api',
    'expense-db',
    'payment-worker',
    'bank-container',
  ];

  for (const nodeId of nodeIds) {
    assert.equal(
      numericStyle(xmlAttribute(drawioCellTag(drawio, nodeId), 'style'), 'fontSize'),
      expectedAuthoredSizes.nodeTitle,
      `${nodeId} title font must match the SVG authored size`,
    );
    assert.equal(
      numericStyle(
        xmlAttribute(drawioCellTag(drawio, `${nodeId}-type`), 'style'),
        'fontSize',
      ),
      expectedAuthoredSizes.nodeType,
      `${nodeId} role font must match the SVG authored size`,
    );
  }

  for (const relationTag of drawio.match(/<mxCell\b[^>]*\bedge="1"[^>]*>/gu) ??
    []) {
    assert.equal(
      numericStyle(xmlAttribute(relationTag, 'style'), 'fontSize'),
      expectedAuthoredSizes.edgeLabel,
    );
  }
});

test('keeps synchronized node geometry above rendered baseline and bottom-clearance thresholds', async () => {
  const [drawio, svg] = await Promise.all([source(drawioPath), source(svgPath)]);
  const renderedScale = 800 / 1200;
  const nodeIds = [
    'employee',
    'expense-system',
    'bank-context',
    'employee-container',
    'web-app',
    'expense-api',
    'expense-db',
    'payment-worker',
    'bank-container',
  ];
  const groups = [
    ...svg.matchAll(
      /<g\b[^>]*\bdata-node-id="([^"]+)"[^>]*\bdata-node-bounds="([^"]+)"[^>]*>([\s\S]*?)<\/g>/gu,
    ),
  ];

  assert.equal(groups.length, nodeIds.length);

  for (const [, nodeId, boundsValue, contents] of groups) {
    assert.ok(nodeIds.includes(nodeId), `unexpected measured node ${nodeId}`);
    const bounds = boundsValue.split(/\s+/u).map(Number);
    const titleTag =
      contents.match(
        /<text\b[^>]*\bdata-text-role="title"[^>]*>/u,
      )?.[0] ?? '';
    const typeTag =
      contents.match(/<text\b[^>]*\bdata-text-role="type"[^>]*>/u)?.[0] ??
      '';
    const titleBaseline = Number(xmlAttribute(titleTag, 'y'));
    const typeBaseline = Number(xmlAttribute(typeTag, 'y'));
    const nodeBottom = bounds[1] + bounds[3];

    assert.ok(titleTag, `${nodeId} must expose its title for rendered QA`);
    assert.ok(typeTag, `${nodeId} must expose its role for rendered QA`);
    assert.ok(
      (typeBaseline - titleBaseline) * renderedScale >= 22,
      `${nodeId} title/type baselines render too closely`,
    );
    assert.ok(
      (nodeBottom - typeBaseline) * renderedScale >= 14,
      `${nodeId} role baseline renders too close to the bottom edge`,
    );

    const drawioGeometry =
      drawioCellBlock(drawio, nodeId).match(/<mxGeometry\b[^>]*>/u)?.[0] ?? '';
    assert.deepEqual(
      [
        Number(xmlAttribute(drawioGeometry, 'x')),
        Number(xmlAttribute(drawioGeometry, 'y')),
        Number(xmlAttribute(drawioGeometry, 'width')),
        Number(xmlAttribute(drawioGeometry, 'height')),
      ],
      bounds,
      `${nodeId} geometry must remain synchronized`,
    );
  }
});

test('gives the five-CJK-glyph database title at least 16 rendered pixels of horizontal padding', async () => {
  const [drawio, svg] = await Promise.all([source(drawioPath), source(svgPath)]);
  const renderedScale = 800 / 1200;
  const databaseGroup =
    svg.match(
      /<g\b[^>]*\bdata-node-id="expense-db"[^>]*\bdata-node-bounds="([^"]+)"[^>]*>([\s\S]*?)<\/g>/u,
    ) ?? [];
  const bounds = (databaseGroup[1] ?? '').split(/\s+/u).map(Number);
  const title =
    (databaseGroup[2] ?? '').match(
      /<text\b[^>]*\bdata-text-role="title"[^>]*>([^<]+)<\/text>/u,
    )?.[1] ?? '';
  const authoredFontSize = Number.parseFloat(
    styleProperty(svg, 'node-title', 'font-size'),
  );
  const conservativeTitleWidth = [...title].length * authoredFontSize;
  const renderedHorizontalPadding =
    ((bounds[2] - conservativeTitleWidth) / 2) * renderedScale;

  assert.equal([...title].length, 5);
  assert.ok(
    renderedHorizontalPadding >= 16,
    `database title renders with only ${renderedHorizontalPadding}px horizontal padding per side`,
  );

  const databaseGeometry =
    drawioCellBlock(drawio, 'expense-db').match(/<mxGeometry\b[^>]*>/u)?.[0] ??
    '';
  assert.equal(Number(xmlAttribute(databaseGeometry, 'width')), bounds[2]);
});

test('reserves a rendered-clearance lane for the employee-to-Web use label', async () => {
  const [drawio, svg] = await Promise.all([source(drawioPath), source(svgPath)]);
  const renderedScale = 800 / 1200;
  const labelMatch =
    svg.match(
      /(<text\b[^>]*\bdata-edge-id="edge-employee-web"[^>]*>)([^<]+)<\/text>/u,
    ) ?? [];
  const labelTag = labelMatch[1] ?? '';
  const label = labelMatch[2] ?? '';
  const labelX = Number(xmlAttribute(labelTag, 'x'));
  const labelBaseline = Number(xmlAttribute(labelTag, 'y'));
  const labelFontSize = Number.parseFloat(
    styleProperty(svg, 'edge-label', 'font-size'),
  );
  const labelWidth = [...label].length * labelFontSize;
  const labelBox = {
    bottom: labelBaseline,
    left: labelX - labelWidth / 2,
    right: labelX + labelWidth / 2,
    top: labelBaseline - labelFontSize,
  };
  const connectorTag =
    svg.match(
      /<path\b[^>]*\bdata-edge-id="edge-employee-web"[^>]*>/u,
    )?.[0] ?? '';
  const connectorY = Number(
    xmlAttribute(connectorTag, 'd').match(/^M[0-9.]+ ([0-9.]+)H/u)?.[1],
  );
  const nodeBounds = new Map(
    [...svg.matchAll(/<g\b[^>]*data-node-id="([^"]+)"[^>]*data-node-bounds="([^"]+)"/gu)].map(
      ([, id, bounds]) => [id, bounds.split(/\s+/u).map(Number)],
    ),
  );
  const employeeBounds = nodeBounds.get('employee-container');
  const webBounds = nodeBounds.get('web-app');
  const boundaryGeometry =
    drawioCellBlock(drawio, 'container-boundary').match(
      /<mxGeometry\b[^>]*>/u,
    )?.[0] ?? '';
  const boundaryLeft = Number(xmlAttribute(boundaryGeometry, 'x'));
  const clearances = {
    arrow: (webBounds[0] - labelBox.right) * renderedScale,
    boundary: (labelBox.left - boundaryLeft) * renderedScale,
    employee: (labelBox.left - (employeeBounds[0] + employeeBounds[2])) *
      renderedScale,
    stroke: (connectorY - labelBox.bottom) * renderedScale,
    web: (webBounds[0] - labelBox.right) * renderedScale,
  };

  assert.ok(
    clearances.boundary >= 12,
    `use label crosses or crowds the boundary: ${clearances.boundary}px`,
  );
  assert.ok(clearances.employee >= 12);
  assert.ok(clearances.web >= 12);
  assert.ok(clearances.stroke >= 8);
  assert.ok(clearances.arrow >= 16);

  const drawioEdge =
    drawioCellBlock(drawio, 'edge-employee-web').match(
      /<mxPoint\b[^>]*\bas="offset"[^>]*>/u,
    )?.[0] ?? '';
  const drawioLabelX =
    ((employeeBounds[0] + employeeBounds[2] + webBounds[0]) / 2) +
    Number(xmlAttribute(drawioEdge, 'x'));
  const drawioLabelY =
    connectorY + Number(xmlAttribute(drawioEdge, 'y'));

  assert.equal(drawioLabelX, labelX);
  assert.equal(drawioLabelY, labelBaseline);
});

test('keeps every small role label at WCAG AA contrast on its node fill', async () => {
  const [drawio, svg] = await Promise.all([source(drawioPath), source(svgPath)]);
  const normalRoleColor = styleProperty(svg, 'node-type', 'fill').toUpperCase();
  const inverseRoleColor = selectorProperty(
    svg,
    '.node-type.inverse-type',
    'fill',
  ).toUpperCase();
  const rolePairs = [
    ['employee', '#ECE8E1'],
    ['expense-system', '#405D6B'],
    ['bank-context', '#ECE8E1'],
    ['employee-container', '#ECE8E1'],
    ['web-app', '#D9E5DA'],
    ['expense-api', '#D9E5DA'],
    ['expense-db', '#E8E1CF'],
    ['payment-worker', '#D9E5DA'],
    ['bank-container', '#ECE8E1'],
  ];

  assert.equal(normalRoleColor, '#55514B');
  assert.equal(inverseRoleColor, '#DCE7EA');

  for (const [nodeId, background] of rolePairs) {
    const group =
      svg.match(
        new RegExp(
          `<g\\b[^>]*\\bdata-node-id="${nodeId}"[^>]*>[\\s\\S]*?<\\/g>`,
          'u',
        ),
      )?.[0] ?? '';
    const typeTag =
      group.match(/<text\b[^>]*\bdata-text-role="type"[^>]*>/u)?.[0] ?? '';
    const classes = xmlAttribute(typeTag, 'class').split(/\s+/u);
    const foreground = classes.includes('inverse-type')
      ? inverseRoleColor
      : normalRoleColor;

    assert.ok(
      contrastRatio(foreground, background) >= 4.5,
      `${nodeId} role contrast must be at least 4.5:1`,
    );
    const drawioTypeStyle = xmlAttribute(
      drawioCellTag(drawio, `${nodeId}-type`),
      'style',
    );

    assert.equal(xmlAttribute(typeTag, 'fill'), '');
    assert.equal(
      drawioTypeStyle.match(/(?:^|;)fontColor=([^;]+)/u)?.[1]?.toUpperCase(),
      foreground,
    );
  }
});

test('synchronizes the complete directed relation inventory by stable edge id', async () => {
  const [drawio, svg] = await Promise.all([source(drawioPath), source(svgPath)]);
  const expectedRelations = [
    ['edge-employee-system', '提交费用', 'employee', 'expense-system'],
    ['edge-system-bank', '请求付款', 'expense-system', 'bank-context'],
    ['zoom-link', '展开目标系统', 'expense-system', 'container-boundary'],
    ['edge-employee-web', '使用', 'employee-container', 'web-app'],
    ['edge-web-api', '提交申报', 'web-app', 'expense-api'],
    ['edge-api-db', '读写', 'expense-api', 'expense-db'],
    ['edge-api-worker', '创建支付任务', 'expense-api', 'payment-worker'],
    ['edge-worker-bank', '请求付款', 'payment-worker', 'bank-container'],
  ];
  const drawioRelations =
    drawio.match(/<mxCell\b[^>]*\bedge="1"[^>]*>/gu) ?? [];
  const svgConnectors =
    svg.match(
      /<path\b[^>]*\bdata-edge-id="[^"]+"[^>]*\bdata-source="[^"]+"[^>]*\bdata-target="[^"]+"[^>]*>/gu,
    ) ?? [];
  const svgLabels = [
    ...svg.matchAll(
      /(<text\b[^>]*\bclass="[^"]*\bedge-label\b[^"]*"[^>]*\bdata-edge-id="[^"]+"[^>]*>)([^<]*)<\/text>/gu,
    ),
  ];

  assert.deepEqual(
    drawioRelations.map((tag) => [
      xmlAttribute(tag, 'id'),
      xmlAttribute(tag, 'value'),
      xmlAttribute(tag, 'source'),
      xmlAttribute(tag, 'target'),
    ]),
    expectedRelations,
  );
  assert.equal(svgConnectors.length, expectedRelations.length);
  assert.equal(svgLabels.length, expectedRelations.length);

  const labelsByEdgeId = new Map(
    svgLabels.map(([, tag, label]) => [xmlAttribute(tag, 'data-edge-id'), label]),
  );
  assert.deepEqual(
    svgConnectors.map((tag) => [
      xmlAttribute(tag, 'data-edge-id'),
      labelsByEdgeId.get(xmlAttribute(tag, 'data-edge-id')),
      xmlAttribute(tag, 'data-source'),
      xmlAttribute(tag, 'data-target'),
    ]),
    expectedRelations,
  );

  for (const connector of svgConnectors) {
    assert.match(xmlAttribute(connector, 'marker-end'), /^url\(#arrow-/u);
  }
  for (const [, labelTag] of svgLabels) {
    assert.equal(xmlAttribute(labelTag, 'data-stroke-clearance-css'), '8');
    assert.equal(xmlAttribute(labelTag, 'data-arrow-clearance-css'), '16');
    assert.equal(xmlAttribute(labelTag, 'data-node-clearance-css'), '12');
  }
});

test('uses the canonical MOD-02 route in the pilot design', async () => {
  const design = await source(pilotDesignPath);

  assert.match(design, /Inspect `\/modeling\/mod-02`/u);
  assert.doesNotMatch(design, /\/modeling\/c4-context-container/u);
});
