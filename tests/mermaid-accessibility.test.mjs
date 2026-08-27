import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {handleHorizontalArrowKey} from '../src/components/KeyboardScrollableRegion/handleHorizontalArrowKey.mjs';

const root = new URL('../', import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), 'utf8');
}

function assertThemeMermaidAccessibility(component, css) {
  assert.match(
    component,
    /from '@site\/src\/components\/KeyboardScrollableRegion\/handleHorizontalArrowKey\.mjs';/u,
    'theme Mermaid renderer reuses the shared horizontal-scroll controller',
  );
  for (const contract of [
    'role="region"',
    'aria-label={MERMAID_SCROLL_REGION_LABEL}',
    'tabIndex={0}',
    'onKeyDown={handleHorizontalArrowKey}',
  ]) assert.ok(component.includes(contract), `theme Mermaid ${contract}`);
  assert.match(
    component,
    /const MERMAID_SCROLL_REGION_LABEL = 'Mermaid 图表，可使用左右方向键、Home 或 End 横向滚动';/u,
    'every Mermaid has a stable accessible fallback name',
  );
  assert.match(
    css,
    /\.theme-doc-markdown \.docusaurus-mermaid-container:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--ifm-color-primary\);[^}]*outline-offset:\s*4px;[^}]*\}/su,
    'focused Mermaid scroll owner has an unmistakable visible focus ring',
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
      preventDefault: () => {
        prevented = true;
      },
    },
    prevented: () => prevented,
  };
}

test('theme Mermaid owns keyboard-accessible local horizontal overflow', async () => {
  const [component, css] = await Promise.all([
    source('src/theme/Mermaid/index.tsx'),
    source('src/css/custom.css'),
  ]);
  assertThemeMermaidAccessibility(component, css);

  for (const [label, from, to] of [
    ['role', 'role="region"', 'role="group"'],
    ['accessible name', 'aria-label={MERMAID_SCROLL_REGION_LABEL}', 'aria-label="changed"'],
    ['tab order', 'tabIndex={0}', 'tabIndex={-1}'],
    ['key controller', 'onKeyDown={handleHorizontalArrowKey}', 'onKeyDown={undefined}'],
  ]) {
    assert.throws(
      () => assertThemeMermaidAccessibility(component.replace(from, to), css),
      assert.AssertionError,
      `${label} drift fails closed`,
    );
  }
});

test('shared horizontal-scroll controller bounds ArrowLeft/Right and Home/End locally', () => {
  const region = {scrollLeft: 0, scrollWidth: 200, clientWidth: 100};

  const right = keyboardEvent(region, 'ArrowRight');
  handleHorizontalArrowKey(right.event);
  assert.equal(region.scrollLeft, 40);
  assert.equal(right.prevented(), true);

  const end = keyboardEvent(region, 'End');
  handleHorizontalArrowKey(end.event);
  assert.equal(region.scrollLeft, 100);
  assert.equal(end.prevented(), true);

  const left = keyboardEvent(region, 'ArrowLeft');
  handleHorizontalArrowKey(left.event);
  assert.equal(region.scrollLeft, 60);
  assert.equal(left.prevented(), true);

  const home = keyboardEvent(region, 'Home');
  handleHorizontalArrowKey(home.event);
  assert.equal(region.scrollLeft, 0);
  assert.equal(home.prevented(), true);

  const staticRegion = {scrollLeft: 0, scrollWidth: 100, clientWidth: 100};
  const staticEnd = keyboardEvent(staticRegion, 'End');
  handleHorizontalArrowKey(staticEnd.event);
  assert.equal(staticRegion.scrollLeft, 0);
  assert.equal(staticEnd.prevented(), false);
});
