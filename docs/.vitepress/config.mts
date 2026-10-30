import { defineConfig } from 'vitepress'
import metro_introSidebar from './sidebars/metro_intro.mts'
import station_introSidebar from './sidebars/station_intro.mts'
import { createSearchIntegration } from './search/build'
const search = createSearchIntegration()
export default defineConfig({
  markdown: { config: search.markdown },
  vite: { plugins: [search.plugin] },
  buildEnd: search.buildEnd,
  title: "Made By Li",
  description: "由个人整理的非官方无锡地铁信息合集",
  cleanUrls: true,
  lastUpdated: true,
  transformHead({ pageData }) {
    if (pageData.frontmatter.layout === 'home') {
      // 在浏览器绘制首页前启用动画，避免静态 HTML 先完整显示一次。
      return [
        ['script', {}, "document.documentElement.classList.add('animate-on-load')"],
      ]
    }
  },
  head: [
    ['link', { rel: 'icon', href: '/logo.svg' }],
    ['meta', { name: 'robots', content: 'index, follow' }], 
    ['meta', { property: 'og:title', content: '无锡地铁' }],
  ],
  themeConfig: {
    logo: '/logo.svg',
    outline: {
      label: '本页文章',
    },
    sidebarMenuLabel: '页面导航',
    returnToTopLabel: '回到顶部',
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
    nav: [
      { text: '主页', link: '/' },
      { text: '公告', link: '#announcement' },
    ],
sidebar: {
     '/line_intro/': metro_introSidebar,
     '/station_intro/': station_introSidebar,
    },
footer: { copyright: 'Copyright © 2026, Li' },
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium',
      },
    },
    darkModeSwitchLabel: '深浅模式',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    
  }
})
