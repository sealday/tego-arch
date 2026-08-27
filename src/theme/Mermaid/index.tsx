import OriginalMermaid from '@theme-original/Mermaid';
import {KeyboardScrollableRegion, mermaidAccessibleName} from '@site/src/components/KeyboardScrollableRegion/KeyboardScrollableRegion.mjs';
import type {Props} from '@theme/Mermaid';
import type {ReactNode} from 'react';

export default function Mermaid(props: Props): ReactNode {
  return (
    <KeyboardScrollableRegion label={mermaidAccessibleName(props.value)}>
      <OriginalMermaid {...props} />
    </KeyboardScrollableRegion>
  );
}
