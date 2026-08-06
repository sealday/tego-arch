import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {ThemedComponent} from '@docusaurus/theme-common';
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

type FutureDirection = Readonly<{
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

const futureDirections: readonly FutureDirection[] = [
  {
    title: '架构决策速查（Architecture Decision Quick Reference）',
    description: '用于设计、评审与复盘的决策参考',
  },
  {
    title: '精选学习路径（Curated Learning Paths）',
    description: '按角色与任务场景组织学习序列',
  },
  {
    title: 'Tego 参考架构（Tego Reference Architecture）',
    description: '公开真实决策、验证结果与演进路线',
  },
] as const;

const homepageCases = featuredCases.slice(0, 3);

function Hero(): ReactNode {
  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.heroContent}>
          <p className={styles.heroLabel}>Tego Arch 架构知识项目 / 架构决策观察</p>
          <div className={styles.heroTitle}>
            <Heading as="h1">
              <span className={styles.heroTitlePhrase}>在复杂系统里</span>{' '}
              <span className={styles.heroTitlePhrase}>做清醒的选择</span>
            </Heading>
          </div>
          <p className={styles.lede}>
            从边界、状态、控制与质量属性（Quality Attribute）出发，让每个架构决定都能解释、验证和演化
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

type ThemedRoadmapImageProps = Readonly<{
  lightSrc: string;
  darkSrc: string;
  alt: string;
}>;

function ThemedRoadmapImage({lightSrc, darkSrc, alt}: ThemedRoadmapImageProps): ReactNode {
  const lightImageSrc = useBaseUrl(lightSrc);
  const darkImageSrc = useBaseUrl(darkSrc);

  return (
    <ThemedComponent>
      {({theme, className}) => (
        <img
          className={`${styles.roadmapImage} ${className}`}
          src={theme === 'dark' ? darkImageSrc : lightImageSrc}
          width={1672}
          height={941}
          loading="lazy"
          decoding="async"
          alt={alt}
        />
      )}
    </ThemedComponent>
  );
}

function RoadmapSection(): ReactNode {
  return (
    <section className={`${styles.pageSection} ${styles.roadmapSection}`} aria-labelledby="roadmap-title">
      <div className="container">
        <SectionIntro
          id="roadmap-title"
          label="01 / 判断路径"
          title="建立架构判断的主线"
          description="从需求与约束出发，经过建模、模式与治理，在案例和复盘中形成判断"
        />
        <div className={styles.roadmapMedia}>
          <ThemedRoadmapImage
            lightSrc="/img/illustrations/tego-arch-judgment-path-light.png"
            darkSrc="/img/illustrations/tego-arch-judgment-path-dark.png"
            alt="架构判断从需求与约束出发，经过建模、模式与治理，在案例和复盘中逐步形成"
          />
        </div>
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
              <span className={styles.sectionLabel}>精选研究</span>
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

function FutureDirectionsSection(): ReactNode {
  return (
    <section className={styles.pageSection} aria-labelledby="future-title">
      <div className="container">
        <SectionIntro
          id="future-title"
          label="04 / 使用方式"
          title="从理解架构到做出取舍"
          description="需要判断时快速查，系统学习时沿路径走，也从真实架构中理解取舍"
        />
        <div className={`${styles.roadmapMedia} ${styles.futureRoadmap}`}>
          <ThemedRoadmapImage
            lightSrc="/img/illustrations/tego-arch-use-modes-light.png"
            darkSrc="/img/illustrations/tego-arch-use-modes-dark.png"
            alt="一套架构知识体系可以用于快速校准决策、组织学习路径和理解该项目的真实架构取舍"
          />
        </div>
        <ul className={styles.futureList}>
          {futureDirections.map((direction) => (
            <li key={direction.title}>
              <Heading as="h3">{direction.title}</Heading>
              <p>{direction.description}</p>
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
          label="开放研究"
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
        <FutureDirectionsSection />
        <ContributionBand />
      </main>
    </Layout>
  );
}
