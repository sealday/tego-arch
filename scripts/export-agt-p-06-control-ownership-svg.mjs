import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';

import {assertControlOwnershipDiagramGeometry} from './validate-agt-p-06-control-ownership-diagram.mjs';

const [drawioPath, normalizedTemplatePath, outputPath] = process.argv.slice(2);
if (!drawioPath || !normalizedTemplatePath || !outputPath) {
  throw new Error(
    'usage: export-agt-p-06-control-ownership-svg.mjs <source.drawio> <normalized-template.svg> <published.svg>',
  );
}

// This digest authenticates the exact raw bytes of the reviewed pinned
// normalized-template asset. It is deliberately independent of the input path,
// Draw.io source hash, and published output, so none of those can self-certify
// extra or reordered SVG inventory.
const PINNED_NORMALIZED_TEMPLATE_SHA256 = '14d1b0aea199d3117c6e4b67ece64687c1c4ad2038abefb88c9d3486be7c50d9';

// The original diagrams.net raw export was not retained. This pinned normalized
// template is therefore explicit provenance, not a fabricated raw export. The
// geometry validator binds every visible node, route, label, and source hash to
// the editable Draw.io model before any bytes are published.
const [drawio, normalizedTemplateBytes] = await Promise.all([
  readFile(drawioPath, 'utf8'),
  readFile(normalizedTemplatePath),
]);
const normalizedTemplateSha256 = createHash('sha256').update(normalizedTemplateBytes).digest('hex');
if (normalizedTemplateSha256 !== PINNED_NORMALIZED_TEMPLATE_SHA256) {
  throw new Error(
    `AGT-P-06 pinned normalized-template byte SHA-256 mismatch: expected ${PINNED_NORMALIZED_TEMPLATE_SHA256}, received ${normalizedTemplateSha256}`,
  );
}
const normalizedTemplate = normalizedTemplateBytes.toString('utf8');
assertControlOwnershipDiagramGeometry(drawio, normalizedTemplate);
await writeFile(outputPath, normalizedTemplateBytes);
console.log('Exported validated AGT-P-06 SVG from the pinned normalized template');
