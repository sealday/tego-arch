import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

const fixtures = [
  {
    fixture: 'tests/fixtures/agentic-diagrams/agt-p-08-durable-agent-hitl.diagrams-net.raw.svg',
    drawio: 'diagrams/agt-p-08-durable-agent-hitl.drawio',
    normalizer: 'scripts/normalize-agt-p-08-drawio-svg.mjs',
    published: 'static/img/diagrams/agt-p-08-durable-agent-hitl.svg',
  },
  {
    fixture: 'tests/fixtures/agentic-diagrams/multi-agent-research-system.diagrams-net.raw.svg',
    drawio: 'diagrams/multi-agent-research-system.drawio',
    normalizer: 'scripts/normalize-multi-agent-research-system-svg.mjs',
    published: 'static/img/diagrams/multi-agent-research-system.svg',
  },
  {
    fixture: 'tests/fixtures/agentic-diagrams/long-running-coding-agent.diagrams-net.raw.svg',
    drawio: 'diagrams/long-running-coding-agent.drawio',
    normalizer: 'scripts/normalize-long-running-coding-agent-svg.mjs',
    published: 'static/img/diagrams/long-running-coding-agent.svg',
  },
  {
    fixture: 'tests/fixtures/agentic-diagrams/production-incident-response-agent.diagrams-net.raw.svg',
    drawio: 'diagrams/production-incident-response-agent.drawio',
    normalizer: 'scripts/normalize-production-incident-response-agent-svg.mjs',
    published: 'static/img/diagrams/production-incident-response-agent.svg',
  },
];

function run(command, args, cwd = process.cwd()) {
  return spawnSync(command, args, {cwd, encoding: 'utf8'});
}

function assertRegenerates(root, contract, output) {
  const result = run(process.execPath, [contract.normalizer, contract.drawio, contract.fixture, output], root);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    readFileSync(output, 'utf8'),
    readFileSync(path.join(root, contract.published), 'utf8'),
    `${contract.published} regenerates byte-identically`,
  );
}

test('all authenticated Agentic raw exports are tracked and regenerate published SVGs byte-identically', () => {
  const outputRoot = mkdtempSync(path.join(tmpdir(), 'agentic-diagram-output-'));
  try {
    for (const [index, contract] of fixtures.entries()) {
      const tracked = run('git', ['ls-files', '--error-unmatch', contract.fixture]);
      assert.equal(tracked.status, 0, `${contract.fixture} must be tracked`);
      assertRegenerates(process.cwd(), contract, path.join(outputRoot, `${index}.svg`));
    }
  } finally {
    rmSync(outputRoot, {recursive: true, force: true});
  }
});

test('P06 uses a tracked pinned deterministic exporter when no authenticated raw export exists', () => {
  const outputRoot = mkdtempSync(path.join(tmpdir(), 'agt-p-06-output-'));
  const contract = {
    drawio: 'diagrams/agt-p-06-control-ownership-models.drawio',
    normalizer: 'scripts/export-agt-p-06-control-ownership-svg.mjs',
    fixture: 'tests/fixtures/agentic-diagrams/agt-p-06-control-ownership-models.normalized-template.svg',
    published: 'static/img/diagrams/agt-p-06-control-ownership-models.svg',
  };
  try {
    for (const trackedPath of [contract.normalizer, contract.fixture]) {
      assert.equal(run('git', ['ls-files', '--error-unmatch', trackedPath]).status, 0, `${trackedPath} must be tracked`);
    }
    assertRegenerates(process.cwd(), contract, path.join(outputRoot, 'p06.svg'));
  } finally {
    rmSync(outputRoot, {recursive: true, force: true});
  }
});

test('P06 exporter binds semantic IDs and exact SVG accessibility to Draw.io source values', () => {
  const outputRoot = mkdtempSync(path.join(tmpdir(), 'agt-p-06-semantic-'));
  const templatePath = 'tests/fixtures/agentic-diagrams/agt-p-06-control-ownership-models.normalized-template.svg';
  const template = readFileSync(templatePath, 'utf8');
  const baselineOutput = path.join(outputRoot, 'baseline-output.svg');
  const baseline = run(process.execPath, [
    'scripts/export-agt-p-06-control-ownership-svg.mjs',
    'diagrams/agt-p-06-control-ownership-models.drawio',
    templatePath,
    baselineOutput,
  ]);
  assert.equal(baseline.status, 0, baseline.stderr || baseline.stdout);
  assert.equal(readFileSync(baselineOutput, 'utf8'), template, 'baseline export stays byte-identical');
  const swap = (source, left, right) => source.replaceAll(left, '__P06_SWAP__')
    .replaceAll(right, left).replaceAll('__P06_SWAP__', right);
  const mutations = [
    ['node semantic swap', swap(template, '>Supervisor<', '>Worker Agent<')],
    ['edge semantic swap', swap(template, '>反复委派<', '>结构化结果返回<')],
    ['role removed', template.replace(' role="img"', '')],
    ['role drift', template.replace('role="img"', 'role="group"')],
    ['aria removed', template.replace(' aria-labelledby="agt-p-06-title agt-p-06-desc"', '')],
    ['aria drift', template.replace('aria-labelledby="agt-p-06-title agt-p-06-desc"', 'aria-labelledby="agt-p-06-desc agt-p-06-title"')],
    ['title removed', template.replace('  <title id="agt-p-06-title">Supervisor, Handoff, and Agent-as-Tool control ownership models</title>\n', '')],
    ['title id removed', template.replace(' id="agt-p-06-title"', '')],
    ['title text drift', template.replace('Supervisor, Handoff, and Agent-as-Tool control ownership models', 'Generic agent diagram')],
    ['description removed', template.replace('  <desc id="agt-p-06-desc">Three separated regions compare a supervisor that delegates and receives results while retaining control, a handoff that moves the active conversation to another agent, and a parent agent that calls an agent as a bounded tool and receives the result.</desc>\n', '')],
    ['description id drift', template.replace('id="agt-p-06-desc"', 'id="agt-p-06-description"')],
    ['description text drift', template.replace('Three separated regions compare a supervisor', 'Three regions vaguely show a supervisor')],
  ];
  try {
    for (const [index, [label, mutant]] of mutations.entries()) {
      assert.notEqual(mutant, template, `${label} mutation is non-no-op`);
      const mutantPath = path.join(outputRoot, `${index}-input.svg`);
      const outputPath = path.join(outputRoot, `${index}-output.svg`);
      writeFileSync(mutantPath, mutant);
      const result = run(process.execPath, [
        'scripts/export-agt-p-06-control-ownership-svg.mjs',
        'diagrams/agt-p-06-control-ownership-models.drawio',
        mutantPath,
        outputPath,
      ]);
      assert.notEqual(result.status, 0, `${label} must fail closed`);
    }
  } finally {
    rmSync(outputRoot, {recursive: true, force: true});
  }
});

test('candidate index exports a clean archive containing every diagram fixture and focused regeneration passes there', () => {
  const archiveRoot = mkdtempSync(path.join(tmpdir(), 'agentic-clean-archive-'));
  try {
    const tree = run('git', ['write-tree']);
    assert.equal(tree.status, 0, tree.stderr);
    const archive = path.join(archiveRoot, 'candidate.tar');
    const archived = run('git', ['archive', '--format=tar', '-o', archive, tree.stdout.trim()]);
    assert.equal(archived.status, 0, archived.stderr);
    const checkout = path.join(archiveRoot, 'checkout');
    assert.equal(run('mkdir', ['-p', checkout]).status, 0);
    const extracted = run('tar', ['-xf', archive, '-C', checkout]);
    assert.equal(extracted.status, 0, extracted.stderr);
    const outputRoot = path.join(archiveRoot, 'outputs');
    assert.equal(run('mkdir', ['-p', outputRoot]).status, 0);
    for (const [index, contract] of fixtures.entries()) {
      assertRegenerates(checkout, contract, path.join(outputRoot, `${index}.svg`));
    }
    assertRegenerates(checkout, {
      drawio: 'diagrams/agt-p-06-control-ownership-models.drawio',
      normalizer: 'scripts/export-agt-p-06-control-ownership-svg.mjs',
      fixture: 'tests/fixtures/agentic-diagrams/agt-p-06-control-ownership-models.normalized-template.svg',
      published: 'static/img/diagrams/agt-p-06-control-ownership-models.svg',
    }, path.join(outputRoot, 'p06.svg'));
  } finally {
    rmSync(archiveRoot, {recursive: true, force: true});
  }
});

test('ignored process reports are never tracked', () => {
  const tracked = run('git', ['ls-files', '.superpowers/sdd/*-report.md']);
  assert.equal(tracked.status, 0, tracked.stderr);
  assert.equal(tracked.stdout, '');
});
