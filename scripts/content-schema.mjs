export const requiredFields = [
  'title',
  'slug',
  'content_type',
  'status',
  'difficulty',
  'analyzed_at',
  'source_cutoff',
  'confidence',
  'domains',
  'agent_patterns',
  'protocols',
  'quality_attributes',
  'tags',
];

export const knowledgeContentTypes = [
  'concept',
  'principle',
  'quality-attribute',
  'method',
  'modeling',
  'style',
  'pattern',
];

export const knowledgeRequiredFields = [
  'summary',
  'topic_id',
  'priority',
  'depends_on',
  'adjacent_topics',
  'related_cases',
];

export const allowedPriorities = ['P0', 'P1', 'P2', 'P3'];

export const knowledgeTypeContracts = {
  concept: [
    '## 学习问题',
    '## 定义与尺度边界',
    '## 核心机制',
    '## 常见混淆',
    '## 说明性场景',
    '## 相邻主题',
    '## 来源',
  ],
  principle: [
    '## 学习问题',
    '## 要保护的性质',
    '## 冲突与适用上下文',
    '## 机制',
    '## 误用与反原则',
    '## 适用尺度',
    '## 相邻原则',
    '## 说明性场景',
    '## 来源',
  ],
  'quality-attribute': [
    '## 学习问题',
    '## 定义与业务目标',
    '## 质量属性场景',
    '## 架构策略',
    '## 测量信号与阈值',
    '## 权衡与失败模式',
    '## 相邻质量属性',
    '## 说明性场景',
    '## 来源',
  ],
  method: [
    '## 学习问题',
    '## 输入与参与者',
    '## 步骤',
    '## 产物',
    '## 完成判断',
    '## 常见失败',
    '## 与其他方法的衔接',
    '## 完整演练',
    '## 来源',
  ],
  modeling: [
    '## 学习问题',
    '## 建模目标与输入',
    '## 参与者与步骤',
    '## 模型产物',
    '## 完成判断',
    '## 常见失败',
    '## 与其他模型的衔接',
    '## 完整演练',
    '## 来源',
  ],
  style: [
    '## 学习问题',
    '## 组件、连接器与约束',
    '## 边界与控制流',
    '## 数据所有权与一致性',
    '## 部署单元与故障域',
    '## 团队拓扑',
    '## 质量属性收益与成本',
    '## 迁移路径',
    '## 禁用条件',
    '## 对比案例',
    '## 来源',
  ],
  pattern: [
    '## 学习问题',
    '## 问题与适用上下文',
    '## 约束与驱动力',
    '## 结构与协作关系',
    '## 运行机制',
    '## 失败模式与误用',
    '## 质量属性权衡',
    '## 实现与迁移提示',
    '## 相邻模式与反模式',
    '## 说明性场景',
    '## 来源',
  ],
};

export const closingPrincipleTopicIds = new Set(['PR-15', 'PR-16', 'PR-17']);

export const closingPrincipleHeadings = [
  '## 学习问题',
  '## 一页摘要',
  '## 事实边界',
  '## 架构图',
  '## 控制权与任务流',
  '## 关键源码导读',
  '## 架构决策与权衡',
  '## 生产化分析',
  '## 可迁移经验',
  '## 来源',
];

export const mod08ModelingHeadings = [
  '## 学习问题',
  '## 建模目标与输入',
  '## 两类状态与权威记录',
  '## 模型产物',
  '## 转换合同',
  '## 超时、取消与补偿',
  '## 完成判断',
  '## 常见失败',
  '## 与其他模型的衔接',
  '## 完整演练',
  '## 来源',
];

export const mod09ModelingHeadings = [
  '## 学习问题',
  '## 建模目标与输入',
  '## 参与者与步骤',
  '## 模型产物',
  '## 完成判断',
  '## 常见失败',
  '## 与其他模型的衔接',
  '## 完整演练',
  '## 来源',
];

export const mod10ModelingHeadings = [
  '## 学习问题',
  '## 建模目标与输入',
  '## 元素选择与证据边界',
  '## 核心产物',
  '## 完成判断',
  '## 常见失败',
  '## 与其他模型的衔接',
  '## 完整演练',
  '## 来源',
];

export const mod11ModelingHeadings = [
  '## 学习问题',
  '## 建模目标与输入',
  '## 边界候选与证据规则',
  '## 核心产物',
  '## 完成判断',
  '## 常见失败',
  '## 与其他模型的衔接',
  '## 完整演练',
  '## 来源',
];

export const mod12ModelingHeadings = [
  '## 学习问题',
  '## 审阅目标与输入',
  '## 四道审阅门',
  '## 核心产物',
  '## 完成判断',
  '## 常见失败',
  '## 与其他模型的衔接',
  '## 完整演练',
  '## 来源',
];

export const mod13ModelingHeadings = [
  '## 学习问题',
  '## 同步目标与输入',
  '## 权威事实台账',
  '## 漂移检测闭环',
  '## 核心产物',
  '## 完成判断',
  '## 常见失败',
  '## 与其他模型的衔接',
  '## 完整演练',
  '## 来源',
];

export function knowledgeHeadingContract(type, topicId) {
  if (type === 'principle' && closingPrincipleTopicIds.has(topicId)) {
    return closingPrincipleHeadings;
  }
  if (type === 'modeling' && topicId === 'MOD-08') {
    return mod08ModelingHeadings;
  }
  if (type === 'modeling' && topicId === 'MOD-09') {
    return mod09ModelingHeadings;
  }
  if (type === 'modeling' && topicId === 'MOD-10') {
    return mod10ModelingHeadings;
  }
  if (type === 'modeling' && topicId === 'MOD-11') {
    return mod11ModelingHeadings;
  }
  if (type === 'modeling' && topicId === 'MOD-12') {
    return mod12ModelingHeadings;
  }
  if (type === 'modeling' && topicId === 'MOD-13') {
    return mod13ModelingHeadings;
  }
  return knowledgeTypeContracts[type];
}

export const qualityAttributeScenarioHeadings = [
  '### 来源（Source）',
  '### 刺激（Stimulus）',
  '### 环境（Environment）',
  '### 对象（Artifact）',
  '### 响应（Response）',
  '### 响应度量（Response Measure）',
];

export const allowedValues = {
  content_type: [
    'case',
    'question',
    'path',
    'reference',
    ...knowledgeContentTypes,
  ],
  status: ['draft', 'reviewed', 'revisited'],
  difficulty: ['beginner', 'intermediate', 'advanced'],
  confidence: ['low', 'medium', 'high'],
};

export const caseRequiredFields = [
  'summary',
  'series',
  'catalog_order',
  'featured',
  'source_kinds',
  'migration_targets',
];

export const allowedSourceKinds = [
  'official-docs',
  'open-source-project',
  'classic-paper',
  'engineering-blog',
  'reference-architecture',
];

export const requiredMigrationHeadings = [
  '### 可直接复用的机制',
  '### 只能有限类比的部分',
  '### 不应照搬的部分',
];

export const requiredCaseHeadings = [
  '## 学习问题',
  '## 一页摘要',
  '## 事实边界',
  '## 架构图',
  '## 控制权与任务流',
  '## 关键源码导读',
  '## 架构决策与权衡',
  '## 生产化分析',
  '## 可迁移经验',
  '## 来源',
];
