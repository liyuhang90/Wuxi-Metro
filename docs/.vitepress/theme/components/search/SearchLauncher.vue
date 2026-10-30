<script setup lang="ts">
import { defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vitepress'
import type { SearchHit } from '../../../search/shared'

const SearchDialog = defineAsyncComponent(() => import('./SearchDialog.vue'))
const route = useRoute()
const router = useRouter()
const opened = ref(false)
const ready = ref(false)
const scope = ref<'all' | 'page'>('all')
let timer: ReturnType<typeof setTimeout> | undefined
let unhighlight: ReturnType<typeof setTimeout> | undefined
let activeTarget: HTMLElement | undefined
let generation = 0
function open(nextScope: 'all' | 'page' = 'all') { scope.value = nextScope; opened.value = true }
function globalKeys(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing || event.altKey || event.shiftKey || !(event.ctrlKey || event.metaKey)) return
  const key = event.key.toLowerCase()
  if (key !== 'k' && key !== 'f') return
  const target = event.target instanceof Element ? event.target : null
  if (!opened.value && target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]')) return
  event.preventDefault()
  open(key === 'f' ? 'page' : 'all')
}
function clearTarget() {
  clearTimeout(unhighlight)
  activeTarget?.classList.remove('site-search-target')
  activeTarget = undefined
}
async function locate() {
  const request = ++generation
  clearTimeout(timer)
  clearTarget()
  const targetId = window.location.hash.slice(1)
  if (!/^search-(?:[a-f0-9]{14}-\d+|page)$/.test(targetId)) return
  await nextTick()
  function attempt(remaining: number) {
    if (request !== generation) return
    const marker = document.querySelector<HTMLElement>(`[data-search-id="${targetId}"]`)
    const target = targetId === 'search-page' ? document.querySelector<HTMLElement>('.VPHomeHero') || marker : marker
    if (!target) { if (remaining) timer = setTimeout(() => attempt(remaining - 1), 50); return }
    activeTarget = target
    target.classList.add('site-search-target')
    target.scrollIntoView({ block: 'center', behavior: 'instant' })
    unhighlight = setTimeout(clearTarget, 3500)
  }
  // Wait past VitePress's own scroll restoration, including same-page hash changes.
  timer = setTimeout(() => attempt(40), 80)
}
async function navigate(hit: SearchHit) {
  opened.value = false
  const url = new URL(hit.path, window.location.origin)
  if (url.pathname === window.location.pathname) url.search = window.location.search
  url.hash = hit.target
  await router.go(url.pathname + url.search + url.hash)
  await locate()
}
watch(() => route.path, () => { if (typeof window !== 'undefined') locate() }, { flush: 'post' })
onMounted(() => {
  ready.value = true
  window.addEventListener('keydown', globalKeys)
  window.addEventListener('hashchange', locate)
  window.addEventListener('popstate', locate)
  locate()
})
onBeforeUnmount(() => {
  generation++
  clearTimeout(timer)
  clearTarget()
  window.removeEventListener('keydown', globalKeys)
  window.removeEventListener('hashchange', locate)
  window.removeEventListener('popstate', locate)
})
</script>

<template>
  <button type="button" class="site-search-launcher" :disabled="!ready" aria-label="打开全站搜索" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K" @click="open()">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>
    <span>搜索</span><kbd>Ctrl / ⌘ K</kbd>
  </button>
  <Teleport to="body"><SearchDialog v-if="opened" :scope="scope" @scope="scope = $event" @close="opened = false" @navigate="navigate" /></Teleport>
</template>

<style>
.site-search-launcher { display: inline-flex; flex-shrink: 0; align-items: center; gap: 8px; min-height: 40px; margin: 0 16px; padding: 0 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px; color: var(--vp-c-text-2); background: var(--vp-c-bg-soft); font-size: 13px; cursor: pointer; }
.site-search-launcher:hover, .site-search-launcher:focus-visible { color: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); }
.site-search-launcher kbd { font-size: 10px; }
[data-search-id].site-search-target { outline: 2px solid var(--vp-c-brand-1); outline-offset: 5px; background-color: var(--vp-c-brand-soft); border-radius: 3px; scroll-margin-top: calc(var(--vp-nav-height) + 32px); }
@media (max-width: 767px) { .site-search-launcher { min-height: 44px; margin: 0 6px; padding: 0 8px; } .site-search-launcher kbd { display: none; } }
</style>
