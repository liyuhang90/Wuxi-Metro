<!-- components/Announcement.vue -->
<template>
  <!-- 公告弹窗 - 可以在任何页面显示 -->
  <div v-if="isVisible" class="announcement-modal" @click="handleModalClick">
    <div class="announcement-content" @click.stop>
      <div class="announcement-header">
        <h3>网站公告</h3>
        <button class="close-btn" @click="closeAnnouncement">&times;</button>
      </div>
      <div class="announcement-body markdown-body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vitepress'

const props = defineProps({
  version: {
    type: String,
    required: true
  },
  autoShow: {
    type: Boolean,
    default: true
  }
})

const route = useRoute()
const router = useRouter()
const isHomePage = computed(() => route.path === '/')
const isVisible = ref(false)
const isOpening = ref(false) // 新增：标记是否正在打开

let observer = null
const cleanupFunctions = []

const showAnnouncement = () => {
  console.log('showAnnouncement 被调用')
  isOpening.value = true
  isVisible.value = true
  
  // 200ms 后解除打开状态标记
  setTimeout(() => {
    isOpening.value = false
  }, 200)
}

const closeAnnouncement = () => {
  console.log('closeAnnouncement 被调用')
  isVisible.value = false
  isOpening.value = false
}

// 处理模态框背景点击
const handleModalClick = () => {
  // 如果正在打开过程中，忽略点击
  if (isOpening.value) {
    console.log('正在打开中，忽略背景点击')
    return
  }
  closeAnnouncement()
}

// 检查是否需要自动显示公告(仅在首页)
const checkAutoShow = () => {
  if (typeof window === 'undefined' || !props.autoShow || !isHomePage.value) {
    return
  }

  const onAnimationEnd = () => {
    console.log('接收到 homeAnimationEnd 事件,准备检查公告版本。');
    const lastVersion = localStorage.getItem('lastAnnouncementVersion')
    const currentVersion = props.version
    
    if (lastVersion !== currentVersion) {
      showAnnouncement()
      localStorage.setItem('lastAnnouncementVersion', currentVersion)
    }
    window.removeEventListener('homeAnimationEnd', onAnimationEnd)
  }

  window.addEventListener('homeAnimationEnd', onAnimationEnd)

  cleanupFunctions.push(() => {
    window.removeEventListener('homeAnimationEnd', onAnimationEnd)
  })
}

const handleAnnouncementClick = (e) => {
  console.log('公告按钮被点击', e)
  e.preventDefault()
  e.stopPropagation()
  
  if (e.stopImmediatePropagation) {
    e.stopImmediatePropagation()
  }
  
  // 延迟执行，确保事件处理完成
  requestAnimationFrame(() => {
    showAnnouncement()
  })
  
  return false
}

// 设置导航栏公告按钮点击事件
const setupNavAnnouncementButton = () => {
  if (typeof window === 'undefined') return

  console.log('开始设置公告按钮...')

  // 移除所有旧的事件监听器
  const oldButtons = document.querySelectorAll('[data-announcement-button]')
  oldButtons.forEach(btn => {
    const clone = btn.cloneNode(true)
    btn.parentNode?.replaceChild(clone, btn)
  })

  let announcementButtons = []
  
  // 查找所有可能的公告按钮
  const allLinks = document.querySelectorAll('a, .link, [role="link"]')
  
  allLinks.forEach(link => {
    const text = link.textContent?.trim() || ''
    const href = link.getAttribute('href') || ''
    
    // 查找包含"公告"文本的链接
    if (text.includes('公告') || text.includes('announcement')) {
      console.log('找到公告按钮:', link, '文本:', text)
      announcementButtons.push(link)
    }
  })

  if (announcementButtons.length === 0) {
    console.warn('未找到任何公告按钮')
    return
  }

  // 为所有找到的按钮绑定事件
  announcementButtons.forEach(button => {
    button.setAttribute('data-announcement-button', 'true')
    
    // 使用多种方式确保事件被捕获
    button.addEventListener('click', handleAnnouncementClick, { capture: true })
    button.addEventListener('touchstart', handleAnnouncementClick, { capture: true, passive: false })
    
    // 额外保险：使用 onclick
    button.onclick = (e) => {
      handleAnnouncementClick(e)
      return false
    }
    
    console.log('已为按钮绑定事件:', button)
    
    cleanupFunctions.push(() => {
      button.removeEventListener('click', handleAnnouncementClick, { capture: true })
      button.removeEventListener('touchstart', handleAnnouncementClick, { capture: true })
      button.onclick = null
    })
  })
}

// 使用 MutationObserver 监听 DOM 变化
const setupMutationObserver = () => {
  if (typeof window === 'undefined') return

  let timeoutId = null

  observer = new MutationObserver((mutations) => {
    // 防抖处理
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      console.log('DOM 发生变化，重新设置按钮')
      setupNavAnnouncementButton()
    }, 300)
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })

  cleanupFunctions.push(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    if (observer) {
      observer.disconnect()
    }
  })
}

onMounted(() => {
  console.log('Announcement 组件已挂载')
  
  nextTick(() => {
    setupNavAnnouncementButton()
    setupMutationObserver()
    checkAutoShow()
  })

  // 监听路由变化
  if (router.onAfterRouteChanged) {
    const cleanup = router.onAfterRouteChanged((to) => {
      console.log('路由变化:', to)
      setTimeout(() => {
        setupNavAnnouncementButton()
        if (to === '/') {
          checkAutoShow()
        }
      }, 100)
    })
    cleanupFunctions.push(cleanup)
  }

  // 多次延迟检查，确保捕获到所有情况
  const delays = [100, 500, 1000]
  delays.forEach(delay => {
    setTimeout(() => {
      setupNavAnnouncementButton()
    }, delay)
  })
})

onUnmounted(() => {
  console.log('Announcement 组件卸载')
  cleanupFunctions.forEach(cleanup => {
    if (typeof cleanup === 'function') {
      cleanup()
    }
  })
  if (observer) {
    observer.disconnect()
  }
})

defineExpose({
  showAnnouncement,
  closeAnnouncement
})
</script>

<style scoped>
.announcement-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.announcement-content {
  background-color: var(--vp-c-bg);
  padding: 24px;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--vp-c-divider-light);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 12px;
}

.announcement-header h3 {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--vp-c-text-2);
  padding: 4px 8px;
  transition: color 0.2s, background-color 0.2s;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg-soft);
}

.announcement-body {
  color: var(--vp-c-text-1);
  line-height: 1.6;
}

/* 确保 markdown 内容样式正确 */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 1em;
  color: var(--vp-c-text-1);
}

.markdown-body :deep(p) {
  margin: 1em 0;
  line-height: 1.6;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.2em;
  margin: 1em 0;
}

.markdown-body :deep(a) {
  color: var(--vp-c-brand);
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  color: var(--vp-c-brand-dark);
  text-decoration: underline;
}

.markdown-body :deep(code) {
  background-color: var(--vp-c-bg-soft);
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.9em;
}

.markdown-body :deep(pre) {
  background-color: var(--vp-c-bg-soft);
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .announcement-content {
    width: 95%;
    padding: 20px;
    max-height: 90vh;
  }
  
  .announcement-header h3 {
    font-size: 18px;
  }
}
</style>