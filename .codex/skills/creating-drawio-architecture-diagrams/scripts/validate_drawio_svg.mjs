import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  collectDrawioPairValidation,
  collectXmlVisibleCopy,
  normalizedXmlLabel,
  parseXml,
  xmlElements,
  xmlTextContent,
} from './xml-visible-copy.mjs';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const USAGE =
  'Usage: node validate_drawio_svg.mjs <source.drawio> <published.svg> [--label <text>]...';

function parseArgs(argv) {
  const errors = [];
  const [drawioPath, svgPath, ...options] = argv;
  const labels = [];
  if (!drawioPath || !svgPath || drawioPath.startsWith('--') || svgPath.startsWith('--')) {
    errors.push(USAGE);
    return {drawioPath, svgPath, labels, errors};
  }
  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    if (option !== '--label') {
      errors.push(`Unknown option: ${option}`);
      continue;
    }
    const value = options[index + 1];
    if (value === undefined || value.startsWith('--')) {
      errors.push('--label requires a value');
      continue;
    }
    labels.push(value);
    index += 1;
  }
  return {drawioPath, svgPath, labels, errors};
}

function slug(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function hasAccessibleMetadata(svgRoot) {
  const titles = xmlElements(svgRoot, 'title', SVG_NAMESPACE);
  const descriptions = xmlElements(svgRoot, 'desc', SVG_NAMESPACE);
  const title = titles.find((element) => normalizedXmlLabel(xmlTextContent(element)));
  const description = descriptions.find((element) => normalizedXmlLabel(xmlTextContent(element)));
  const titleId = title?.attributes.get('id') ?? '';
  const descriptionId = description?.attributes.get('id') ?? '';
  const labelledBy = (svgRoot.attributes.get('aria-labelledby') ?? '').trim().split(/\s+/u);
  return Boolean(
    titleId
    && descriptionId
    && svgRoot.attributes.get('role') === 'img'
    && labelledBy.includes(titleId)
    && labelledBy.includes(descriptionId),
  );
}

export async function validatePair({drawioPath, svgPath, labels}) {
  const errors = [];
  let drawio = '';
  let svg = '';
  let drawioParsed;
  let svgParsed;
  let drawioVisible;
  let svgVisible;

  try {
    drawio = await readFile(drawioPath, 'utf8');
  } catch {
    errors.push(`Cannot read Draw.io source: ${drawioPath}`);
  }
  try {
    svg = await readFile(svgPath, 'utf8');
  } catch {
    errors.push(`Cannot read SVG publication: ${svgPath}`);
  }
  if (drawioPath && svgPath && slug(drawioPath) !== slug(svgPath)) {
    errors.push('Draw.io and SVG must have a matching slug');
  }

  if (drawio) {
    try {
      drawioParsed = parseXml(drawio, drawioPath);
    } catch (error) {
      errors.push(`Draw.io source must be well-formed XML in the supported subset: ${error.message}`);
    }
  }
  if (svg) {
    try {
      svgParsed = parseXml(svg, svgPath);
    } catch (error) {
      errors.push(`Published SVG must be well-formed XML in the supported subset: ${error.message}`);
    }
  }

  if (
    drawioParsed
    && (drawioParsed.root.localName !== 'mxfile' || drawioParsed.root.namespace !== '')
  ) {
    errors.push('Draw.io source must be XML rooted at mxfile');
  } else if (drawioParsed) {
    try {
      drawioVisible = collectDrawioPairValidation(drawioParsed, drawioPath);
    } catch (error) {
      errors.push(`Draw.io source must be well-formed XML in the supported subset: ${error.message}`);
    }
  }

  if (
    svgParsed
    && (svgParsed.root.localName !== 'svg' || svgParsed.root.namespace !== SVG_NAMESPACE)
  ) {
    errors.push('Published SVG must be XML rooted at svg');
  } else if (svgParsed) {
    try {
      svgVisible = collectXmlVisibleCopy(svgParsed, svgPath, 'svg');
    } catch (error) {
      errors.push(`Published SVG must be well-formed XML in the supported subset: ${error.message}`);
    }
  }

  const svgRoot = svgParsed?.root;
  if (svgVisible && !svgRoot.attributes.get('viewBox')) {
    errors.push('SVG root must include a viewBox');
  }
  if (svgVisible && (svgRoot.attributes.has('width') || svgRoot.attributes.has('height'))) {
    errors.push('SVG root must not include fixed root width or height');
  }
  if (svgVisible && !hasAccessibleMetadata(svgRoot)) {
    errors.push('SVG must include an accessible title and description');
  }

  const drawioLabels = new Set((drawioVisible?.records ?? []).map(({text}) => text));
  const svgLabels = new Set((svgVisible?.records ?? []).map(({text}) => text));
  for (const label of labels) {
    if (!drawioLabels.has(label) || !svgLabels.has(label)) {
      errors.push(
        `Required label "${label}" must appear as a Draw.io mxCell.value and visible SVG text`,
      );
    }
  }
  return errors;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.errors.length > 0) {
    for (const error of options.errors) console.error(error);
    process.exitCode = 1;
    return;
  }
  const errors = await validatePair(options);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
    return;
  }
  console.log(`Validated ${slug(options.drawioPath)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
