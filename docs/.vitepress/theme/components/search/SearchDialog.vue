<script setup lang="ts">
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import type MiniSearch from 'minisearch'
import { loadSearch } from '../../../search/client'
import { search, snippet, type SearchBlock, type SearchGroup, type SearchHit } from '../../../search/shared'
import SearchHighlight from './SearchHighlight.vue'

const props = defineProps<{ scope: 'all' | 'page' }>()
const emit = defineEmits<{ close: []; navigate: [hit: SearchHit]; scope: [scope: 'all' | 'page'] }>()
const route = useRoute()
const { site } = useData()
const dialog = ref<HTMLDialogElement>()
const input = ref<HTMLInputElement>()
const query = ref('')
const groups = shallowRef<SearchGroup[]>([])
const engine = shallowRef<MiniSearch<SearchBlock>>()
const loading = ref(true)
const error = ref(false)
const selected = ref(0)
const pageLimit = ref(10)
const positionLimits = ref<Record<string, number>>({})
const composing = ref(false)
const pendingSearch = ref(false)
let debounce: ReturnType<typeof setTimeout> | undefined
let alive = true
let previousOverflow = ''
let returnFocus: HTMLElement | null = null
const visibleGroups = computed(() => groups.value.slice(0, pageLimit.value))
const visibleHits = computed(() => visibleGroups.value.flatMap(group => group.hits.slice(0, positionLimits.value[group.path] || 1)))
const activeId = computed(() => visibleHits.value[selected.value]?.id)

function run() {
  clearTimeout(debounce)
  pendingSearch.value = false
  if (!engine.value || composing.value) return
  groups.value = search(engine.value, query.value, props.scope === 'page' ? route.path : undefined)
  pageLimit.value = 10
  positionLimits.value = {}
  selected.value = 0
}
function schedule() {
  clearTimeout(debounce)
  // Clear stale selections immediately: Enter must never open an old query's hit.
  groups.value = []
  selected.value = 0
  pendingSearch.value = !!query.value.trim()
  if (!query.value.trim()) { pendingSearch.value = false; return }
  if (!composing.value) debounce = setTimeout(run, 140)
}
function compositionStart() { composing.value = true; clearTimeout(debounce); groups.value = [] }
watch(query, schedule)
watch(() => [props.scope, route.path], run)
async function initialize(fresh = false) {
  loading.value = true
  error.value = false
  try {
    const loaded = await loadSearch(site.value.base, fresh)
    if (!alive) return
    engine.value = markRaw(loaded)
    run()
  } catch { if (alive) error.value = true }
  finally { if (alive) loading.value = false }
}
function keys(event: KeyboardEvent) {
  if (event.isComposing || composing.value) return
  if (event.key === 'Tab') {
    const controls = [...(dialog.value?.querySelectorAll<HTMLElement>('button:not([disabled]), input, [tabindex="0"]') || [])]
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    return
  }
  if (event.key === 'Escape') { event.preventDefault(); emit('close'); return }
  if (['ArrowUp', 'ArrowDown'].includes(event.key) && visibleHits.value.length) {
    event.preventDefault()
    selected.value = (selected.value + (event.key === 'ArrowDown' ? 1 : -1) + visibleHits.value.length) % visibleHits.value.length
    nextTick(() => dialog.value?.querySelector<HTMLElement>('.search-result.selected')?.scrollIntoView({ block: 'nearest' }))
  }
  if (event.key === 'Enter' && event.target === input.value && visibleHits.value[selected.value]) {
    event.preventDefault()
    emit('navigate', visibleHits.value[selected.value])
  }
}
function viewport() {
  if (dialog.value) dialog.value.style.setProperty('--search-viewport', `${window.visualViewport?.height || window.innerHeight}px`)
}
function morePositions(group: SearchGroup) {
  positionLimits.value = { ...positionLimits.value, [group.path]: (positionLimits.value[group.path] || 1) + 5 }
  selected.value = 0
}
onMounted(() => {
  returnFocus = document.activeElement as HTMLElement
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.value?.showModal()
  input.value?.focus()
  viewport()
  window.visualViewport?.addEventListener('resize', viewport)
  initialize(import.meta.env.DEV)
})
onBeforeUnmount(() => {
  alive = false
  clearTimeout(debounce)
  window.visualViewport?.removeEventListener('resize', viewport)
  dialog.value?.close()
  document.body.style.overflow = previousOverflow
  returnFocus?.focus({ preventScroll: true })
})
</script>

<template>
  <dialog ref="dialog" class="site-search-dialog" aria-labelledby="site-search-title" @cancel.prevent="emit('close')" @keydown="keys" @click="event => { if (event.target === dialog) emit('close') }">
    <div class="search-panel">
      <header class="search-header">
        <h2 id="site-search-title">搜索文档</h2>
        <button type="button" aria-label="关闭搜索" @click="emit('close')">关闭 <kbd>Esc</kbd></button>
      </header>
      <div class="search-input-row">
        <label class="search-sr-only" for="site-search-query">搜索关键词</label>
        <input id="site-search-query" ref="input" v-model="query" type="search" maxlength="200" placeholder="输入站名、线路或正文关键词" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="site-search-results" :aria-expanded="!!visibleHits.length" :aria-activedescendant="activeId ? `search-option-${activeId}` : undefined" @compositionstart="compositionStart" @compositionend="composing = false; schedule()" />
        <button v-if="query" type="button" aria-label="清空搜索内容" @click="query = ''; input?.focus()">清空</button>
      </div>
      <div class="search-scopes" role="group" aria-label="搜索范围">
        <button type="button" :aria-pressed="scope === 'all'" @click="emit('scope', 'all'); input?.focus()">全站</button>
        <button type="button" :aria-pressed="scope === 'page'" @click="emit('scope', 'page'); input?.focus()">当前页面</button>
      </div>
      <div class="search-status" role="status" aria-live="polite">
        <template v-if="loading">正在加载搜索索引…</template>
        <template v-else-if="error">搜索索引加载失败，请检查网络后重试。</template>
        <template v-else-if="!query.trim()">输入关键词，搜索标题、正文、表格和代码。</template>
        <template v-else-if="pendingSearch">正在搜索…</template>
        <template v-else-if="!groups.length">没有找到相关内容，请尝试更短的关键词。</template>
        <template v-else>找到 {{ groups.length }} 个页面，{{ groups.reduce((count, group) => count + group.hits.length, 0) }} 处匹配</template>
        <button v-if="error" type="button" @click="initialize(true)">重新加载</button>
      </div>
      <div class="search-scroll">
        <div id="site-search-results" role="listbox" aria-label="搜索结果">
          <template v-for="group in visibleGroups" :key="group.path">
            <button v-for="hit in group.hits.slice(0, positionLimits[group.path] || 1)" :id="`search-option-${hit.id}`" :key="hit.id" type="button" role="option" class="search-result" :class="{ selected: activeId === hit.id }" :aria-selected="activeId === hit.id" @focus="selected = visibleHits.findIndex(item => item.id === hit.id)" @click="emit('navigate', hit)">
              <strong><SearchHighlight :text="hit.pageTitle" :terms="hit.terms" /></strong>
              <span v-if="hit.section" class="search-section"><SearchHighlight :text="hit.section" :terms="hit.terms" /></span>
              <span class="search-snippet"><SearchHighlight :text="snippet(hit)" :terms="hit.terms" /></span>
            </button>
            <button v-if="group.hits.length > (positionLimits[group.path] || 1)" type="button" class="search-more" @click="morePositions(group)">展开「{{ group.title }}」其余 {{ group.hits.length - (positionLimits[group.path] || 1) }} 处匹配</button>
          </template>
        </div>
        <button v-if="groups.length > pageLimit" type="button" class="search-more" @click="pageLimit += 10">显示更多页面（剩余 {{ groups.length - pageLimit }}）</button>
      </div>
      <footer class="search-footer">↑ ↓ 选择 · Enter 打开 · Esc 关闭<span>搜索仅在本机进行</span></footer>
    </div>
  </dialog>
</template>

<style>
.site-search-dialog { position: fixed; inset: 0; width: min(720px, calc(100vw - 40px)); max-width: none; max-height: min(82dvh, calc(var(--search-viewport, 100dvh) - 32px)); margin: 8vh auto auto; padding: 0; border: 1px solid var(--vp-c-divider); border-radius: 14px; color: var(--vp-c-text-1); background: var(--vp-c-bg); box-shadow: var(--vp-shadow-5); overflow: hidden; }
.site-search-dialog::backdrop { background: rgba(0,0,0,.55); }
.site-search-dialog .search-panel { display: flex; flex-direction: column; max-height: min(82dvh, calc(var(--search-viewport, 100dvh) - 32px)); padding: 18px; }
.site-search-dialog button { cursor: pointer; border-radius: 6px; min-height: 40px; }
.site-search-dialog button:focus-visible, .site-search-dialog input:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }
.site-search-dialog .search-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.site-search-dialog h2 { font-size: 18px; font-weight: 650; }
.site-search-dialog .search-header button { font-size: 13px; padding: 0 8px; }
.site-search-dialog kbd { padding: 2px 4px; border: 1px solid var(--vp-c-divider); border-radius: 4px; font-size: 11px; }
.site-search-dialog .search-input-row { display: flex; flex-shrink: 0; align-items: center; gap: 8px; border: 1px solid var(--vp-c-brand-1); border-radius: 8px; padding: 4px 10px; }
.site-search-dialog input { width: 100%; min-width: 0; height: 42px; font-size: 16px; background: transparent; }
.site-search-dialog input:focus-visible { outline: none; }
.site-search-dialog .search-input-row:focus-within { box-shadow: 0 0 0 2px var(--vp-c-brand-soft); }
.site-search-dialog input::-webkit-search-cancel-button { display: none; }
.site-search-dialog .search-input-row button { flex-shrink: 0; }
.site-search-dialog .search-scopes { display: flex; flex-shrink: 0; gap: 8px; margin-top: 12px; }
.site-search-dialog .search-scopes button { padding: 0 16px; background: var(--vp-c-bg-soft); }
.site-search-dialog .search-scopes [aria-pressed=true] { color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); font-weight: 600; }
.site-search-dialog .search-status { padding: 10px 0; font-size: 13px; color: var(--vp-c-text-2); }
.site-search-dialog .search-status button { padding: 0 10px; color: var(--vp-c-brand-1); }
.site-search-dialog .search-scroll { min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.site-search-dialog .search-result { display: flex; flex-direction: column; width: 100%; gap: 5px; text-align: left; white-space: normal; overflow-wrap: anywhere; padding: 12px; border: 1px solid transparent; margin-bottom: 5px; }
.site-search-dialog .search-result.selected { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.site-search-dialog .search-result strong { font-size: 15px; }
.site-search-dialog .search-section { font-size: 13px; color: var(--vp-c-text-2); }
.site-search-dialog .search-snippet { font-size: 14px; line-height: 1.7; }
.site-search-dialog mark { color: var(--vp-c-text-1); background: var(--vp-c-yellow-soft); font-weight: 650; border-radius: 2px; }
.site-search-dialog .search-more { width: 100%; padding: 8px 12px; color: var(--vp-c-brand-1); font-size: 13px; white-space: normal; }
.site-search-dialog .search-footer { display: flex; justify-content: space-between; gap: 8px; flex-shrink: 0; padding-top: 12px; font-size: 11px; color: var(--vp-c-text-2); }
.site-search-dialog .search-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
@media (max-width: 640px) {
  .site-search-dialog { width: calc(100vw - 16px); margin: 8px auto; max-height: calc(var(--search-viewport, 100dvh) - 16px); }
  .site-search-dialog .search-panel { max-height: calc(var(--search-viewport, 100dvh) - 16px); padding: 12px; }
  .site-search-dialog button { min-height: 44px; }
  .site-search-dialog .search-footer { font-size: 10px; }
}
</style>
