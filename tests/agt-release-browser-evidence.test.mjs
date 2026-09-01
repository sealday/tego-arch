import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const EVIDENCE_PATH = path.join(ROOT, 'docs/reviews/evidence/agentic-architecture-topic-system-local-browser.json');
const REVIEW_PATH = path.join(ROOT, 'docs/reviews/agentic-architecture-topic-system.md');
const CANDIDATE = 'a80e462b5b50aff7ae5310ece825e7a6928aff64';
const TREE = 'dea25c14520a9bb9d58fdb5840d0406463342979';
const CONTENT_MANIFEST_SHA256 = '432933225918928397587b2be106918cb1cf950cbd3a6e4bb1e24f0fc0c6654e';
const CONTENT_BASE = '8be068f';
const CHANGED_CONTENT_PATHS = [
  'content/concepts/agt-c-02-agent-harness.mdx',
  'content/concepts/agt-c-03-agent-loop.mdx',
  'content/concepts/agt-c-05-tool-sandbox-permission-side-effect.mdx',
  'content/concepts/agt-c-06-trace-evaluation-guardrail.mdx',
  'content/patterns/agt-p-07-orchestrator-workers-fanout-fanin.mdx',
  'content/patterns/agt-p-08-durable-agent-hitl.mdx',
];
const AGENTIC_ARTICLE_PATHS = [
  'content/cases/long-running-coding-agent.mdx',
  'content/cases/multi-agent-research-system.mdx',
  'content/cases/production-incident-response-agent.mdx',
  'content/concepts/agt-c-01-agent-system-boundary.mdx',
  'content/concepts/agt-c-02-agent-harness.mdx',
  'content/concepts/agt-c-03-agent-loop.mdx',
  'content/concepts/agt-c-04-context-memory-state-checkpoint.mdx',
  'content/concepts/agt-c-05-tool-sandbox-permission-side-effect.mdx',
  'content/concepts/agt-c-06-trace-evaluation-guardrail.mdx',
  'content/patterns/agt-p-01-workflow-vs-autonomous-agent.mdx',
  'content/patterns/agt-p-02-agentic-rag.mdx',
  'content/patterns/agt-p-03-planner-executor.mdx',
  'content/patterns/agt-p-04-evaluator-optimizer.mdx',
  'content/patterns/agt-p-05-router-model-dispatch.mdx',
  'content/patterns/agt-p-06-supervisor-handoff-agents-as-tools.mdx',
  'content/patterns/agt-p-07-orchestrator-workers-fanout-fanin.mdx',
  'content/patterns/agt-p-08-durable-agent-hitl.mdx',
];
const ROUTES = [
  '/concepts/agt-c-01',
  '/concepts/agt-c-02',
  '/concepts/agt-c-03',
  '/concepts/agt-c-04',
  '/concepts/agt-c-05',
  '/concepts/agt-c-06',
  '/patterns/agt-p-01',
  '/patterns/agt-p-02',
  '/patterns/agt-p-03',
  '/patterns/agt-p-04',
  '/patterns/agt-p-05',
  '/patterns/agt-p-06',
  '/patterns/agt-p-07',
  '/patterns/agt-p-08',
  '/cases/multi-agent-research-system',
  '/cases/long-running-coding-agent',
  '/cases/production-incident-response-agent',
];
const EXPECTED_H1 = new Map([
  ['/concepts/agt-c-01', 'AI 智能体系统边界'],
  ['/concepts/agt-c-02', '智能体运行框架：约束并运行智能体循环'],
  ['/concepts/agt-c-03', '智能体循环：让每一步都经过观察和评估'],
  ['/concepts/agt-c-04', '分开上下文、记忆、状态与执行检查点'],
  ['/concepts/agt-c-05', '让智能体（Agent）的外部效果经过授权和核验'],
  ['/concepts/agt-c-06', '分开证据、质量判断与政策执行'],
  ['/patterns/agt-p-01', '确定性工作流与自治智能体：先分配控制权，再选择自治程度'],
  ['/patterns/agt-p-02', '智能体检索增强生成：证据不足就继续查，预算耗尽就拒答'],
  ['/patterns/agt-p-03', '规划者–执行者：计划可以改，任务真相不能由计划改写'],
  ['/patterns/agt-p-04', '评估者—优化者：反馈可以改进候选，分数不能创造真相'],
  ['/patterns/agt-p-05', '路由与模型驱动分发：模型可以提议去向，不能绕过策略决定执行'],
  ['/patterns/agt-p-06', '监督者、移交与智能体作为工具：多智能体首先是控制权设计'],
  ['/patterns/agt-p-07', '编排者–工作者与扇出/扇入：并行不是无界广播'],
  ['/patterns/agt-p-08', '持久智能体与人工介入：恢复控制状态，不臆测外部真相'],
  ['/cases/multi-agent-research-system', '多智能体研究系统：让证据完成度决定终止'],
  ['/cases/long-running-coding-agent', '长任务编码智能体：把完成状态留在上下文窗口之外'],
  ['/cases/production-incident-response-agent', '生产事故响应智能体：把诊断建议与变更授权分成两条身份链'],
]);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

test('binds the complete local Browser recheck to the exact release candidate content', async () => {
  const evidence = JSON.parse(await readFile(EVIDENCE_PATH, 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(ROOT, 'src/generated/topic-manifest.json'), 'utf8'));
  const recheck = evidence.release_candidate_recheck;
  const observedTree = execFileSync('git', ['rev-parse', `${CANDIDATE}^{tree}`], {cwd: ROOT, encoding: 'utf8'}).trim();
  const currentContentDiff = execFileSync('git', ['diff', '--name-only', CANDIDATE, '--', ...AGENTIC_ARTICLE_PATHS], {cwd: ROOT, encoding: 'utf8'}).trim();
  const changedPaths = execFileSync('git', ['diff', '--name-only', CONTENT_BASE, CANDIDATE, '--', 'content'], {cwd: ROOT, encoding: 'utf8'}).trim().split('\n').sort();
  const manifestInput = changedPaths.map((contentPath) => {
    const bytes = execFileSync('git', ['show', `${CANDIDATE}:${contentPath}`], {cwd: ROOT});
    return `${sha256(bytes)}  ${contentPath}\n`;
  }).join('');
  assert.equal(recheck.browser_verified_head_at_start, CANDIDATE);
  assert.equal(recheck.browser_verified_tree, TREE);
  assert.equal(observedTree, TREE);
  assert.equal(currentContentDiff, '');
  assert.deepEqual(changedPaths, CHANGED_CONTENT_PATHS);
  assert.deepEqual(recheck.public_content_changed_paths, CHANGED_CONTENT_PATHS);
  assert.equal(sha256(manifestInput), CONTENT_MANIFEST_SHA256);
  assert.equal(recheck.public_content_manifest_sha256, CONTENT_MANIFEST_SHA256);
  assert.deepEqual(recheck.viewports, [
    {name: 'desktop', width: 1440, height: 1000},
    {name: 'mobile', width: 390, height: 844},
  ]);
  assert.equal(recheck.summary.routes, 17);
  assert.equal(recheck.summary.viewport_states, 34);
  assert.equal(recheck.summary.failures, 0);
  assert.equal(recheck.summary.visual_inspection, 'PASS');
  assert.equal(recheck.viewport_override_reset, true);
  assert.deepEqual(recheck.final_verify, {
    command: 'npm run verify',
    completed_at_utc: '2026-08-28T02:41:38Z',
    exit_code: 0,
    npm_test: {tests: 1440, pass: 1440, fail: 0},
    content_validation: {documents: 124, registered_sources: 586},
    terminology: {files: 126, registered_terms: 176, issues: 0},
    content_projection: 'PASS',
    cached_links: 'PASS',
    review_health: 'PASS',
    typecheck: 'PASS',
    production_build: 'PASS',
    evidence_file_exception: 'The complete verify consumed the raw candidate recheck and final four-axis review before this result was appended; the result cannot hash or name its own containing commit without becoming self-referential.',
  });

  assert.equal(recheck.states.length, 34);
  assert.deepEqual([...new Set(recheck.states.map(({route}) => route))], ROUTES);
  for (const route of ROUTES) {
    const states = recheck.states.filter((state) => state.route === route);
    assert.deepEqual(states.map(({viewport}) => viewport).sort(), ['desktop', 'mobile']);
  }
  for (const state of recheck.states) {
    const topic = manifest.topics.find(({slug}) => slug === state.route);
    assert.ok(topic, `generated topic for ${state.route}`);
    assert.equal(state.title, `${topic.title} | Tego Arch`);
    assert.equal(state.h1, EXPECTED_H1.get(state.route));
    const expectedWidth = state.viewport === 'desktop' ? 1440 : 390;
    assert.deepEqual(state.document, {client_width: expectedWidth, scroll_width: expectedWidth, horizontal_overflow: false});
    assert.deepEqual(state.console, {warnings: 0, errors: 0});
    for (const region of state.scroll_regions) {
      assert.ok(region.client_width > 0);
      assert.ok(region.scroll_width >= region.client_width);
      assert.equal(region.local_overflow, region.scroll_width > region.client_width);
    }
    const category = state.route.split('/')[1];
    const expectedCategoryH1 = {concepts: '基础概念', patterns: '架构模式', cases: '案例库'}[category];
    assert.deepEqual(state.category_link, {
      clicked: true,
      destination_url: `http://127.0.0.1:3100/tego-arch/${category}`,
      observed_destination_h1: expectedCategoryH1,
      destination_match: true,
      restored_url: `http://127.0.0.1:3100/tego-arch${state.route}`,
      observed_restored_h1: EXPECTED_H1.get(state.route),
      restored_match: true,
    });
    assert.deepEqual(state.screenshot_inspection, {
      inspected: true,
      verdict: 'PASS',
      evidence: 'Fresh top-viewport screenshot inspected for overlap, obstruction, clipping, collision, and unexpected blank regions.',
    });
    assert.equal(state.verdict, 'PASS');
  }
});

test('records all four independent release review axes and the stale-evidence remediation', async () => {
  const review = await readFile(REVIEW_PATH, 'utf8');
  assert.match(review, new RegExp('Browser content candidate: `' + CANDIDATE + '`'));
  assert.match(review, /Accuracy axis: `PASS`/u);
  assert.match(review, /Cases and sources axis: `PASS`/u);
  assert.match(review, /Diagram axis: `PASS`/u);
  assert.match(review, /Integration and release-safety axis: `PASS`/u);
  assert.match(review, /17 routes × 2 viewports/u);
  assert.match(review, /stale Browser evidence/u);
  assert.match(review, /Final Task 6 judgment: `PASS`/u);
});
