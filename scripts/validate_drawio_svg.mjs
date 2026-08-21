import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {validatePair} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs';

const USAGE =
  'Usage: node scripts/validate_drawio_svg.mjs <source.drawio> <published.svg> [--label <text>]...';

export function parseDrawioValidationArgs(argv) {
  const [drawioPath, svgPath, ...options] = argv;
  const labels = [];
  const errors = [];

  if (!drawioPath || !svgPath || drawioPath.startsWith('--') || svgPath.startsWith('--')) {
    return {drawioPath, svgPath, labels, errors: [USAGE]};
  }

  for (let index = 0; index < options.length; index += 1) {
    if (options[index] !== '--label') {
      errors.push(`Unknown option: ${options[index]}`);
      continue;
    }
    const label = options[index + 1];
    if (label === undefined || label.startsWith('--')) {
      errors.push('--label requires a value');
      continue;
    }
    labels.push(label);
    index += 1;
  }

  return {drawioPath, svgPath, labels, errors};
}

export async function runDrawioValidation(argv) {
  const options = parseDrawioValidationArgs(argv);
  const errors = options.errors.length > 0
    ? options.errors
    : await validatePair(options);

  return {
    errors,
    slug: options.drawioPath
      ? path.basename(options.drawioPath, path.extname(options.drawioPath))
      : null,
  };
}

async function main(argv) {
  const result = await runDrawioValidation(argv);
  if (result.errors.length > 0) {
    for (const error of result.errors) console.error(error);
    process.exitCode = 1;
    return;
  }
  console.log(`Validated ${result.slug}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}
