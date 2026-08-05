import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import {featuredCases} from '@site/src/data/caseCatalog';
import projectStatus from '@site/src/generated/project-status.json';
import styles from './index.module.css';

type HomepageEntry = Readonly<{
  index: string;
  title: string;
  description: string;
  href: string;
}>;

type FutureOutput = Readonly<{
  title: string;
  description: string;
}>;

const homepageEntries: readonly HomepageEntry[] = [
  {
    index: '01',
    title: '建立判断坐标',
    description: '理解驱动因素、边界与权衡如何连成主线',
    href: '/paths',
  },
  {
    index: '02',
    title: '拆解真实系统',
    description: '观察控制、状态、协议与失败在系统中如何发生',
    href: '/cases',
  },
  {
    index: '03',
    title: '回到证据现场',
    description: '核对标准、源码、论文与一手工程材料',
    href: '/references',
  },
] as const;

const futureOutputs: readonly FutureOutput[] = [
  {title: '便携小抄', description: '守住第一性原理与高代价错误'},
  {title: '精华学习路线', description: '从完整体系提取连贯学习线索'},
  {title: 'Tego 实践与规划', description: '说明判断在 Tego 设计中的应用与后续方向'},
] as const;

const homepageCases = featuredCases.slice(0, 3);

function Hero(): ReactNode {
  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.heroContent}>
          <p className={styles.heroLabel}>Tego Arch / 架构决策观察</p>
          <div className={styles.heroTitle}>
            <Heading as="h1">在复杂系统里 做清醒的选择</Heading>
          </div>
          <p className={styles.lede}>
            从边界、状态、控制与质量属性出发，让每个架构决定都能解释、验证和演化
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} to="/paths">
              开始建立判断坐标 <span aria-hidden="true">→</span>
            </Link>
            <Link className={styles.secondaryAction} to="/intro">
              了解研究方法
            </Link>
          </div>
          <dl className={styles.statusRail} aria-label="项目研究状态">
            <div><dt>研究主题</dt><dd>{projectStatus.content_documents}</dd></div>
            <div><dt>治理来源</dt><dd>{projectStatus.governed_sources}</dd></div>
            <div><dt>当前研究</dt><dd>{projectStatus.durable_stories.current}</dd></div>
          </dl>
        </div>
        <div className={styles.heroRelations} aria-hidden="true">
          <span /><span /><span />
        </div>
      </div>
    </header>
  );
}

type SectionIntroProps = Readonly<{
  id: string;
  label: string;
  title: string;
  description?: string;
}>;

function SectionIntro({id, label, title, description}: SectionIntroProps): ReactNode {
  return (
    <div className={styles.sectionIntro}>
      <p className={styles.sectionLabel}>{label}</p>
      <div>
        <Heading id={id} as="h2">{title}</Heading>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}

function RoadmapStatusContent(): ReactNode {
  return (
    <>
      <strong>这是一张历史快照</strong>
      <p>图中颜色只表示 2026-08-05 快照当日状态。</p>
      <ul>
        <li>绿色表示快照当日已完成</li>
        <li>橙色表示快照当日当前阶段</li>
        <li>蓝色表示快照当日待执行</li>
      </ul>
      <p>每个阶段仍需经过验证、评审、发布与线上检查。</p>
      <Link href="https://github.com/sealday/tego-arch/blob/main/docs/content-backlog.md">
        查看实时 backlog <span aria-hidden="true">↗</span>
      </Link>
    </>
  );
}

function RoadmapSection(): ReactNode {
  const roadmapSrc = useBaseUrl('/img/illustrations/tego-arch-initial-release-roadmap.png');

  return (
    <section className={`${styles.pageSection} ${styles.roadmapSection}`} aria-labelledby="roadmap-title">
      <div className="container">
        <SectionIntro
          id="roadmap-title"
          label="01 / 初版路线"
          title="一张持续展开的架构坐标"
          description="初版沿一条可验证的研究路线展开。首页保留方向，实时进度回到 backlog"
        />
        <figure className={styles.roadmapFigure}>
          <div className={styles.roadmapMedia}>
            <img
              className={styles.roadmapImage}
              src={roadmapSrc}
              width={1672}
              height={941}
              loading="lazy"
              decoding="async"
              alt="Tego Arch 初版发布路线图：从基线与知识主干走向完整初版发布"
            />
          </div>
          <div className={styles.roadmapDesktopInfo}>
            <button
              type="button"
              className={styles.roadmapInfoControl}
              aria-describedby="roadmap-status-note">
              状态与图例说明
            </button>
            <div id="roadmap-status-note" role="note" className={styles.roadmapInfoPanel}>
              <RoadmapStatusContent />
            </div>
          </div>
          <details className={styles.roadmapMobileDetails}>
            <summary>关于这张路线图</summary>
            <div><RoadmapStatusContent /></div>
          </details>
          <figcaption className={styles.roadmapMeta}>
            <span>初版路线图 · 2026-08-05 快照</span>
            <a href={roadmapSrc} target="_blank" rel="noreferrer" className={styles.roadmapLargeLink}>
              查看大图 <span aria-hidden="true">↗</span>
            </a>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function EntrySection(): ReactNode {
  return (
    <section className={styles.pageSection} aria-labelledby="entry-title">
      <div className="container">
        <SectionIntro
          id="entry-title"
          label="02 / 进入方式"
          title="从问题出发"
          description="选择与你当前任务最接近的入口，不必先读完整个知识体系"
        />
        <div className={styles.entryList}>
          {homepageEntries.map((entry) => (
            <Link className={styles.entryRow} to={entry.href} key={entry.href}>
              <span className={styles.entryIndex} aria-hidden="true">{entry.index}</span>
              <Heading as="h3">{entry.title}</Heading>
              <p>{entry.description}</p>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResearchHighlights(): ReactNode {
  const leadCase = homepageCases[0];

  return (
    <section className={styles.pageSection} aria-labelledby="research-title">
      <div className="container">
        <SectionIntro
          id="research-title"
          label="03 / 研究档案"
          title="正在研究的系统"
          description="从真实案例观察架构选择如何落到控制、状态、协议与失败边界"
        />
        <div className={styles.researchGrid}>
          {leadCase && (
            <Link className={styles.researchLead} to={leadCase.slug}>
              <span className={styles.sectionLabel}>FEATURED NOTE</span>
              <Heading as="h3">{leadCase.title}</Heading>
              <p>{leadCase.summary}</p>
              <span>打开研究档案 <span aria-hidden="true">→</span></span>
            </Link>
          )}
          <div>
            <ul className={styles.researchList}>
              {homepageCases.slice(1).map((caseStudy) => (
                <li key={caseStudy.slug}>
                  <Link to={caseStudy.slug}>{caseStudy.title} <span aria-hidden="true">→</span></Link>
                </li>
              ))}
            </ul>
            <Link className={styles.textLink} to="/cases">查看全部研究档案 <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FutureOutputSection(): ReactNode {
  return (
    <section className={styles.pageSection} aria-labelledby="future-title">
      <div className="container">
        <SectionIntro id="future-title" label="04 / 后续产物" title="下一步，让完整内容变得更轻" />
        <ul className={styles.futureList}>
          {futureOutputs.map((output) => (
            <li key={output.title}>
              <Heading as="h3">{output.title}</Heading>
              <p>{output.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ContributionBand(): ReactNode {
  return (
    <section className={`${styles.pageSection} ${styles.contributionBand}`} aria-labelledby="contribution-title">
      <div className="container">
        <SectionIntro
          id="contribution-title"
          label="OPEN RESEARCH"
          title="这是一份开放的研究记录"
          description="欢迎修订证据、补充案例、贡献原创图示，或改进研究工具链"
        />
        <Link className={styles.primaryAction} href="https://github.com/sealday/tego-arch#参与贡献">
          参与修订与共建 <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Tego Arch"
      description="从边界、状态、控制与质量属性出发，让每个架构决定都能解释、验证和演化。">
      <Hero />
      <main>
        <RoadmapSection />
        <EntrySection />
        <ResearchHighlights />
        <FutureOutputSection />
        <ContributionBand />
      </main>
    </Layout>
  );
}
