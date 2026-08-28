import {readFile, writeFile} from 'node:fs/promises';

import {assertControlOwnershipDiagramGeometry} from './validate-agt-p-06-control-ownership-diagram.mjs';

const [drawioPath, normalizedTemplatePath, outputPath] = process.argv.slice(2);
if (!drawioPath || !normalizedTemplatePath || !outputPath) {
  throw new Error(
    'usage: export-agt-p-06-control-ownership-svg.mjs <source.drawio> <normalized-template.svg> <published.svg>',
  );
}

// The original diagrams.net raw export was not retained. This pinned normalized
// template is therefore explicit provenance, not a fabricated raw export. The
// geometry validator binds every visible node, route, label, and source hash to
// the editable Draw.io model before any bytes are published.
const [drawio, normalizedTemplate] = await Promise.all([
  readFile(drawioPath, 'utf8'),
  readFile(normalizedTemplatePath, 'utf8'),
]);
assertControlOwnershipDiagramGeometry(drawio, normalizedTemplate);
await writeFile(outputPath, normalizedTemplate, 'utf8');
console.log('Exported validated AGT-P-06 SVG from the pinned normalized template');
