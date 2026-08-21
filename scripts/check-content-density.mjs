import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {analyzeCaseText} from '../.codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs';

const USAGE = 'Usage: node scripts/check-content-density.mjs <content.mdx>';

export async function checkContentDensity(filePath) {
  if (!filePath || !/\.mdx?$/iu.test(filePath)) throw new Error(USAGE);

  const metadata = await stat(filePath);
  if (!metadata.isFile()) throw new Error(`Expected an MDX file: ${filePath}`);

  const source = await readFile(filePath, 'utf8');
  return analyzeCaseText(source);
}

async function main(argv) {
  if (argv.length !== 1) throw new Error(USAGE);

  const [filePath] = argv;
  const result = await checkContentDensity(filePath);
  if (result.warnings.length > 0) {
    for (const warning of result.warnings) {
      console.error(`${filePath}:${warning.line} [${warning.kind}] ${warning.message}`);
    }
    const suffix = result.warnings.length === 1 ? '' : 's';
    throw new Error(`Density check failed with ${result.warnings.length} warning${suffix}.`);
  }

  console.log(`Checked ${filePath}: 0 density warnings`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
