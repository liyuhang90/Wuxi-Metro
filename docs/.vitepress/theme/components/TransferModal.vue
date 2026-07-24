<template>
  <Teleport to="body">
    <div v-if="visible" class="transfer-mask" @click.self="close">
      <div class="transfer-box">
        <div class="transfer-title">请选择需要换乘的线路</div>
        <div class="transfer-btns">
          <button
            v-for="line in lines"
            :key="line"
            class="transfer-btn"
            :style="{ background: getColor(line) }"
            @click="go(line)"
          >
            {{ formatLine(line) }}
          </button>
        </div>
        <button class="transfer-close" @click="close">取消</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, withBase } from 'vitepress'

const router = useRouter()

const visible = ref(false)
const lines = ref<string[]>([])
const anchor = ref('')

// ⭐ 线路专属颜色
const LINE_COLORS: Record<string, string> = {
  '1': '#E30718',
  '2': '#00A738',
  '3': '#17AEF8',
  '4': '#A70984',
  's1': '#F7941D'  // S1 暂用橙色，可自行修改
}

function getColor(line: string): string {
  return LINE_COLORS[line.toLowerCase()] || '#3451b2'
}

function open(otherLines: string[], anchorId: string) {
  lines.value = otherLines
  anchor.value = anchorId
  visible.value = true
}

function close() {
  visible.value = false
}

function formatLine(line: string): string {
  if (/^s/i.test(line)) {
    return line.toUpperCase() + '线'
  }
  return line + '号线'
}

function go(line: string) {
  const dir = `line_${line.toLowerCase()}_station`
  const target = withBase(`/station_intro/${dir}/#${anchor.value}`)
  close()
  router.go(target)
}

defineExpose({ open })
</script>

<style scoped>
.transfer-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.transfer-box {
  background: var(--vp-c-bg, #fff);
  border-radius: 12px;
  padding: 24px 28px;
  min-width: 280px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  text-align: center;
}
.transfer-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--vp-c-text-1, #333);
}
.transfer-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
}
.transfer-btn {
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}
.transfer-btn:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}
.transfer-close {
  padding: 8px 24px;
  font-size: 14px;
  border: 1px solid var(--vp-c-divider, #ccc);
  border-radius: 8px;
  background: transparent;
  color: var(--vp-c-text-2, #666);
  cursor: pointer;
}
</style>