import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import CaseCard from '@site/src/components/CaseCard';
import {groupCasesBySeries} from '@site/src/components/CaseCatalog/filterCases';
import {
  caseSeries,
  featuredCases,
  secondCollectionCases,
  seriesLabels,
} from '@site/src/data/caseCatalog';
import projectStatus from '@site/src/generated/project-status.json';
import styles from './index.module.css';

const homepageSeries = new Set(
  caseSeries.filter(({show_on_homepage}) => show_on_homepage).map(({id}) => id),
);

const migrationGroups = groupCasesBySeries(secondCollectionCases).filter(({series}) =>
  homepageSeries.has(series),
);

const learningSteps = [
  ['先问边界', '确认谁在做决策、谁持有状态，以及哪些能力其实属于框架之外。'],
  ['再追控制权', '沿一次任务流观察路由、委派、工具调用、并行和汇合发生在哪里。'],
  ['进入关键源码', '从入口类型、状态结构和调度函数开始，不用仓库体量代替理解。'],
  ['检查生产约束', '逐项审视恢复、安全、观测、评测、成本与并发写入风险。'],
  ['完成迁移判断', '记录适用条件、失效条件和仍未被证据回答的问题。'],
] as const;

const expansionPorts = [
  {
    index: 'A',
    title: '架构模式',
    description: '把 Supervisor、Handoff、Fan-out / Fan-in 等做法放回多个案例交叉验证。',
    href: '/patterns',
    linkLabel: '查看模式索引',
  },
  {
    index: 'B',
    title: '设计题与思考题',
    description: '从真实约束出发练习边界划分、协议选择、故障恢复和治理决策。',
    href: '/questions',
    linkLabel: '进入设计题库',
  },
  {
    index: 'C',
    title: '来源与证据',
    description: '保存官方仓库、规范、文档和访问时间，让结论能够回到一手资料核对。',
    href: '/references',
    linkLabel: '浏览资料库',
  },
] as const;

const futureDeliverables = [
  {
    index: '01',
    title: '便携小抄',
    description:
      '提炼第一性原理、关键判断和高代价错误提醒，以尽可能小的记忆占用守住关键决策。',
  },
  {
    index: '02',
    title: '精华学习路线',
    description:
      '从完整版选择一组连贯主题，形成更短、更易进入，同时能回到完整证据的学习线索。',
  },
  {
    index: '03',
    title: 'Tego 实践与规划',
    description:
      '说明这些架构判断在 Tego 设计中的应用位置、当前取舍与未来规划。',
  },
] as const;

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
}): ReactNode {
  return (
    <div className={styles.sectionHeading}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <Heading id={id} as="h2">
        {title}
      </Heading>
      <p>{description}</p>
    </div>
  );
}

function Hero(): ReactNode {
  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Tego Arch · 软件架构知识图谱</p>
            <Heading as="h1">从高级工程师到架构设计者。</Heading>
            <p className={styles.lede}>
              面向有经验的高级工程师，用证据、权衡与真实案例训练从实现到架构决策的能力。
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryAction} to="/paths">
                沿学习路径开始 <span aria-hidden="true">→</span>
              </Link>
              <Link
                className={styles.secondaryAction}
                href="https://github.com/sealday/tego-arch#参与贡献">
                参与贡献
              </Link>
            </div>
          </div>

          <aside className={styles.fieldNote} aria-label="项目进度">
            <p className={styles.fieldNoteLabel}>PROJECT STATUS</p>
            <Heading as="h2">持续内化进度</Heading>
            <dl>
              <div>
                <dt>持久故事</dt>
                <dd>
                  {projectStatus.durable_stories.completed} /{' '}
                  {projectStatus.durable_stories.total}
                </dd>
              </div>
              <div>
                <dt>已完成主题</dt>
                <dd>{projectStatus.completed_topics}</dd>
              </div>
              <div>
                <dt>内容文档</dt>
                <dd>{projectStatus.content_documents}</dd>
              </div>
              <div>
                <dt>治理来源</dt>
                <dd>{projectStatus.governed_sources}</dd>
              </div>
              <div>
                <dt>当前故事</dt>
                <dd>{projectStatus.durable_stories.current}</dd>
              </div>
            </dl>
            <p className={styles.statusNote}>
              任务状态只在 <code>docs/content-backlog.md</code> 维护。
            </p>
          </aside>
        </div>
      </div>
    </header>
  );
}

function RoadmapSection(): ReactNode {
  const roadmapSrc = useBaseUrl(
    '/img/illustrations/tego-arch-initial-release-roadmap.png',
  );

  return (
    <section className={styles.roadmapSection} aria-labelledby="roadmap-title">
      <div className="container">
        <SectionHeading
          id="roadmap-title"
          eyebrow="INITIAL RELEASE"
          title="初版先完成一套完整的架构知识体系"
          description="路线图展示阶段顺序；精确任务、当前故事与停止条件只在长期 backlog 维护。"
        />
        <figure className={styles.roadmapFigure}>
          <img
            className={styles.roadmapImage}
            src={roadmapSrc}
            width={1672}
            height={941}
            loading="lazy"
            decoding="async"
            alt="Tego Arch 初版发布路线图：从基线与知识主干，经架构风格、领域模式、治理专题和学习闭环走向初版发布"
          />
          <figcaption>
            这是 2026-08-05 的视觉快照，不是实时状态。图例仅代表 2026-08-05
            快照当日：绿色表示当日已完成，橙色表示当日当前阶段，蓝色表示当日待执行；每个阶段都需经过验证、评审、发布和线上检查，这些共同构成发布门槛。最新的精确进度、当前故事和停止条件只在{' '}
            <Link href="https://github.com/sealday/tego-arch/blob/main/docs/content-backlog.md">
              docs/content-backlog.md <span aria-hidden="true">↗</span>
            </Link>
            {' '}维护；该 backlog 是实时、最新状态的唯一事实源。
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function FutureDeliverablesSection(): ReactNode {
  return (
    <section className={styles.futureSection} aria-labelledby="future-title">
      <div className="container">
        <SectionHeading
          id="future-title"
          eyebrow="AFTER THE COMPLETE EDITION"
          title="从完整版继续提炼三类产物"
          description="先建立完整上下文，再针对记忆、学习和实践形成更轻的入口。"
        />
        <div className={styles.futureGrid}>
          {futureDeliverables.map((deliverable) => (
            <article className={styles.futureCard} key={deliverable.index}>
              <span aria-hidden="true">{deliverable.index}</span>
              <Heading as="h3">{deliverable.title}</Heading>
              <p>{deliverable.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Tego Arch"
      description="面向有经验的高级工程师，用证据、权衡与真实案例训练从实现到架构决策的能力。">
      <Hero />
      <main>
        <RoadmapSection />
        <FutureDeliverablesSection />

        <section className={styles.featuredSection} aria-labelledby="featured-cases-title">
          <div className="container">
            <div className={styles.featuredHeader}>
              <div className={styles.sectionHeading}>
                <p className={styles.eyebrow}>LAUNCH COLLECTION · 2026</p>
                <Heading id="featured-cases-title" as="h2">
                  五份首发研究档案
                </Heading>
                <p>五个案例只是起点：分别代表企业参考架构、轻量编排、持久化运行时、跨系统协议与编码 Agent 协作。</p>
              </div>
              <Link className={styles.textLink} to="/cases">
                查看案例库与方法 <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className={styles.caseGrid}>
              {featuredCases.map((caseStudy) => (
                <CaseCard key={caseStudy.slug} caseStudy={caseStudy} />
              ))}
            </div>
          </div>
        </section>

        {migrationGroups.length > 0 && (
          <section
            className={styles.migrationSection}
            aria-labelledby="migration-map-title">
            <div className="container">
              <SectionHeading
                id="migration-map-title"
                eyebrow="MIGRATION MAP"
                title="经典架构迁移地图"
                description="这不是 AI 框架排名，而是从经典分布式、前端协同与边缘系统中研究可迁移的架构机制。"
              />
              <div className={styles.migrationGroups}>
                {migrationGroups.map((group) => (
                  <section className={styles.migrationGroup} key={group.series}>
                    <Heading as="h3">{seriesLabels[group.series]}</Heading>
                    <ul>
                      {group.cases.map((caseStudy) => (
                        <li className={styles.migrationItem} key={caseStudy.slug}>
                          <Heading as="h4">{caseStudy.title}</Heading>
                          <ul aria-label="迁移目标">
                            {caseStudy.migration_targets.slice(0, 2).map((migrationTarget) => (
                              <li key={migrationTarget}>{migrationTarget}</li>
                            ))}
                          </ul>
                          <Link to={caseStudy.slug} aria-label={`阅读案例：${caseStudy.title}`}>
                            阅读案例 <span aria-hidden="true">→</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className={styles.pathSection} aria-labelledby="learning-path-title">
          <div className="container">
            <SectionHeading
              id="learning-path-title"
              eyebrow="READING PROTOCOL"
              title="五步读懂一个软件架构主题"
              description="不从名词表开始。从一个可验证的问题出发，追踪边界、控制、状态与质量属性，再回到证据和工程决策。"
            />
            <ol className={styles.learningSteps}>
              {learningSteps.map(([title, description], index) => (
                <li key={title}>
                  <span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <Heading as="h3">{title}</Heading>
                    <p>{description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link className={styles.textLink} to="/paths">
              沿软件架构主干开始 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section className={styles.expansionSection} aria-labelledby="expansion-title">
          <div className="container">
            <SectionHeading
              id="expansion-title"
              eyebrow="OPEN ENDS"
              title="为上百个案例留下稳定入口"
              description="案例正文持续增加，顶层结构保持稳定。新的知识通过类型、关系和学习目标进入图谱，而不是挤进导航栏。"
            />
            <div className={styles.portGrid}>
              {expansionPorts.map((port) => (
                <article className={styles.portCard} key={port.href}>
                  <span className={styles.portIndex} aria-hidden="true">
                    {port.index}
                  </span>
                  <Heading as="h3">{port.title}</Heading>
                  <p>{port.description}</p>
                  <Link to={port.href}>
                    {port.linkLabel} <span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.contributionSection} aria-labelledby="contribution-title">
          <div className="container">
            <div className={styles.contributionBox}>
              <div>
                <p className={styles.eyebrow}>AN OPEN RESEARCH NOTEBOOK</p>
                <Heading id="contribution-title" as="h2">
                  一起把结论钉在证据上
                </Heading>
                <p>
                  欢迎补充内容、纠正证据、贡献原创插图，或改进站点与内容工具链的工程实现。
                </p>
              </div>
              <div className={styles.contributionActions}>
                <Link
                  className={styles.primaryAction}
                  href="https://github.com/sealday/tego-arch#参与贡献">
                  在 GitHub 参与 <span aria-hidden="true">↗</span>
                </Link>
                <Link className={styles.secondaryAction} to="/intro">
                  阅读研究方法
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
