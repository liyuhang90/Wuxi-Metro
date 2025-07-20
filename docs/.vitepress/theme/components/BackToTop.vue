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
      >
        <!-- 背景圆 -->
        <circle
          cx="22"
          cy="22"
          r="20"
          fill="none"
          stroke-width="3"
          class="progress-ring__bg"
        />
        <!-- 进度圆 -->
        <circle
          cx="22"
          cy="22"
          r="20"
          fill="none"
          stroke-width="3"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          transform="rotate(-90 22 22)"
          class="progress-ring__progress"
        />
      </svg>

      <!-- 箭头图标 -->
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

// --- 响应式状态 ---
const show = ref(false)
const scrollTop = ref(0)
const scrollableHeight = ref(0)

// --- SVG 圆环计算 ---
const radius = 20
const circumference = 2 * Math.PI * radius

const scrollPercent = computed(() => {
  if (scrollableHeight.value <= 0) {
    return 0
  }
  return Math.min(scrollTop.value / scrollableHeight.value, 1)
})

const dashOffset = computed(() => {
  return circumference * (1 - scrollPercent.value)
})

// --- 方法 ---
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const updateScrollMetrics = () => {
  // 确保在浏览器环境中执行
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const docEl = document.documentElement
  // 更新可滚动高度
  scrollableHeight.value = docEl.scrollHeight - docEl.clientHeight
  // 更新当前滚动距离
  scrollTop.value = window.pageYOffset || docEl.scrollTop || document.body.scrollTop
  // 【变更】恢复显示条件为滚动距离大于0
  show.value = scrollTop.value > 0
}

// --- 生命周期钩子 ---
onMounted(() => {
  // 首次挂载时更新一次状态
  updateScrollMetrics()

  // 监听滚动事件
  window.addEventListener('scroll', updateScrollMetrics, { passive: true })
  // **【核心修复】** 监听窗口大小变化事件，以应对移动端浏览器地址栏显隐导致的视口变化
  window.addEventListener('resize', updateScrollMetrics, { passive: true })
})

onUnmounted(() => {
  // 组件卸载时移除事件监听器
  window.removeEventListener('scroll', updateScrollMetrics)
  window.removeEventListener('resize', updateScrollMetrics)
})
</script>

<style scoped>
.back-to-top {
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  width: 2.75rem;
  height: 2.75rem;
  background-color: #1976D2;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: background-color 0.3s, transform 0.3s, opacity 0.3s;
  z-index: 1000;
  -webkit-tap-highlight-color: transparent; /* 移除移动端点击高亮 */
}

.back-to-top:hover {
  background-color: #1565C0;
  transform: translateY(-4px);
}

.progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.progress-ring__bg {
  stroke: #1565C0;
  opacity: 0.3;
}

.progress-ring__progress {
  stroke: #42A5F5;
  transition: stroke-dashoffset 0.2s ease-out;
}

.icon {
  position: relative;
  width: 1.6rem;
  height: 1.6rem;
  z-index: 1;
}

.tooltip-container {
  position: absolute;
  bottom: 120%; /* 调整位置，避免与 transform 冲突 */
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.tooltip {
  background-color: rgba(0, 0, 0, 0.75);
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
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0.75) transparent transparent transparent;
}

/* 使用 (hover: hover) 来确保只在支持悬停的设备上显示 tooltip */
@media (hover: hover) and (min-width: 769px) {
  .back-to-top:hover .tooltip-container {
    opacity: 1;
    visibility: visible;
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

/* 移动端适配 */
@media (max-width: 768px) {
  .back-to-top {
    right: 1.25rem;
    bottom: 1.25rem;
    width: 2.5rem;
    height: 2.5rem;
  }
  .back-to-top:hover {
    transform: none; /* 移动端禁用悬停位移效果 */
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
