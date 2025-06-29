// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BackToTop from './components/BackToTop.vue'
import Announcement from './components/Announcement.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'layout-bottom': () => h(BackToTop)
    })
  },
  enhanceApp({ app, router, siteData }) {
    app.component('BackToTop', BackToTop)
    app.component('Announcement', Announcement)
  }
} satisfies Theme
