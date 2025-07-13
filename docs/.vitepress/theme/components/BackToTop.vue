<!-- BackToTop.vue (修复Vercel构建失败问题) -->
<template>
  <transition name="fade">
    <div
      v-show="show"
      class="back-to-top"
      @click="scrollToTop"
    >
      <!-- 只在桌面端显示提示框 -->
      <div class="tooltip-container">
        <span class="tooltip">回到顶部</span>
      </div>

      <!-- 优化后的平滑圆环 -->
      <svg
        class="progress-ring"
        viewBox="0 0 44 44"
        shape-rendering="auto"
      >
        <!-- 背景圆 -->
        <circle
          cx="22"
          cy="22"
          r="20"
          fill="none"
          stroke="#1565C0"
          stroke-width="3"
          opacity="0.3"
        />
        <!-- 进度圆 -->
        <circle
          cx="22"
          cy="22"
          r="20"
          fill="none"
          stroke="#42A5F5"
          stroke-width="3"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          transform="rotate(-90 22 22)"
          class="progress-circle"
        />
      </svg>

      <!-- 原箭头 -->
      <svg
        class="icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M13 20h-2V8l-5.5 5.5l-1.42-1.42L12 4.16l7.92 7.92l-1.42 1.42L13 8v12z"
        />
      </svg>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const show = ref(false)
const scrollTop = ref(0)
// 定义一个 ref 来存储可滚动高度，初始化为 0，防止 SSR 报错
const scrollableHeight = ref(0)

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 圆环参数 (半径改为20，给stroke更多空间)
const radius = 20
const circumference = 2 * Math.PI * radius

// 滚动百分比计算
const scrollPercent = computed(() => {
  // 只有当 scrollableHeight 大于 0 时才进行计算
  if (scrollableHeight.value <= 0) {
    return 0
  }
  // 确保百分比在 0 到 1 之间
  return Math.min(Math.max(scrollTop.value / scrollableHeight.value, 0), 1)
})

// 计算偏移量
const dashOffset = computed(() => {
  // 当进度为0时，偏移量等于圆周长（不显示）
  // 当进度为1时，偏移量为0（完全显示）
  // 这里不再需要额外的平滑闭合判断，因为 stroke-linecap="round" 配合精准的 dashOffset 已经足够平滑
  return circumference * (1 - scrollPercent.value)
})

// 统一的滚动事件处理函数
const updateScrollMetrics = () => {
  // 确保在浏览器环境中才访问 document 和 window
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const doc = document.documentElement
    scrollableHeight.value = doc.scrollHeight - doc.clientHeight
    scrollTop.value = window.pageYOffset || doc.scrollTop || document.body.scrollTop || 0
    show.value = scrollTop.value > 300
  }
}

onMounted(() => {
  // 监听滚动事件
  window.addEventListener('scroll', updateScrollMetrics, { passive: true })
  // 首次挂载时更新一次滚动指标，确保初始状态正确
  updateScrollMetrics()
})

onUnmounted(() => {
  // 移除事件监听器
  window.removeEventListener('scroll', updateScrollMetrics)
})
</script>

<style scoped>
.back-to-top {
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  width: 3rem;
  height: 3rem;
  background-color: #1976D2;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.3s ease;
  z-index: 100;
  -webkit-tap-highlight-color: transparent;
}

.back-to-top:hover {
  background-color: #1565C0;
  transform: translateY(-2px);
}

.progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  /* 添加抗锯齿优化，但避免过于激进的 transform，它可能影响某些旧浏览器 */
  /* -webkit-transform: translateZ(0); */
  /* transform: translateZ(0); */
  /* -webkit-backface-visibility: hidden; */
  /* backface-visibility: hidden; */
  /* -webkit-perspective: 1000; */
  /* perspective: 1000; */
}

.progress-circle {
  transition: stroke-dashoffset 0.2s ease;
  /* 进一步优化渲染 */
  /* -webkit-transform: translateZ(0); */
  /* transform: translateZ(0); */
}

.icon {
  position: relative;
  width: 1.75rem;
  height: 1.75rem;
  z-index: 1;
}

.tooltip-container {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
}

.tooltip {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  position: relative;
}

.tooltip::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px 6px 0 6px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0.7) transparent transparent transparent;
}

@media (hover: hover) {
  .back-to-top:hover .tooltip-container {
    opacity: 1;
    visibility: visible;
    transition: opacity 0.3s ease, visibility 0.3s ease;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .back-to-top {
    right: 1rem;
    bottom: 1rem;
    width: 2.5rem;
    height: 2.5rem;
  }

  .icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .tooltip-container {
    display: none;
  }
}
</style>
