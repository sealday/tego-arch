import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const illustrationSkill = new URL(
  '../.codex/skills/illustrating-architecture-articles/SKILL.md',
  import.meta.url,
);
const illustrationAgent = new URL(
  '../.codex/skills/illustrating-architecture-articles/agents/openai.yaml',
  import.meta.url,
);
const caseWritingSkill = new URL(
  '../.codex/skills/writing-architecture-cases/SKILL.md',
  import.meta.url,
);

test('routes architecture visuals through an explicit format decision', async () => {
  const guidance = await readFile(illustrationSkill, 'utf8');

  assert.match(guidance, /无需图/u);
  assert.match(guidance, /Mermaid/u);
  assert.match(guidance, /Draw\.io\s*\+\s*SVG/u);
  assert.match(guidance, /位图/u);
  assert.match(guidance, /any two/u);
  assert.match(guidance, /more than 7 primary nodes/u);
  assert.match(guidance, /12 Chinese characters/u);
  assert.match(guidance, /layout hacks/u);
  assert.match(guidance, /Do not bulk-replace/u);
  assert.match(guidance, /creating-drawio-architecture-diagrams/u);
});

test('advertises the illustration skill as a format router', async () => {
  const metadata = await readFile(illustrationAgent, 'utf8');

  assert.match(metadata, /视觉选型/u);
  assert.match(metadata, /Mermaid/u);
  assert.match(metadata, /Draw\.io/u);
});

test('case-writing workflow delegates visual format choice to the router', async () => {
  const guidance = await readFile(caseWritingSkill, 'utf8');

  assert.match(
    guidance,
    /REQUIRED SUB-SKILL:[\s\S]*illustrating-architecture-articles[\s\S]*choose the visual format/u,
  );
  assert.doesNotMatch(
    guidance,
    /For a complete case, generate and integrate at least one selected illustration/u,
  );
  assert.match(guidance, /无需图|Mermaid|Draw\.io|位图/u);
});
