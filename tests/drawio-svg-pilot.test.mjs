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

function parseOrthogonalPath(data) {
  const tokens =
    data.match(/[MHV]|-?(?:\d+(?:\.\d*)?|\.\d+)/gu) ?? [];
  const points = [];
  let cursor = 0;
  let x = 0;
  let y = 0;

  while (cursor < tokens.length) {
    const command = tokens[cursor];
    cursor += 1;
    if (command === 'M') {
      x = Number(tokens[cursor]);
      y = Number(tokens[cursor + 1]);
      cursor += 2;
    } else if (command === 'H') {
      x = Number(tokens[cursor]);
      cursor += 1;
    } else if (command === 'V') {
      y = Number(tokens[cursor]);
      cursor += 1;
    } else {
      throw new Error(`Unsupported path command ${command}`);
    }
    points.push({x, y});
  }

  return points;
}

function conservativeLabelBounds(tag, label, fontSize) {
  const x = Number(xmlAttribute(tag, 'x'));
  const bottom = Number(xmlAttribute(tag, 'y'));
  const width = [...label].length * fontSize;
  const anchor = xmlAttribute(tag, 'text-anchor') || 'start';
  const left =
    anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;

  return {
    bottom,
    left,
    right: left + width,
    top: bottom - fontSize,
  };
}

function rectangleDistance(first, second) {
  const horizontal = Math.max(
    second.left - first.right,
    first.left - second.right,
    0,
  );
  const vertical = Math.max(
    second.top - first.bottom,
    first.top - second.bottom,
    0,
  );
  return Math.hypot(horizontal, vertical);
}

function boundaryDistance(label, boundary) {
  const labelInsideBoundary =
    label.left >= boundary.left &&
    label.right <= boundary.right &&
    label.top >= boundary.top &&
    label.bottom <= boundary.bottom;

  if (labelInsideBoundary) {
    return Math.min(
      label.left - boundary.left,
      boundary.right - label.right,
      label.top - boundary.top,
      boundary.bottom - label.bottom,
    );
  }

  return rectangleDistance(label, boundary);
}

function segmentDistance(label, start, end) {
  return rectangleDistance(label, {
    bottom: Math.max(start.y, end.y),
    left: Math.min(start.x, end.x),
    right: Math.max(start.x, end.x),
    top: Math.min(start.y, end.y),
  });
}

function projectedInterval(points, axis) {
  const values = points.map((point) => point.x * axis.x + point.y * axis.y);
  return {maximum: Math.max(...values), minimum: Math.min(...values)};
}

function intervalGap(first, second) {
  return Math.max(
    second.minimum - first.maximum,
    first.minimum - second.maximum,
  );
}

function markerGeometry(svg, connectorTag, points) {
  const markerId = xmlAttribute(connectorTag, 'marker-end').match(
    /^url\(#([^)]+)\)$/u,
  )?.[1];
  const markerBlock =
    svg.match(
      new RegExp(
        `<marker\\b[^>]*\\bid="${markerId}"[^>]*>[\\s\\S]*?<\\/marker>`,
        'u',
      ),
    )?.[0] ?? '';
  const markerTag = markerBlock.match(/<marker\b[^>]*>/u)?.[0] ?? '';
  const markerPathTag = markerBlock.match(/<path\b[^>]*>/u)?.[0] ?? '';
  const markerCoordinates = (
    xmlAttribute(markerPathTag, 'd').match(
      /-?(?:\d+(?:\.\d*)?|\.\d+)/gu,
    ) ?? []
  ).map(Number);
  const markerPoints = [];

  for (let index = 0; index < markerCoordinates.length; index += 2) {
    markerPoints.push({
      x: markerCoordinates[index],
      y: markerCoordinates[index + 1],
    });
  }

  const markerWidth = Number(xmlAttribute(markerTag, 'markerWidth'));
  const markerHeight = Number(xmlAttribute(markerTag, 'markerHeight'));
  const viewBox = (xmlAttribute(markerTag, 'viewBox') ||
    `0 0 ${markerWidth} ${markerHeight}`)
    .split(/\s+/u)
    .map(Number);
  const refX = Number(xmlAttribute(markerTag, 'refX'));
  const refY = Number(xmlAttribute(markerTag, 'refY'));
  const strokeWidth = Number(xmlAttribute(connectorTag, 'stroke-width'));
  const endpoint = points.at(-1);
  const previous = points.at(-2);
  const magnitude = Math.hypot(
    endpoint.x - previous.x,
    endpoint.y - previous.y,
  );
  const axis = {
    x: (endpoint.x - previous.x) / magnitude,
    y: (endpoint.y - previous.y) / magnitude,
  };
  const perpendicular = {x: -axis.y, y: axis.x};
  const viewportScaleX = markerWidth / viewBox[2];
  const viewportScaleY = markerHeight / viewBox[3];
  const markerUnitScale =
    xmlAttribute(markerTag, 'markerUnits') === 'strokeWidth' ? strokeWidth : 1;
  const scale = markerUnitScale * viewportScaleX;

  assert.equal(xmlAttribute(markerTag, 'markerUnits'), 'strokeWidth');
  assert.equal(
    viewportScaleX,
    viewportScaleY,
    'marker viewBox must scale uniformly into its viewport',
  );
  assert.ok(markerPoints.length >= 3);
  for (const point of markerPoints) {
    assert.ok(point.x >= viewBox[0] && point.x <= viewBox[0] + viewBox[2]);
    assert.ok(point.y >= viewBox[1] && point.y <= viewBox[1] + viewBox[3]);
  }

  return {
    axis,
    points: markerPoints.map((point) => ({
      x:
        endpoint.x +
        axis.x * (point.x - refX) * scale +
        perpendicular.x * (point.y - refY) * scale,
      y:
        endpoint.y +
        axis.y * (point.x - refX) * scale +
        perpendicular.y * (point.y - refY) * scale,
    })),
  };
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

test('keeps all eight relationship labels clear of real markers, strokes, nodes, and boundaries', async () => {
  const [drawio, svg] = await Promise.all([source(drawioPath), source(svgPath)]);
  const renderedScale = 800 / 1200;
  const labelFontSize = Number.parseFloat(
    styleProperty(svg, 'edge-label', 'font-size'),
  );
  const nodeBounds = new Map(
    [...svg.matchAll(/<g\b[^>]*data-node-id="([^"]+)"[^>]*data-node-bounds="([^"]+)"/gu)].map(
      ([, id, bounds]) => {
        const [x, y, width, height] = bounds.split(/\s+/u).map(Number);
        return [
          id,
          {
            bottom: y + height,
            left: x,
            right: x + width,
            top: y,
          },
        ];
      },
    ),
  );
  const boundaryGeometry =
    drawioCellBlock(drawio, 'container-boundary').match(
      /<mxGeometry\b[^>]*>/u,
    )?.[0] ?? '';
  const boundaryX = Number(xmlAttribute(boundaryGeometry, 'x'));
  const boundaryY = Number(xmlAttribute(boundaryGeometry, 'y'));
  const boundary = {
    bottom: boundaryY + Number(xmlAttribute(boundaryGeometry, 'height')),
    left: boundaryX,
    right: boundaryX + Number(xmlAttribute(boundaryGeometry, 'width')),
    top: boundaryY,
  };
  const relationIds = [
    'edge-employee-system',
    'edge-system-bank',
    'zoom-link',
    'edge-employee-web',
    'edge-web-api',
    'edge-api-db',
    'edge-api-worker',
    'edge-worker-bank',
  ];
  const containerRelationIds = new Set([
    'edge-employee-web',
    'edge-web-api',
    'edge-api-db',
    'edge-api-worker',
    'edge-worker-bank',
  ]);

  for (const edgeId of relationIds) {
    const connectorTag =
      svg.match(
        new RegExp(
          `<path\\b[^>]*\\bdata-edge-id="${edgeId}"[^>]*>`,
          'u',
        ),
      )?.[0] ?? '';
    const labelMatch =
      svg.match(
        new RegExp(
          `(<text\\b[^>]*\\bdata-edge-id="${edgeId}"[^>]*>)([^<]+)<\\/text>`,
          'u',
        ),
      ) ?? [];
    const labelTag = labelMatch[1] ?? '';
    const label = labelMatch[2] ?? '';
    const labelBounds = conservativeLabelBounds(
      labelTag,
      label,
      labelFontSize,
    );
    const connectorPoints = parseOrthogonalPath(
      xmlAttribute(connectorTag, 'd'),
    );
    const marker = markerGeometry(svg, connectorTag, connectorPoints);
    const labelCorners = [
      {x: labelBounds.left, y: labelBounds.top},
      {x: labelBounds.right, y: labelBounds.top},
      {x: labelBounds.right, y: labelBounds.bottom},
      {x: labelBounds.left, y: labelBounds.bottom},
    ];
    const arrowClearance =
      intervalGap(
        projectedInterval(labelCorners, marker.axis),
        projectedInterval(marker.points, marker.axis),
      ) * renderedScale;
    const strokeClearance =
      Math.min(
        ...connectorPoints.slice(1).map((point, index) =>
          segmentDistance(labelBounds, connectorPoints[index], point),
        ),
      ) * renderedScale;
    const sourceId = xmlAttribute(connectorTag, 'data-source');
    const targetId = xmlAttribute(connectorTag, 'data-target');
    const clearanceTargets = [
      [sourceId, nodeBounds.get(sourceId)],
      [
        targetId,
        targetId === 'container-boundary'
          ? boundary
          : nodeBounds.get(targetId),
      ],
    ];

    if (
      containerRelationIds.has(edgeId) &&
      sourceId !== 'container-boundary' &&
      targetId !== 'container-boundary'
    ) {
      clearanceTargets.push(['container-boundary', boundary]);
    }

    assert.ok(
      arrowClearance >= 16,
      `${edgeId} has only ${arrowClearance}px of real marker clearance`,
    );
    assert.ok(
      strokeClearance >= 8,
      `${edgeId} has only ${strokeClearance}px of stroke clearance`,
    );

    for (const [targetId, targetBounds] of clearanceTargets) {
      const authoredClearance =
        targetId === 'container-boundary'
          ? boundaryDistance(labelBounds, targetBounds)
          : rectangleDistance(labelBounds, targetBounds);
      const renderedClearance = authoredClearance * renderedScale;

      assert.ok(
        renderedClearance >= 12,
        `${edgeId} has only ${renderedClearance}px of ${targetId} clearance`,
      );
    }
  }
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
