<template>
  <TransferModal ref="modalRef" />
</template>

<script setup lang="ts">
import { useRoute } from 'vitepress'
import { onMounted, watch, nextTick, ref } from 'vue'
import TransferModal from './TransferModal.vue'

// ⭐ 已开通线路白名单（整条或部分开通的都算，具体站点用下面的黑名单细化）
const AVAILABLE_LINES = ['1', '2', '3', '4']

// ⭐ 未开通站点黑名单：key = 线路号，value = 该线路上尚未开通的换乘站名称（关键字）
// 用于处理"分段开通"的线路，例如 4 号线部分站点还在建设
// 只要换乘站标题里包含这里列出的站名，该方向就不可换乘
const UNAVAILABLE_STATIONS: Record<string, string[]> = {
  '4': ['无锡新区站'],  // TODO: 换成 4 号线实际未开通的换乘站名
}

const route = useRoute()
const modalRef = ref<InstanceType<typeof TransferModal> | null>(null)

// 从当前 URL 判断是几号线
function getCurrentLine(): string | null {
  const m = location.pathname.match(/line_([0-9a-zA-Z]+)_station/)
  return m ? m[1].toLowerCase() : null
}

// 从标题文字里解析出所有线路号
function parseLines(text: string): string[] {
  const set = new Set<string>()
  const numMatches = text.match(/([0-9]+)号线/g) || []
  numMatches.forEach(s => set.add(s.replace('号线', '').toLowerCase()))
  const sMatches = text.match(/(S[0-9]+)线/gi) || []
  sMatches.forEach(s => set.add(s.replace(/线$/, '').toLowerCase()))
  return [...set]
}

// 提取标题里的站名（去掉线路描述部分）
// 假设标题格式类似 "无锡火车站（1号线/3号线换乘站）" 或 "无锡火车站 1号线 3号线"
function getStationName(text: string): string {
  // 取第一个非线路描述的连续文字作为站名，简单起见直接用整个标题做包含判断
  return text
}

// 判断某条线路在该站点是否可换乘（用于分段开通线路）
function isLineAvailableAtStation(line: string, headingText: string): boolean {
  const badStations = UNAVAILABLE_STATIONS[line]
  if (!badStations) return true  // 该线路没有未开通站点，直接可用
  // 如果标题里包含任一"未开通站名"，则该方向不可换乘
  return !badStations.some(name => headingText.includes(name))
}

function setupTransfer() {
  const currentLine = getCurrentLine()
  if (!currentLine) return

  const headings = document.querySelectorAll<HTMLElement>('.vp-doc h2')

  headings.forEach(h2 => {
    const text = h2.textContent || ''
    const allLines = parseLines(text)

    if (allLines.length >= 2) {
      const others = allLines.filter(
        l =>
          l !== currentLine &&
          AVAILABLE_LINES.includes(l) &&
          isLineAvailableAtStation(l, text)  // ⭐ 分段开通判断
      )
      if (others.length === 0) return

      if (h2.dataset.transferBound) return
      h2.dataset.transferBound = '1'

      h2.style.cursor = 'pointer'
      h2.title = '点击选择换乘线路'

      h2.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (target.closest('a.header-anchor')) return
        modalRef.value?.open(others, h2.id)
      })
    }
  })
}

onMounted(() => {
  nextTick(setupTransfer)
})

watch(() => route.path, () => {
  nextTick(() => setTimeout(setupTransfer, 100))
})
</script>