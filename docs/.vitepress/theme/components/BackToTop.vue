<!-- BackToTop.vue (优化圆环平滑度) -->
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
          r="18"
          fill="none"
          stroke="#1565C0"
          stroke-width="3"
          stroke-linecap="round"
        />
        <!-- 前景弧 -->
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke="#42A5F5"
          stroke-width="3"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeOffset"
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

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 圆环参数
const radius = 18
const circumference = 2 * Math.PI * radius

// 滚动百分比计算
const scrollPercent = computed(() => {
  const doc = document.documentElement
  const scrollHeight = doc.scrollHeight
  const clientHeight = doc.clientHeight
  const scrollableHeight = scrollHeight - clientHeight
  
  if (scrollableHeight <= 0) {
    return 0
  }
  
  return Math.min(scrollTop.value / scrollableHeight, 1)
})

// 计算 stroke-dashoffset
const strokeOffset = computed(() => {
  const progress = scrollPercent.value
  let offset = circumference * (1 - progress)
  
  // 为了平滑闭合，当接近完成时设置一个极小的偏移
  if (progress >= 0.999) {
    offset = 0.1
  }
  
  return offset
})

const handleScroll = () => {
  scrollTop.value = window.pageYOffset || document.documentElement.scrollTop
  show.value = scrollTop.value > 300
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll() // 初始化
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.back-to-top {
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  width: 3.5rem;
  height: 3.5rem;
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
  /* 添加抗锯齿优化 */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  -webkit-perspective: 1000;
  perspective: 1000;
}

.progress-circle {
  transition: stroke-dashoffset 0.1s ease;
  /* 进一步优化渲染 */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.icon {
  position: relative;
  width: 2rem;
  height: 2rem;
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
    width: 3rem;
    height: 3rem;
  }

  .icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .tooltip-container {
    display: none;
  }
}
</style>
