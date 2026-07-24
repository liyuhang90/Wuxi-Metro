import { defineConfig } from 'vitepress'
import metro_introSidebar from './sidebars/metro_intro.mts'
import station_introSidebar from './sidebars/station_intro.mts'
export default defineConfig({
  title: "Made By Li",
  description: "由个人整理的非官方无锡地铁信息合集",
  cleanUrls: true,
  lastUpdated: true,
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
     search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: "搜索本页",
            buttonAriaLabel: "搜索本页",
          },
          modal: {
            noResultsText: "无结果",
            resetButtonTitle: "清空输入",
            displayDetails: "显示详细信息",
            footer: {
              selectText: "选择",
              navigateText: "切换",
              closeText: "关闭",
            },
          },
        },
      },
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
