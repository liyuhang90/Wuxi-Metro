import { defineConfig } from 'vitepress'
import { createSearchIntegration } from '../../../docs/.vitepress/search/build'
const search = createSearchIntegration()
export default defineConfig({
  title: '搜索验收',
  base: '/metro-test/',
  cleanUrls: true,
  markdown: { config: search.markdown },
  vite: { plugins: [search.plugin] },
  buildEnd: search.buildEnd
})
