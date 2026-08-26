import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const registry = JSON.parse(
  readFileSync('tests/fixtures/agentic-topic-system.json', 'utf8'),
);
const groups = JSON.parse(
  readFileSync('data/pattern-groups.json', 'utf8'),
).groups;

test('agent-control group exposes the eight approved patterns in order', () => {
  const matchingGroups = groups.filter(({id}) => id === 'agent-control');
  assert.equal(matchingGroups.length, 1);

  const [group] = matchingGroups;
  assert.deepEqual(group.topic_ids, registry.patterns.map(({id}) => id));
  assert.equal(
    group.description,
    '从确定性工作流到检索循环、多 Agent 控制与可恢复执行。',
  );

  assert.equal(new Set(groups.map(({id}) => id)).size, groups.length);
  const assignedTopicIds = groups.flatMap(({topic_ids: topicIds}) => topicIds);
  assert.equal(new Set(assignedTopicIds).size, assignedTopicIds.length);
});
