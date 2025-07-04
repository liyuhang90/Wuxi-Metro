<!-- components/Announcement.vue -->
<template>
  <!-- 当在主页时显示 -->
  <div v-if="isHomePage">
    <!-- 公告弹窗 -->
    <div v-if="isVisible" class="announcement-modal" @click="closeAnnouncement">
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vitepress'

const props = defineProps({
  version: {
    type: String,
    required: true
  }
})

const route = useRoute()
const router = useRouter()
const isHomePage = computed(() => route.path === '/')
const isVisible = ref(false)

// 存储观察器实例和清理函数
let observer = null
let cleanupFunctions = []

const showAnnouncement = () => {
  console.log('显示公告弹窗')
  isVisible.value = true
}

const closeAnnouncement = () => {
  console.log('关闭公告弹窗')
  isVisible.value = false
}

// 检查是否需要自动显示公告
const checkAutoShow = () => {
  if (typeof window !== 'undefined') {
    const lastVersion = localStorage.getItem('lastAnnouncementVersion')
    const currentVersion = props.version
    
    console.log('检查版本:', { lastVersion, currentVersion })
    
    // 当版本号不同时显示弹窗
    if (lastVersion !== currentVersion) {
      setTimeout(() => {
        showAnnouncement()
        localStorage.setItem('lastAnnouncementVersion', currentVersion)
      }, 500)
    }
  }
}

// 事件处理函数
const handleAnnouncementClick = (e) => {
  console.log('按钮被点击了')
  e.preventDefault()
  e.stopPropagation()
  showAnnouncement()
}

// 设置公告按钮点击事件
const setupAnnouncementButton = () => {
  if (typeof window === 'undefined') return
  
  const setupButton = () => {
    // 更广泛的按钮选择策略
    const selectors = [
      'a[href="#announcement"]',
      'a[href*="announcement"]',
      'button[data-announcement]',
      '.VPButton',
      '.VPHero .VPButton',
      '.announcement-btn',
      // 根据文本内容查找按钮
      'a, button, .btn'
    ]
    
    let foundButtons = []
    
    // 先通过选择器查找
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(el => {
        if (el.textContent && 
            (el.textContent.includes('本站公告') || 
             el.textContent.includes('公告') || 
             el.textContent.includes('announcement'))) {
          foundButtons.push(el)
        }
      })
    })
    
    // 如果没找到，通过文本内容全局搜索
    if (foundButtons.length === 0) {
      const allClickable = document.querySelectorAll('a, button, [role="button"], .btn, [onclick]')
      allClickable.forEach(el => {
        if (el.textContent && 
            (el.textContent.includes('本站公告') || 
             el.textContent.includes('公告') || 
             el.textContent.includes('announcement'))) {
          foundButtons.push(el)
        }
      })
    }
    
    console.log('找到的按钮:', foundButtons)
    
    // 为找到的按钮添加事件监听器
    foundButtons.forEach(button => {
      // 移除可能存在的旧事件监听器
      button.removeEventListener('click', handleAnnouncementClick)
      // 添加新的事件监听器
      button.addEventListener('click', handleAnnouncementClick)
      console.log('为按钮添加了事件监听器:', button)
    })
    
    return foundButtons.length > 0
  }
  
  // 立即尝试设置
  let success = setupButton()
  
  // 如果首次未成功，延迟重试
  if (!success) {
    const retryTimes = [100, 500, 1000, 2000]
    retryTimes.forEach(delay => {
      setTimeout(() => {
        if (!setupButton()) {
          console.log(`延迟${delay}ms后仍未找到按钮`)
        }
      }, delay)
    })
  }
  
  // 使用 MutationObserver 监听DOM变化
  if (observer) {
    observer.disconnect()
  }
  
  observer = new MutationObserver((mutations) => {
    let shouldSetup = false
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // 检查是否有新增的可能是按钮的元素
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const text = node.textContent || ''
            if (text.includes('本站公告') || text.includes('公告') || text.includes('announcement')) {
              shouldSetup = true
            }
          }
        })
      }
    })
    
    if (shouldSetup) {
      setTimeout(setupButton, 100)
    }
  })
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
  
  // 监听路由变化
  const handleRouteChange = () => {
    if (isHomePage.value) {
      setTimeout(setupButton, 100)
    }
  }
  
  // VitePress 路由变化监听
  if (router && router.onAfterRouteChanged) {
    router.onAfterRouteChanged(handleRouteChange)
    cleanupFunctions.push(() => {
      // VitePress 可能没有 off 方法，这里做兼容处理
      if (router.offAfterRouteChanged) {
        router.offAfterRouteChanged(handleRouteChange)
      }
    })
  }
  
  return () => {
    if (observer) {
      observer.disconnect()
    }
    cleanupFunctions.forEach(cleanup => cleanup())
  }
}

// 全局暴露函数，便于调试
const exposeGlobalMethods = () => {
  if (typeof window !== 'undefined') {
    window.showAnnouncement = showAnnouncement
    window.closeAnnouncement = closeAnnouncement
    console.log('全局方法已暴露: window.showAnnouncement(), window.closeAnnouncement()')
  }
}

onMounted(async () => {
  console.log('组件挂载，当前路径:', route.path, '是否为首页:', isHomePage.value)
  
  if (isHomePage.value) {
    await nextTick()
    checkAutoShow()
    setupAnnouncementButton()
  }
  
  // 暴露全局方法便于调试
  exposeGlobalMethods()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  cleanupFunctions.forEach(cleanup => cleanup())
})

// 导出方法供外部调用
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