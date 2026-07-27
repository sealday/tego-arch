import {readFile} from 'node:fs/promises';
import path from 'node:path';

function decodeXml(value) {
  return value.replace(
    /&#(?:x([0-9a-f]+)|([0-9]+));|&(lt|gt|quot|apos|amp);/giu,
    (entity, hexadecimal, decimal, named) => {
      if (hexadecimal) {
        return String.fromCodePoint(Number.parseInt(hexadecimal, 16));
      }
      if (decimal) {
        return String.fromCodePoint(Number.parseInt(decimal, 10));
      }
      return {
        amp: '&',
        apos: "'",
        gt: '>',
        lt: '<',
        quot: '"',
      }[named];
    },
  );
}

function parseArgs(argv) {
  const [drawioPath, svgPath, ...options] = argv;
  const labels = [];

  for (let index = 0; index < options.length; index += 1) {
    if (options[index] === '--label' && options[index + 1] !== undefined) {
      labels.push(options[index + 1]);
      index += 1;
    }
  }

  return {drawioPath, svgPath, labels};
}

function rootTag(xml, tagName) {
  return xml.match(new RegExp(`<${tagName}\\b[^>]*>`, 'u'))?.[0] ?? '';
}

function attribute(tag, name) {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'u'),
  );
  return decodeXml(match?.[1] ?? match?.[2] ?? '');
}

function slug(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function hasNamedDiagram(drawio) {
  const diagramTag = rootTag(drawio, 'diagram');
  return Boolean(diagramTag && attribute(diagramTag, 'name').trim());
}

function hasHtmlCellValue(drawio) {
  const cellTags = drawio.match(/<mxCell\b[^>]*>/gu) ?? [];
  return cellTags.some((tag) => /<[^>]+>/u.test(attribute(tag, 'value')));
}

function hasAccessibleMetadata(svg, svgTag) {
  const title = svg.match(/<title\b[^>]*>([^<]+)<\/title>/u);
  const description = svg.match(/<desc\b[^>]*>([^<]+)<\/desc>/u);
  const titleId = title ? attribute(title[0], 'id') : '';
  const descriptionId = description ? attribute(description[0], 'id') : '';
  const labelledBy = attribute(svgTag, 'aria-labelledby').split(/\s+/u);

  return Boolean(
    title?.[1].trim() &&
      description?.[1].trim() &&
      titleId &&
      descriptionId &&
      attribute(svgTag, 'role') === 'img' &&
      labelledBy.includes(titleId) &&
      labelledBy.includes(descriptionId),
  );
}

async function validatePair({drawioPath, svgPath, labels}) {
  const errors = [];
  let drawio = '';
  let svg = '';

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

  const mxfileTag = rootTag(drawio, 'mxfile');
  if (drawio && (!mxfileTag || !drawio.includes('</mxfile>'))) {
    errors.push('Draw.io source must be XML rooted at mxfile');
  }
  if (drawio && !hasNamedDiagram(drawio)) {
    errors.push('Draw.io source must contain a named diagram page');
  }
  if (drawio && hasHtmlCellValue(drawio)) {
    errors.push('Draw.io must not contain HTML in mxCell.value');
  }

  const svgTag = rootTag(svg, 'svg');
  if (svg && (!svgTag || !svg.includes('</svg>'))) {
    errors.push('Published SVG must be XML rooted at svg');
  }
  if (svgTag && !attribute(svgTag, 'viewBox')) {
    errors.push('SVG root must include a viewBox');
  }
  if (svgTag && /\b(?:width|height)\s*=/u.test(svgTag)) {
    errors.push('SVG root must not include fixed root width or height');
  }
  if (svgTag && !hasAccessibleMetadata(svg, svgTag)) {
    errors.push('SVG must include an accessible title and description');
  }

  for (const label of labels) {
    if (!drawio.includes(label) || !svg.includes(label)) {
      errors.push(`Required label "${label}" must appear in both Draw.io and SVG`);
    }
  }

  return errors;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.drawioPath || !options.svgPath) {
    console.error(
      'Usage: node validate_drawio_svg.mjs <source.drawio> <published.svg> [--label <text>]...',
    );
    process.exitCode = 1;
    return;
  }

  const errors = await validatePair(options);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${slug(options.drawioPath)}`);
}

await main();
