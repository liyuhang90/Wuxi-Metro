// .vitepress/theme/index.ts
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BackToTop from './components/BackToTop.vue'
import Announcement from './components/Announcement.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // 在布局底部添加组件
      'layout-bottom': () => [
        h(BackToTop),
        h(Announcement, { 
          version: '0.0.4', 
          autoShow: true 
        }, {
          // 公告内容作为插槽
          default: () => [
            h('ul', [
              h('li', '2025-07-11: 优化公告栏。'),
              h('li', '2025-07-04: 更改了2号线站点的一处错误。'),
              h('li', '2025-06-29: 由原 li-web.xyz 拆分而来的独立板块。')
            ])
          ]
        })
      ]
    })
  },
  enhanceApp({ app, router, siteData }) {
    // 全局注册组件
    app.component('BackToTop', BackToTop)
    app.component('Announcement', Announcement)
  }
} satisfies Theme