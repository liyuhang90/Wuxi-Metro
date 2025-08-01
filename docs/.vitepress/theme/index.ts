// .vitepress/theme/index.ts
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

// 导入你的自定义组件
import BackToTop from './components/BackToTop.vue'
import Announcement from './components/Announcement.vue'
// 导入新的动画逻辑组件
import HomeAnimation from './components/HomeAnimation.vue'
// 导入新的【日出日落主题切换】组件
import ThemeManager from './components/ThemeManager.vue'

// 导入新的动画样式文件
import './styles/HomeAnimations.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // 在布局底部添加组件
      'layout-bottom': () => [
        h(BackToTop),
        h(Announcement, { 
          version: '0.0.8', 
          autoShow: true 
        }, {
          // 公告内容作为插槽
          default: () => [
            h('ul', [
              h('li', '2025-08-01: 添加自动切换深浅模式的功能。'),
              h('li', '2025-07-22: 主页添加动画效果。'),
              h('li', '2025-07-13: 回顶按钮更新。'),
              h('li', '2025-07-11: 优化公告栏。'),
              h('li', '2025-07-04: 更改了2号线站点的一处错误。'),
              h('li', '2025-06-29: 由原 li-web.xyz 拆分而来的独立板块。')
            ])
          ]
        }),
        // 将动画逻辑组件添加到布局中，它会在每个页面加载时运行其内部逻辑
        h(HomeAnimation),
        // 添加【日出日落主题切换】组件，它没有UI，只在后台运行逻辑
        h(ThemeManager)
      ]
    })
  },
  enhanceApp({ app, router, siteData }) {
    // 全局注册组件
    app.component('BackToTop', BackToTop)
    app.component('Announcement', Announcement)
    // 也可以在这里注册，确保组件可用
    app.component('HomeAnimation', HomeAnimation)
    // ThemeManager 是纯逻辑组件，在Layout中直接使用即可，无需全局注册
  }
} satisfies Theme
