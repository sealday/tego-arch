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
    '在复杂系统里',
    '做清醒的选择',
    '建立架构判断的主线',
    '从问题出发',
    '正在研究的系统',
    '从理解架构到做出取舍',
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
  assert.match(
    homepage,
    /futureDirections\.map\([\s\S]*<Heading as="h3">\{direction\.title\}<\/Heading>[\s\S]*<p>\{direction\.description\}<\/p>/u,
  );
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
    futureDirections: configuredTitles('futureDirections'),
    featuredCases: generatedCatalog
      .filter(({featured}) => featured)
      .slice(0, 3)
      .map(({title}) => title),
  };

  const requiredHeadingSources = new Set(['static', 'homepageEntries', 'futureDirections']);
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
  assert.match(mobile, /\.heroTitle\s*\{[^}]*max-width:\s*100%;/u);
  assert.match(mobile, /\.statusRail div:nth-child\(n \+ 3\)\s*\{[^}]*display:\s*none;/u);
  assert.match(mobile, /\.entryRow p\s*\{[^}]*display:\s*none;/u);
  assert.match(reducedMotion, /\.entryRow,[\s\S]*\.primaryAction,[\s\S]*\.secondaryAction\s*\{[^}]*transition:\s*none;/u);
});

test('keeps both homepage promise phrases intact on every viewport', async () => {
  const [homepage, styles] = await Promise.all([
    read('src/pages/index.tsx'),
    read('src/pages/index.module.css'),
  ]);
  const phrase = cssBlock(styles, '.heroTitlePhrase');

  assert.equal((homepage.match(/<Heading as="h1">/gu) ?? []).length, 1);
  assert.match(
    homepage,
    /<Heading as="h1">\s*<span className=\{styles\.heroTitlePhrase\}>在复杂系统里<\/span>\{' '\}\s*<span className=\{styles\.heroTitlePhrase\}>做清醒的选择<\/span>\s*<\/Heading>/u,
  );
  assert.doesNotMatch(homepage, /(?:&nbsp;|\u00a0)/u);
  assert.equal(declaration(phrase, 'display'), 'block');
  assert.equal(declaration(phrase, 'white-space'), 'nowrap');
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
  assert.doesNotMatch(styles, /\b[\w-]*gradient\s*\(/iu);

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

test('presents a themed judgment path without homepage project status', async () => {
  const [homepage, styles] = await Promise.all([
    read('src/pages/index.tsx'),
    read('src/pages/index.module.css'),
  ]);

  assert.match(homepage, /import \{ThemedComponent\} from '@docusaurus\/theme-common';/u);
  const themedImage = homepage.match(
    /function ThemedRoadmapImage\([\s\S]*?\n\}/u,
  );
  assert.ok(themedImage, 'themed roadmap image component must remain statically inspectable');
  assert.match(themedImage[0], /theme === 'dark' \? darkImageSrc : lightImageSrc/u);
  assert.match(themedImage[0], /width=\{1672\}/u);
  assert.match(themedImage[0], /height=\{941\}/u);
  assert.match(themedImage[0], /loading="lazy"/u);
  assert.match(themedImage[0], /decoding="async"/u);
  assert.match(themedImage[0], /alt=\{alt\}/u);

  const roadmapSection = homepage.match(
    /function RoadmapSection\(\): ReactNode \{([\s\S]*?)\n\}\n\nfunction EntrySection/u,
  );
  assert.ok(roadmapSection, 'judgment path section must remain statically inspectable');
  for (const path of [
    '/img/illustrations/tego-arch-judgment-path-light.png',
    '/img/illustrations/tego-arch-judgment-path-dark.png',
  ]) {
    assert.match(roadmapSection[1], new RegExp(path.replaceAll('/', String.raw`\/`).replace('.', String.raw`\.`), 'u'));
  }
  assert.match(
    roadmapSection[1],
    /alt="架构判断从需求与约束出发，经过建模、模式与治理，在案例和复盘中逐步形成"/u,
  );
  assert.doesNotMatch(
    homepage,
    /RoadmapStatusContent|roadmapDesktopInfo|roadmapInfoPanel|roadmapMobileDetails|初版路线图 · 2026-08-05 快照|状态与图例说明|查看项目进度/u,
  );
  assert.doesNotMatch(styles, /\.roadmap(?:DesktopInfo|InfoControl|InfoPanel|MobileDetails|Meta)/u);
  assert.doesNotMatch(styles, /\.roadmapMedia::after/u);
  assert.doesNotMatch(cssBlock(styles, '.roadmapMedia'), /\b(?:border|box-shadow)\s*:/u);
  assert.equal(
    declaration(cssBlock(styles, '.roadmapSection'), 'background'),
    'var(--atlas-paper)',
  );
  assert.equal(
    declaration(cssBlock(styles, '.roadmapMedia'), 'background'),
    'var(--atlas-paper)',
  );
});

test('presents themed usage modes with single bilingual card titles', async () => {
  const [homepage, styles] = await Promise.all([
    read('src/pages/index.tsx'),
    read('src/pages/index.module.css'),
  ]);

  const futureDirectionsSection = homepage.match(
    /function FutureDirectionsSection\(\): ReactNode \{([\s\S]*?)\n\}\n\nfunction ContributionBand/u,
  );
  assert.ok(futureDirectionsSection, 'future directions section must remain statically inspectable');
  for (const path of [
    '/img/illustrations/tego-arch-use-modes-light.png',
    '/img/illustrations/tego-arch-use-modes-dark.png',
  ]) {
    assert.match(
      futureDirectionsSection[1],
      new RegExp(path.replaceAll('/', String.raw`\/`).replace('.', String.raw`\.`), 'u'),
    );
  }
  assert.match(
    futureDirectionsSection[1],
    /alt="一套架构知识体系可以用于快速校准决策、组织学习路径和理解该项目的真实架构取舍"/u,
  );
  assert.match(
    futureDirectionsSection[1],
    /futureDirections\.map\([\s\S]*<Heading as="h3">\{direction\.title\}<\/Heading>[\s\S]*<p>\{direction\.description\}<\/p>/u,
  );
  assert.match(styles, /\.futureRoadmap\s*\{[^}]*max-width:\s*64rem;[^}]*margin:\s*0 auto 2rem;/u);
  assert.doesNotMatch(homepage, /\bterm:|futureTerm/u);
  assert.doesNotMatch(styles, /\.futureTerm\b/u);
  assert.match(styles, /@media \(max-width: 996px\)[\s\S]*\.futureList\s*\{[^}]*grid-template-columns:\s*1fr;/u);
});

test('keeps roadmap copy reader-facing instead of exposing design rationale', async () => {
  const homepage = await read('src/pages/index.tsx');

  for (const text of [
    '建立架构判断的主线',
    '从需求与约束出发，经过建模、模式与治理，在案例和复盘中形成判断',
    '从理解架构到做出取舍',
    '需要判断时快速查，系统学习时沿路径走，也从真实架构中理解取舍',
  ]) {
    assert.match(homepage, new RegExp(text, 'u'));
  }

  for (const internalCopy of [
    '首页保留方向',
    '实时进度回到 backlog',
    '查看实时 backlog',
    '让完整体系进入不同使用场景',
    '三个方向并行演进，不代表固定顺序或发布日期',
  ]) {
    assert.doesNotMatch(homepage, new RegExp(internalCopy, 'u'));
  }
});
