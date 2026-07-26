export function parseDurableStoryStatus(backlogSource) {
  if (typeof backlogSource !== 'string') {
    throw new TypeError('durable story backlog source must be a string');
  }
  const progress = [
    ...backlogSource.matchAll(
      /^- \*\*持久故事进度：\*\* 已完成 `(\d+) \/ (\d+)`；最近完成 `G(\d{3})`。$/gmu,
    ),
  ];
  const current = [
    ...backlogSource.matchAll(/^- \*\*当前持久故事：\*\* `G(\d{3})`。$/gmu),
  ];
  if (progress.length !== 1 || current.length !== 1) {
    throw new Error(
      'docs/content-backlog.md must contain exactly one durable story progress and current story declaration',
    );
  }

  const completed = Number(progress[0][1]);
  const total = Number(progress[0][2]);
  const lastCompleted = Number(progress[0][3]);
  const currentNumber = Number(current[0][1]);
  if (
    completed !== 5 ||
    total !== 20 ||
    lastCompleted !== 5 ||
    currentNumber !== 6
  ) {
    throw new Error(
      'durable story baseline must be 5 / 20 with G005 complete and G006 current',
    );
  }
  return {completed, total, current: `G${current[0][1]}`};
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
