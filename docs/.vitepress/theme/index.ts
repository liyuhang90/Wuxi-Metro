// .vitepress/theme/index.ts
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

// 导入你的自定义组件
import BackToTop from './components/BackToTop.vue'
import Announcement from './components/Announcement.vue'
// 导入新的动画逻辑组件
import HomeAnimation from './components/HomeAnimation.vue'
// 导入换乘功能组件
import TransferSetup from './components/TransferSetup.vue'
import TransferModal from './components/TransferModal.vue'

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
          version: '1.2.0',
          autoShow: true
        }, {
          // 公告内容作为插槽
          default: () => [
            h('ul', [
              h('li', '2026-07-24: 添加了站点换乘快速跳转功能。'),
              h('li', '2025-10-05: 修复了移动端无法打开公告栏的问题。'),
              h('li', '2025-10-04: 更新了S1线的站点明细。'),
              h('li', '2025-09-28: 更改了2号线站点的一处错误。'),
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
        // 换乘功能：扫描换乘站标题 + 弹窗
        h(TransferSetup),
      ]
    })
  },
  enhanceApp({ app, router, siteData }) {
    // 全局注册组件
    app.component('BackToTop', BackToTop)
    app.component('Announcement', Announcement)
    // 也可以在这里注册，确保组件可用
    app.component('HomeAnimation', HomeAnimation)
    // 注册换乘组件
    app.component('TransferSetup', TransferSetup)
    app.component('TransferModal', TransferModal)
  }
} satisfies Theme