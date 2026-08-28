import {createElement} from 'react';

import {handleHorizontalArrowKey} from './handleHorizontalArrowKey.mjs';

export const MERMAID_SCROLL_REGION_LABEL =
  'Mermaid 图表，可使用左右方向键、Home 或 End 横向滚动';

export function mermaidAccessibleName(value) {
  const match = String(value ?? '').match(/^\s*accTitle:\s*(.+?)\s*$/mu);
  return match?.[1] || MERMAID_SCROLL_REGION_LABEL;
}

export function KeyboardScrollableRegion({
  children,
  label = MERMAID_SCROLL_REGION_LABEL,
}) {
  return createElement(
    'div',
    {
      className: 'keyboard-scroll-region keyboard-scroll-region--mermaid',
      role: 'region',
      'aria-label': label,
      tabIndex: 0,
      onKeyDown: handleHorizontalArrowKey,
    },
    children,
  );
}
