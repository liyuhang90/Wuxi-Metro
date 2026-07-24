<script setup>
import { onBeforeUnmount, onMounted, ref, computed } from "vue";

// 控制组件显示/隐藏的响应式变量
const showBackTop = ref(false); 
// 滚动进度的响应式变量
const scrollProgress = ref(0);

// 圆形进度条计算所需的常量和计算属性
const radius = 42; // 圆环半径
const circumference = computed(() => 2 * Math.PI * radius); // 圆环周长

// 平滑滚动到页面顶部的函数
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// 节流函数，用于优化 scroll 事件的触发频率
function throttle(fn, delay = 50) {
  let timer = null;
  return function(...args) {
    if (!timer) {
      timer = setTimeout(() => {
        fn.apply(this, args);
        timer = null;
      }, delay);
    }
  };
}

// 更新滚动进度的函数
const updateScrollProgress = () => {
  const { scrollY, innerHeight } = window;
  const { scrollHeight } = document.documentElement;
  const totalScroll = scrollHeight - innerHeight;
  // 计算滚动百分比，避免分母为0的情况
  scrollProgress.value = totalScroll > 0 ? Math.min(scrollY / totalScroll, 1) : 0;
};

// 滚动事件处理函数
const handleScroll = throttle(() => {
  // 当滚动距离超过100px时显示组件
  showBackTop.value = window.scrollY > 100;
  // 更新滚动进度
  updateScrollProgress();
});

// 在组件挂载时添加滚动事件监听
onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  updateScrollProgress(); // 初始化一次进度
});

// 在组件卸载前移除滚动事件监听，防止内存泄漏
onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <Transition name="fade">
    <div class="back-top-container" v-show="showBackTop">
      <!-- 进度圆环 -->
      <svg class="progress-ring" viewBox="0 0 100 100">
        <!-- 圆环背景 -->
        <circle class="progress-ring-background" cx="50" cy="50" r="42" />
        <!-- 动态进度圆环 -->
        <circle 
          class="progress-ring-circle" 
          cx="50" 
          cy="50" 
          r="42"
          :style="{'stroke-dashoffset': circumference - (scrollProgress * circumference)}"
        />
      </svg>
      <!-- 点击按钮 -->
      <div 
        class="backTop-main" 
        title="返回顶部" 
        @click="scrollToTop()"
      >
        <!-- 向上箭头图标 -->
        <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path d="M512 341.333l-298.667 298.667-64-64L512 213.333l362.667 362.667-64 64L512 341.333z" fill="#FFF"></path>
        </svg>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.back-top-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  z-index: 999;
}

.backTop-main {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  /* 主题色 */
  background-color: #1976D2; 
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: background-color 0.2s ease;
}

.backTop-main:hover {
  /* 悬浮时的颜色，比主题色稍亮 */
  background-color: #42a5f5; 
}

.progress-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  z-index: 1;
}

.progress-ring-background {
  fill: none;
  /* 进度条背景色，使用主题色的低透明度版本（已加深） */
  stroke: rgba(25, 118, 210, 0.3); 
  /* 已加粗 */
  stroke-width: 4; 
}

.progress-ring-circle {
  fill: none;
  /* 进度条颜色，使用主题色 */
  stroke: #1976D2; 
  /* 已加粗 */
  stroke-width: 4; 
  /* 2 * π * 42 ≈ 264 */
  stroke-dasharray: 264; 
  stroke-linecap: round;
  transition: stroke-dashoffset 0.15s ease-out;
}

.icon {
  width: 24px;
  height: 24px;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
