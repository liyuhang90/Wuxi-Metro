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
  // 增加一个微小的容差值，避免因像素计算偏差导致无法达到100%
  return Math.min(scrollTop.value / scrollableHeight.value + 0.01, 1)
})

const dashOffset = computed(() => {
  return circumference * (1 - scrollPercent.value)
})

// --- 方法 ---
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 统一的指标更新函数
const updateScrollMetrics = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const docEl = document.documentElement
  scrollableHeight.value = docEl.scrollHeight - docEl.clientHeight
  scrollTop.value = window.pageYOffset || docEl.scrollTop || document.body.scrollTop
  show.value = scrollTop.value > 0
}

// 仅用于更新滚动位置的轻量级函数
const updateScrollTop = () => {
  if (typeof window === 'undefined') return
  scrollTop.value = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
  show.value = scrollTop.value > 0
}

// 【核心】定义一个变量来持有 ResizeObserver 实例
let resizeObserver = null

// 图片加载监听器
let imageLoadObserver = null

// --- 生命周期钩子 ---
onMounted(() => {
  // 确保在浏览器环境中执行
  if (typeof window === 'undefined') return
  
  // 监听滚动，只更新 scrollTop
  window.addEventListener('scroll', updateScrollTop, { passive: true })

  // **【最终解决方案】** 使用 ResizeObserver 监听文档体的大小变化
  // 这是最稳健的方法，可以捕捉到图片加载、异步组件渲染等任何引起页面高度变化的情况
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(updateScrollMetrics)
    resizeObserver.observe(document.body)
  } else {
    // 为不支持 ResizeObserver 的旧浏览器提供降级方案
    window.addEventListener('resize', updateScrollMetrics, { passive: true })
    window.addEventListener('load', updateScrollMetrics, { passive: true })
  }

  // 添加图片加载监听，解决移动端图片加载完成后高度变化问题
  const handleImageLoad = () => {
    // 图片加载完成后更新滚动指标
    setTimeout(updateScrollMetrics, 100)
  }

  // 使用事件委托监听所有图片的加载事件
  document.addEventListener('load', handleImageLoad, true)
  
  // 同时监听可能的错误加载
  document.addEventListener('error', handleImageLoad, true)
  
  // 对于已经存在的图片，检查它们是否已经加载完成
  const images = document.querySelectorAll('img')
  images.forEach(img => {
    if (img.complete) {
      // 图片已经加载完成，立即更新
      updateScrollMetrics()
    } else {
      // 图片尚未加载完成，等待加载
      img.addEventListener('load', updateScrollMetrics)
      img.addEventListener('error', updateScrollMetrics)
    }
  })

  // 初始调用一次以设置初始状态
  updateScrollMetrics()
})

onUnmounted(() => {
  if (typeof window === 'undefined') return

  window.removeEventListener('scroll', updateScrollTop)
  
  // 断开 ResizeObserver 的连接
  if (resizeObserver) {
    resizeObserver.disconnect()
  } else {
    // 移除降级方案的监听器
    window.removeEventListener('resize', updateScrollMetrics)
    window.removeEventListener('load', updateScrollMetrics)
  }
  
  // 移除图片加载监听
  document.removeEventListener('load', handleImageLoad, true)
  document.removeEventListener('error', handleImageLoad, true)
})
</script>

<style scoped>
/* 样式部分保持不变 */
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
  -webkit-tap-highlight-color: transparent;
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
  bottom: 120%;
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

@media (max-width: 768px) {
  .back-to-top {
    right: 1.25rem;
    bottom: 1.25rem;
    width: 2.5rem;
    height: 2.5rem;
  }
  .back-to-top:hover {
    transform: none;
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