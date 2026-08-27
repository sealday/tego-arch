import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import test from 'node:test';

import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {handleHorizontalArrowKey} from '../src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';

const root = new URL('../', import.meta.url);
const contentRoot = new URL('../content/', import.meta.url);
const migratedMermaidTitles = new Map([
  ['content/modeling/mod-06-er-model-relationship-boundaries.mdx', ['费用申报实体关系教学模型']],
  ['content/modeling/mod-07-uml-diagram-selection-guide.mdx', ['UML 选图决策流']],
  ['content/modeling/mod-08-state-machine-modeling.mdx', ['业务意图状态机', '执行与恢复状态机']],
  ['content/modeling/mod-09-eventstorming.mdx', ['费用支付过程模型']],
  ['content/modeling/mod-10-domain-storytelling.mdx', ['费用支付领域故事']],
  ['content/modeling/mod-11-ddd-context-map.mdx', ['费用申报系统上下文映射']],
  ['content/styles/sty-00-comparison-framework.mdx', ['架构风格比较决策流程']],
  ['content/styles/sty-01-layered-architecture.mdx', ['单一部署单元内的封闭层与只读查询例外']],
]);

async function source(path) {
  return readFile(new URL(path, root), 'utf8');
}

async function contentFiles(directory = contentRoot) {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = await Promise.all(entries.map(async (entry) => {
    if (entry.isDirectory()) return contentFiles(new URL(`${entry.name}/`, directory));
    return entry.name.endsWith('.mdx') ? [new URL(entry.name, directory)] : [];
  }));
  return files.flat();
}

function mermaidWrappers(sourceText) {
  const wrappers = [];
  const stack = [];
  const tokens = /<\/?div\b[^>]*>|```mermaid/gu;
  let token;
  while ((token = tokens.exec(sourceText))) {
    if (token[0] === '```mermaid') {
      wrappers.push(...stack);
      continue;
    }
    if (token[0].startsWith('</')) {
      stack.pop();
      continue;
    }
    stack.push({tag: token[0], start: token.index, end: tokens.lastIndex});
  }
  return wrappers;
}

function assertThinThemeComposition(component) {
  assert.match(component, /import OriginalMermaid from '@theme-original\/Mermaid';/u);
  assert.match(
    component,
    /import \{KeyboardScrollableRegion, mermaidAccessibleName\} from '@site\/src\/components\/KeyboardScrollableRegion\/KeyboardScrollableRegion\.mjs';/u,
  );
  assert.match(component, /<KeyboardScrollableRegion label=\{mermaidAccessibleName\(props\.value\)\}>/u);
  assert.match(component, /<OriginalMermaid \{\.\.\.props\} \/>/u);
  for (const forbidden of [
    '@docusaurus/theme-mermaid/client',
    'useMermaidRenderResult',
    'MermaidContainerClassName',
    'dangerouslySetInnerHTML',
    'ErrorBoundary',
    'Copyright',
  ]) assert.doesNotMatch(component, new RegExp(forbidden, 'u'), `${forbidden} is not copied into the theme`);
}

function assertSingleMermaidScrollOwner(css) {
  assert.match(
    css,
    /\.theme-doc-markdown \.keyboard-scroll-region--mermaid\s*\{[^}]*max-width:\s*100%;[^}]*overflow-x:\s*auto;[^}]*\}/su,
  );
  assert.match(
    css,
    /\.theme-doc-markdown \.keyboard-scroll-region--mermaid:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--ifm-color-primary\);[^}]*outline-offset:\s*4px;[^}]*\}/su,
  );
  assert.match(
    css,
    /\.keyboard-scroll-region--mermaid > \.docusaurus-mermaid-container\s*\{[^}]*width:\s*max-content;[^}]*max-width:\s*none;[^}]*overflow-x:\s*visible;[^}]*\}/su,
  );
  assert.match(
    css,
    /\.keyboard-scroll-region--mermaid > \.docusaurus-mermaid-container svg\s*\{[^}]*min-width:\s*42rem;[^}]*\}/su,
  );
}

function keyboardEvent(region, key) {
  let prevented = false;
  return {
    event: {
      key,
      target: region,
      currentTarget: region,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault: () => { prevented = true; },
    },
    prevented: () => prevented,
  };
}

test('theme Mermaid is a thin composition with one keyboard-scroll owner', async () => {
  const [component, css] = await Promise.all([
    source('src/theme/Mermaid/index.tsx'),
    source('src/css/custom.css'),
  ]);
  assertThinThemeComposition(component);
  assertSingleMermaidScrollOwner(css);

  assert.throws(
    () => assertThinThemeComposition(component.replace('@theme-original/Mermaid', '@docusaurus/theme-mermaid/client')),
    assert.AssertionError,
  );
  assert.throws(
    () => assertSingleMermaidScrollOwner(css.replace(
      '.theme-doc-markdown .keyboard-scroll-region--mermaid > .docusaurus-mermaid-container {\n  width: max-content;\n  max-width: none;\n  overflow-x: visible;',
      '.theme-doc-markdown .keyboard-scroll-region--mermaid > .docusaurus-mermaid-container {\n  width: max-content;\n  max-width: none;\n  overflow-x: auto;',
    )),
    assert.AssertionError,
  );
});

test('the local Mermaid region renders actual accessible DOM and derives distinct accTitle names', async () => {
  const {
    KeyboardScrollableRegion,
    mermaidAccessibleName,
    MERMAID_SCROLL_REGION_LABEL,
  } = await import('../src/components/KeyboardScrollableRegion/KeyboardScrollableRegion.mjs');
  const firstTitle = '第一张图';
  const secondTitle = '第二张图';
  assert.equal(mermaidAccessibleName(`flowchart LR\n  accTitle: ${firstTitle}`), firstTitle);
  assert.equal(mermaidAccessibleName(`flowchart LR\n  accTitle: ${secondTitle}`), secondTitle);
  assert.equal(mermaidAccessibleName('flowchart LR\n  A --> B'), MERMAID_SCROLL_REGION_LABEL);

  const element = KeyboardScrollableRegion({
    label: firstTitle,
    children: React.createElement('span', null, 'child'),
  });
  assert.equal(element.type, 'div');
  assert.equal(element.props.role, 'region');
  assert.equal(element.props['aria-label'], firstTitle);
  assert.equal(element.props.tabIndex, 0);
  assert.equal(element.props.onKeyDown, handleHorizontalArrowKey);
  assert.match(
    renderToStaticMarkup(element),
    /<div class="keyboard-scroll-region keyboard-scroll-region--mermaid" role="region" aria-label="第一张图" tabindex="0"><span>child<\/span><\/div>/u,
  );
});

test('shared horizontal-scroll controller bounds ArrowLeft/Right and Home/End locally', () => {
  const region = {scrollLeft: 0, scrollWidth: 200, clientWidth: 100};
  for (const [key, expected] of [['ArrowRight', 40], ['End', 100], ['ArrowLeft', 60], ['Home', 0]]) {
    const event = keyboardEvent(region, key);
    handleHorizontalArrowKey(event.event);
    assert.equal(region.scrollLeft, expected, key);
    assert.equal(event.prevented(), true, key);
  }
});

test('no Mermaid fence remains inside a focusable or landmark MDX wrapper', async () => {
  const files = await contentFiles();
  const offenders = [];
  for (const file of files) {
    const body = await readFile(file, 'utf8');
    for (const wrapper of mermaidWrappers(body)) {
      if (/\brole="region"|\btabIndex=\{0\}|\bonKeyDown=\{handleHorizontalArrowKey\}|diagram-wrapper--scroll-owner/u.test(wrapper.tag)) {
        offenders.push(`${join(file.pathname, '')}:${wrapper.tag}`);
      }
    }
  }
  assert.deepEqual(offenders, [], 'theme Mermaid is the sole focusable scroll region for each Mermaid fence');
});

test('migrated Mermaid diagrams preserve their former descriptive region names as exact accTitles', async () => {
  for (const [path, expectedTitles] of migratedMermaidTitles) {
    const text = await source(path);
    const titles = [...text.matchAll(/```mermaid\n[^\n]+\n\s*accTitle:\s*(.+)\n/gu)]
      .map((match) => match[1].trim());
    assert.deepEqual(titles, expectedTitles, path);
    assert.equal(new Set(titles).size, titles.length, `${path} Mermaid accTitles are unique`);
    for (const title of titles) {
      assert.throws(
        () => assert.deepEqual(
          [...text.replace(`accTitle: ${title}\n`, '').matchAll(/```mermaid\n[^\n]+\n\s*accTitle:\s*(.+)\n/gu)].map((match) => match[1].trim()),
          expectedTitles,
        ),
        assert.AssertionError,
        `${path} removes ${title} fail closed`,
      );
      assert.throws(
        () => assert.deepEqual(
          [...text.replace(`accTitle: ${title}`, 'accTitle: 错误 Mermaid 标题').matchAll(/```mermaid\n[^\n]+\n\s*accTitle:\s*(.+)\n/gu)].map((match) => match[1].trim()),
          expectedTitles,
        ),
        assert.AssertionError,
        `${path} drifts ${title} fail closed`,
      );
    }
  }
});
