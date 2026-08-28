import path from 'node:path';
import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const repositoryUrl = 'https://github.com/sealday/tego-arch';

const config: Config = {
  title: 'Tego Arch',
  tagline: '软件架构知识图谱',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://sealday.github.io',
  baseUrl: '/tego-arch/',
  organizationName: 'sealday',
  projectName: 'tego-arch',
  trailingSlash: false,
  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  markdown: {
    mermaid: true,
  },
  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        indexDocs: true,
        indexBlog: false,
        indexPages: false,
        docsRouteBasePath: '/',
        docsDir: 'content',
        language: ['en', 'zh'],
        hashed: 'filename',
        searchResultLimits: 8,
        searchResultContextMaxLength: 80,
        explicitSearchResultPath: true,
        fuzzyMatchingDistance: 1,
        highlightSearchTermsOnTargetPage: false,
        searchBarShortcutKeymap: 'mod+k',
        searchBarPosition: 'right',
        zhUserDictPath: path.resolve('src/search/zh-user-dict.txt'),
      },
    ],
  ],
  plugins: ['./plugins/source-ledger-pages/index.mjs'],

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'content',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Tego Arch',
      items: [
        {to: '/', label: '首页', position: 'left'},
        {to: '/cases', label: '案例库', position: 'left'},
        {to: '/patterns', label: '架构模式', position: 'left'},
        {to: '/questions', label: '设计题', position: 'left'},
        {to: '/paths', label: '学习路径', position: 'left'},
        {to: '/references', label: '资料库', position: 'left'},
        {type: 'search', position: 'right'},
        {href: repositoryUrl, label: 'GitHub', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '内容',
          items: [
            {label: '首页', to: '/'},
            {label: '案例库', to: '/cases'},
            {label: '架构模式', to: '/patterns'},
          ],
        },
        {
          title: '学习',
          items: [
            {label: '设计题', to: '/questions'},
            {label: '学习路径', to: '/paths'},
            {label: '资料库', to: '/references'},
          ],
        },
        {
          title: '项目',
          items: [
            {label: 'GitHub', href: repositoryUrl},
            {label: '代码 · Apache-2.0', href: `${repositoryUrl}/blob/main/LICENSE`},
            {
              label: '内容 · CC BY 4.0',
              href: `${repositoryUrl}/blob/main/LICENSE-CONTENT.md`,
            },
            {label: '第三方材料', href: `${repositoryUrl}/blob/main/NOTICE.md`},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Tego Arch contributors. Code Apache-2.0; original content CC BY 4.0.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
