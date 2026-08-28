import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {validatePair} from '../.codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs';

const SLUG = 'sty-12-micro-frontend-commerce-runtime';
const DRAWIO = new URL(`../diagrams/${SLUG}.drawio`, import.meta.url);
const SVG = new URL(`../static/img/diagrams/${SLUG}.svg`, import.meta.url);

test('Draw.io validator accepts responsive percent width but rejects fixed root dimensions', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'tego-drawio-validator-'));
  try {
    const drawioPath = path.join(directory, `${SLUG}.drawio`);
    const svgPath = path.join(directory, `${SLUG}.svg`);
    const [drawio, responsiveSvg] = await Promise.all([readFile(DRAWIO, 'utf8'), readFile(SVG, 'utf8')]);
    await writeFile(drawioPath, drawio);

    await writeFile(svgPath, responsiveSvg);
    const responsiveErrors = await validatePair({drawioPath, svgPath, labels: []});
    assert.equal(responsiveErrors.includes('SVG root must not include fixed root width or height'), false, 'width="100%" remains responsive');

    await writeFile(svgPath, responsiveSvg.replace('width="100%"', 'width="800px"'));
    const pixelWidthErrors = await validatePair({drawioPath, svgPath, labels: []});
    assert.equal(pixelWidthErrors.includes('SVG root must not include fixed root width or height'), true, 'fixed pixel root width is rejected');

    await writeFile(svgPath, responsiveSvg.replace('width="100%"', 'width="100%" height="1200"'));
    const fixedHeightErrors = await validatePair({drawioPath, svgPath, labels: []});
    assert.equal(fixedHeightErrors.includes('SVG root must not include fixed root width or height'), true, 'fixed root height is rejected');
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
