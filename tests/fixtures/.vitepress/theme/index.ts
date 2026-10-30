import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import SearchLauncher from '../../../../docs/.vitepress/theme/components/search/SearchLauncher.vue'
export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'nav-bar-content-before': () => h(SearchLauncher) })
}
