import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = async (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const cssBlock = (source, header) => {
  const start = source.indexOf(header);
  assert.notEqual(start, -1, `missing CSS block: ${header}`);
  const open = source.indexOf('{', start + header.length);
  assert.notEqual(open, -1, `missing opening brace: ${header}`);

  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(open + 1, index);
  }

  assert.fail(`missing closing brace: ${header}`);
};

const declaration = (block, property) => {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = block.match(new RegExp(`(?:^|\\n)\\s*${escapedProperty}:\\s*([^;]+);`, 'u'));
  assert.ok(match, `missing declaration: ${property}`);
  return match[1].trim();
};

const parseHex = (value) => {
  const match = value.match(/^#([0-9a-f]{6})$/iu);
  assert.ok(match, `expected six-digit hex color, received ${value}`);
  return [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16));
};

const relativeLuminance = (rgb) => {
  const linear = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

const contrastRatio = (foreground, background) => {
  const [lighter, darker] = [relativeLuminance(parseHex(foreground)), relativeLuminance(parseHex(background))]
    .sort((left, right) => right - left);
  return (lighter + 0.05) / (darker + 0.05);
};

test('publishes the approved homepage design contract', async () => {
  const design = await read('DESIGN.md');

  for (const heading of [
    '## Source of truth',
    '## Brand',
    '## Product goals',
    '## Personas and jobs',
    '## Information architecture',
    '## Design principles',
    '## Visual language',
    '## Components',
    '## Accessibility',
    '## Responsive behavior',
    '## Interaction states',
    '## Content voice',
    '## Implementation constraints',
    '## Open questions',
  ]) {
    assert.match(design, new RegExp(`^${heading}$`, 'mu'));
  }

  assert.match(design, /Status: Active/u);
  assert.match(design, /在复杂系统里 做清醒的选择/u);
  assert.match(design, /科技感来自结构、关系、状态与信息秩序/u);
  assert.match(design, /标题不得以中文或英文句号结尾/u);
  assert.match(design, /1440 × 1000/u);
  assert.match(design, /390 × 844/u);
  assert.match(design, /不增加 npm 依赖/u);
});

test('uses the approved decision-observatory narrative in exact order', async () => {
  const homepage = await read('src/pages/index.tsx');
  const orderedCopy = [
    '在复杂系统里 做清醒的选择',
    '一张持续展开的架构坐标',
    '从问题出发',
    '正在研究的系统',
    '下一步，让完整内容变得更轻',
    '这是一份开放的研究记录',
  ];

  let previous = -1;
  for (const copy of orderedCopy) {
    const position = homepage.indexOf(copy);
    assert.ok(position > previous, `${copy} must follow the preceding section`);
    previous = position;
  }

  for (const removed of [
    '从高级工程师到架构设计者。',
    '初版先完成一套完整的架构知识体系',
    '经典架构迁移地图',
    '五步读懂一个软件架构主题',
    '为上百个案例留下稳定入口',
  ]) {
    assert.doesNotMatch(homepage, new RegExp(removed, 'u'));
  }
});

test('keeps every visible heading source free of terminal punctuation', async () => {
  const [homepage, caseCatalogSource, generatedCatalogSource] = await Promise.all([
    read('src/pages/index.tsx'),
    read('src/data/caseCatalog.ts'),
    read('src/generated/case-catalog.json'),
  ]);

  const configuredTitles = (declaration) => {
    const block = homepage.match(
      new RegExp(`const ${declaration}:[^=]+ = \\[([\\s\\S]*?)\\n\\] as const;`, 'u'),
    );
    assert.ok(block, `${declaration} must remain a literal readonly array`);
    return [...block[1].matchAll(/\btitle: '([^']+)'/gu)].map((match) => match[1]);
  };

  assert.match(homepage, /homepageEntries\.map\([\s\S]*<Heading as="h3">\{entry\.title\}<\/Heading>/u);
  assert.match(homepage, /futureOutputs\.map\([\s\S]*<Heading as="h3">\{output\.title\}<\/Heading>/u);
  assert.match(homepage, /<Heading as="h3">\{leadCase\.title\}<\/Heading>/u);
  assert.match(homepage, /homepageCases\.slice\(1\)\.map\([\s\S]*\{caseStudy\.title\}/u);
  assert.match(caseCatalogSource, /export const featuredCases = caseCatalog\.filter\(\(\{featured\}\) => featured\)/u);

  const generatedCatalog = JSON.parse(generatedCatalogSource);
  const headingSources = {
    static: [
      ...homepage.matchAll(/<Heading[^>]*>([^<{]+)<\/Heading>/gu),
      ...homepage.matchAll(/<SectionIntro[^>]*\btitle="([^"]+)"/gu),
    ].map((match) => match[1].trim()),
    homepageEntries: configuredTitles('homepageEntries'),
    futureOutputs: configuredTitles('futureOutputs'),
    featuredCases: generatedCatalog
      .filter(({featured}) => featured)
      .slice(0, 3)
      .map(({title}) => title),
  };

  const requiredHeadingSources = new Set(['static', 'homepageEntries', 'futureOutputs']);
  for (const [source, headings] of Object.entries(headingSources)) {
    if (requiredHeadingSources.has(source)) {
      assert.ok(headings.length > 0, `${source} must contribute visible headings`);
    }
    for (const heading of headings) {
      assert.doesNotMatch(heading, /[。.]+$/u, `${source}: ${heading}`);
    }
  }
});

test('publishes three problem-led entrances and generated research highlights', async () => {
  const homepage = await read('src/pages/index.tsx');

  for (const [title, href] of [
    ['建立判断坐标', '/paths'],
    ['拆解真实系统', '/cases'],
    ['回到证据现场', '/references'],
  ]) {
    assert.match(homepage, new RegExp(`title: '${title}'[\\s\\S]*href: '${href}'`, 'u'));
  }

  assert.match(homepage, /const homepageCases = featuredCases\.slice\(0, 3\)/u);
  assert.doesNotMatch(homepage, /secondCollectionCases|groupCasesBySeries|migrationGroups/u);
  assert.match(homepage, /homepageCases\.slice\(1\)\.map/u);
});

test('uses exact restrained homepage tokens in both theme scopes', async () => {
  const [styles, globalStyles] = await Promise.all([
    read('src/pages/index.module.css'),
    read('src/css/custom.css'),
  ]);

  const light = cssBlock(globalStyles, ':root');
  const dark = cssBlock(globalStyles, "[data-theme='dark']");
  for (const [token, lightValue, darkValue] of [
    ['--atlas-hero', '#242522', '#181916'],
    ['--atlas-hero-ink', '#eee8de', '#f0ebe2'],
    ['--atlas-hero-muted', 'rgba(238, 232, 222, 0.66)', 'rgba(240, 235, 226, 0.68)'],
  ]) {
    assert.equal(declaration(light, token), lightValue);
    assert.equal(declaration(dark, token), darkValue);
  }

  assert.equal(declaration(cssBlock(styles, '.hero'), 'background'), 'var(--atlas-hero)');
});

test('scopes hero typography, focus, responsive density, and reduced motion', async () => {
  const [homepage, styles] = await Promise.all([
    read('src/pages/index.tsx'),
    read('src/pages/index.module.css'),
  ]);
  const heroTitle = cssBlock(styles, '.heroTitle');
  const heroFocus = cssBlock(styles, '.hero a:focus-visible');
  const tablet = cssBlock(styles, '@media (max-width: 996px)');
  const mobile = cssBlock(styles, '@media screen and (max-width: 700px)');
  const reducedMotion = cssBlock(styles, '@media (prefers-reduced-motion: reduce)');

  assert.match(homepage, /<div className=\{styles\.heroTitle\}>\s*<Heading as="h1">/u);
  assert.equal(declaration(heroTitle, 'font-size'), 'clamp(3rem, 5.4vw, 4.25rem)');
  assert.equal(declaration(heroFocus, 'outline'), '3px solid var(--atlas-hero-ink)');
  assert.match(tablet, /\.heroRelations\s*\{[^}]*opacity:\s*0\.32;/u);
  assert.match(tablet, /\.researchGrid\s*\{[^}]*grid-template-columns:\s*1fr;/u);
  assert.match(tablet, /\.futureList\s*\{[^}]*grid-template-columns:\s*1fr;/u);
  assert.match(mobile, /\.heroTitle\s*\{[^}]*font-size:\s*clamp\(2\.25rem, 11vw, 3rem\);/u);
  assert.match(mobile, /\.statusRail div:nth-child\(n \+ 3\)\s*\{[^}]*display:\s*none;/u);
  assert.match(mobile, /\.entryRow p\s*\{[^}]*display:\s*none;/u);
  assert.match(reducedMotion, /\.entryRow,[\s\S]*\.primaryAction,[\s\S]*\.secondaryAction\s*\{[^}]*transition:\s*none;/u);
});

test('keeps hero labels, focused secondary actions, and focus indicators contrast-safe', async () => {
  const [styles, globalStyles] = await Promise.all([
    read('src/pages/index.module.css'),
    read('src/css/custom.css'),
  ]);
  const heroLabelColor = declaration(cssBlock(styles, '.heroLabel'), 'color');
  const focusColor = declaration(cssBlock(styles, '.hero a:focus-visible'), 'outline')
    .match(/var\((--[^)]+)\)$/u)?.[1];
  const secondaryInteraction = cssBlock(
    styles,
    '.secondaryAction:hover,\n.secondaryAction:focus-visible',
  );
  const secondaryTextColor = declaration(secondaryInteraction, 'color');
  const secondaryBorderColor = declaration(secondaryInteraction, 'border-color');
  assert.equal(heroLabelColor, 'var(--atlas-hero-ink)');
  assert.equal(focusColor, '--atlas-hero-ink');
  assert.equal(secondaryTextColor, 'var(--atlas-hero-ink)');
  assert.equal(secondaryBorderColor, 'var(--atlas-hero-ink)');

  for (const theme of [cssBlock(globalStyles, ':root'), cssBlock(globalStyles, "[data-theme='dark']")]) {
    const background = declaration(theme, '--atlas-hero');
    const label = declaration(theme, heroLabelColor.slice(4, -1));
    const focus = declaration(theme, focusColor);
    const secondaryText = declaration(theme, secondaryTextColor.slice(4, -1));
    assert.ok(contrastRatio(label, background) >= 4.5, 'hero label contrast must be at least 4.5:1');
    assert.ok(
      contrastRatio(secondaryText, background) >= 4.5,
      'focused secondary action text contrast must be at least 4.5:1',
    );
    assert.ok(contrastRatio(focus, background) >= 3, 'hero focus outline contrast must be at least 3:1');
  }
});

test('forbids decorative effects and oversized ordinary radii in homepage styles', async () => {
  const styles = await read('src/pages/index.module.css');
  assert.doesNotMatch(styles, /\b(?:backdrop-filter|filter|box-shadow|text-shadow)\s*:/iu);
  const featherSelector = '.roadmapMedia::after';
  const featherBlock = cssBlock(styles, featherSelector);
  const featherBackgrounds = [...featherBlock.matchAll(/(?:^|\n)\s*background\s*:/gu)];
  assert.equal(featherBackgrounds.length, 1, 'roadmap feather must have one background declaration');

  const featherBackgroundDeclaration = featherBlock.match(
    /(?:^|\n)(\s*background:\s*[^;]+;)/u,
  );
  assert.ok(featherBackgroundDeclaration, 'roadmap feather background declaration must be parseable');
  const featherBackground = declaration(featherBlock, 'background').replace(/\s+/gu, ' ');
  assert.equal(
    featherBackground,
    'linear-gradient(90deg, var(--atlas-paper) 0, transparent 7%, transparent 93%, var(--atlas-paper) 100%), ' +
      'linear-gradient(var(--atlas-paper) 0, transparent 9%, transparent 90%, var(--atlas-paper) 100%)',
  );
  assert.equal([...featherBackground.matchAll(/linear-gradient\(/gu)].length, 2);
  assert.doesNotMatch(featherBackground, /(?:radial|conic)-gradient\(/u);

  const featherStart = styles.indexOf(featherSelector);
  const featherOpen = styles.indexOf('{', featherStart + featherSelector.length);
  const declarationOffset = featherBackgroundDeclaration.index +
    featherBackgroundDeclaration[0].length - featherBackgroundDeclaration[1].length;
  const declarationStart = featherOpen + 1 + declarationOffset;
  const declarationEnd = declarationStart + featherBackgroundDeclaration[1].length;
  const stylesWithoutRoadmapFeatherBackground =
    styles.slice(0, declarationStart) + styles.slice(declarationEnd);
  assert.doesNotMatch(stylesWithoutRoadmapFeatherBackground, /\b[\w-]*gradient\s*\(/iu);

  for (const match of styles.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
    const selector = match[1].trim();
    for (const radius of match[2].matchAll(/border-radius\s*:\s*([^;]+);/gu)) {
      const value = radius[1].trim();
      if (selector === '.heroRelations span') {
        assert.equal(value, '50%', 'relationship nodes must use the explicit circular radius');
        continue;
      }

      const lengths = value.split(/\s+/u);
      assert.ok(
        lengths.length <= 4 && lengths.every((length) => /^\d+(?:\.\d+)?px$/u.test(length)),
        `${selector} must use only explicit px radii`,
      );
      assert.ok(
        lengths.every((length) => Number.parseFloat(length) <= 6),
        `${selector} exceeds the 6px radius limit`,
      );
    }
  }
});

test('keeps roadmap details available without forcing them into the reading flow', async () => {
  const [homepage, styles] = await Promise.all([
    read('src/pages/index.tsx'),
    read('src/pages/index.module.css'),
  ]);

  assert.match(homepage, /初版路线图 · 2026-08-05 快照/u);
  assert.match(homepage, /<button[\s\S]*aria-describedby="roadmap-status-note"[\s\S]*状态与图例说明/u);
  assert.match(homepage, /id="roadmap-status-note"[\s\S]*role="note"/u);
  assert.match(homepage, /<details className=\{styles\.roadmapMobileDetails\}>/u);
  assert.match(homepage, /<summary>关于这张路线图<\/summary>/u);
  assert.match(homepage, /href=\{roadmapSrc\}[\s\S]*target="_blank"[\s\S]*查看大图/u);

  for (const text of [
    '历史快照',
    '绿色表示快照当日已完成',
    '橙色表示快照当日当前阶段',
    '蓝色表示快照当日待执行',
    '验证、评审、发布与线上检查',
    'docs/content-backlog.md',
  ]) {
    assert.match(homepage, new RegExp(text, 'u'));
  }

  assert.match(homepage, /width=\{1672\}/u);
  assert.match(homepage, /height=\{941\}/u);
  assert.match(homepage, /loading="lazy"/u);
  assert.match(homepage, /decoding="async"/u);
  assert.doesNotMatch(homepage, /data-(?:status|backlog|legend)/u);
  assert.match(styles, /\.roadmapMedia::after/u);
  assert.match(styles, /\.roadmapDesktopInfo:hover[\s\S]*\.roadmapInfoPanel/u);
  assert.match(styles, /\.roadmapDesktopInfo:focus-within[\s\S]*\.roadmapInfoPanel/u);
  const hiddenPanel = cssBlock(styles, '.roadmapInfoPanel');
  assert.equal(declaration(hiddenPanel, 'visibility'), 'hidden');
  assert.equal(declaration(hiddenPanel, 'pointer-events'), 'none');
  assert.equal(
    declaration(hiddenPanel, 'transition').replace(/\s+/gu, ' '),
    'visibility 0s linear 140ms, opacity 140ms ease',
  );
  assert.doesNotMatch(hiddenPanel, /\btransform\s*:/u);
  const visiblePanel = cssBlock(
    styles,
    '.roadmapDesktopInfo:hover .roadmapInfoPanel,\n.roadmapDesktopInfo:focus-within .roadmapInfoPanel',
  );
  assert.equal(declaration(visiblePanel, 'visibility'), 'visible');
  assert.equal(declaration(visiblePanel, 'pointer-events'), 'auto');
  assert.doesNotMatch(visiblePanel, /\btransform\s*:/u);
  const hoverBridge = cssBlock(styles, '.roadmapInfoPanel::after');
  assert.equal(declaration(hoverBridge, 'bottom'), '-0.75rem');
  assert.equal(declaration(hoverBridge, 'height'), '0.75rem');
  assert.doesNotMatch(
    hoverBridge,
    /\b(?:background|border|box-shadow|top|transform|transition)\s*:/u,
  );
  assert.doesNotMatch(cssBlock(styles, '.roadmapMedia'), /\bborder\s*:/u);
  assert.doesNotMatch(cssBlock(styles, '.roadmapInfoPanel'), /\bbox-shadow\s*:/u);

  const figure = homepage.match(
    /<figure className=\{styles\.roadmapFigure\}>([\s\S]*?)\n\s*<\/figure>/u,
  );
  assert.ok(figure, 'roadmap figure must remain statically inspectable');
  assert.match(figure[1].trim(), /<figcaption className=\{styles\.roadmapMeta\}>[\s\S]*<\/figcaption>$/u);
  assert.ok(
    figure[1].indexOf('roadmapMobileDetails') < figure[1].indexOf('<figcaption'),
    'mobile disclosure must precede the final figcaption',
  );
});
