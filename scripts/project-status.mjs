export function parseDurableStoryStatus(backlogSource) {
  if (typeof backlogSource !== 'string') {
    throw new TypeError('durable story backlog source must be a string');
  }
  const lines = backlogSource.split(/\r?\n/u);
  const progressCandidates = lines.filter((line) =>
    line.startsWith('- **持久故事进度：**'),
  );
  const currentCandidates = lines.filter((line) =>
    line.startsWith('- **当前持久故事：**'),
  );
  if (progressCandidates.length !== 1 || currentCandidates.length !== 1) {
    throw new Error(
      'docs/content-backlog.md must contain exactly one durable story progress and current story declaration',
    );
  }

  const progress = progressCandidates[0].match(
    /^- \*\*持久故事进度：\*\* 已完成 `(\d+) \/ (\d+)`；最近完成 `G(\d{3})`。$/u,
  );
  const current = currentCandidates[0].match(
    /^- \*\*当前持久故事：\*\* `G(\d{3})`。$/u,
  );
  if (!progress || !current) {
    throw new Error(
      'docs/content-backlog.md must use the exact durable story declaration format',
    );
  }

  const completed = Number(progress[1]);
  const total = Number(progress[2]);
  const lastCompleted = Number(progress[3]);
  const currentNumber = Number(current[1]);
  if (
    total !== 20 ||
    completed !== lastCompleted ||
    currentNumber !== lastCompleted + 1
  ) {
    throw new Error(
      'durable story baseline must align completed count, recently completed story, and next current story',
    );
  }
  return {completed, total, current: `G${current[1]}`};
}

export function buildProjectStatus({
  backlogSource,
  topics,
  documents,
  ledger,
}) {
  if (!Array.isArray(topics)) {
    throw new TypeError('topics must be an array');
  }
  if (!Array.isArray(documents)) {
    throw new TypeError('documents must be an array');
  }
  if (!ledger || !Array.isArray(ledger.sources)) {
    throw new TypeError('ledger sources must be an array');
  }

  const topicIds = new Set();
  for (const topic of topics) {
    if (topicIds.has(topic.id)) {
      throw new Error(`duplicate topic ID: ${topic.id}`);
    }
    topicIds.add(topic.id);
  }

  return {
    schema_version: 1,
    durable_stories: parseDurableStoryStatus(backlogSource),
    completed_topics: topics.filter(({complete}) => complete === true).length,
    content_documents: documents.length,
    governed_sources: ledger.sources.length,
    sources: {
      durable_stories: 'docs/content-backlog.md',
      completed_topics: 'docs/content-backlog.md',
      content_documents: 'content/**/*.{md,mdx}',
      governed_sources: 'data/source-ledger.json',
    },
  };
}
