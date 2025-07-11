<!-- components/Announcement.vue -->
<template>
  <!-- 公告弹窗 - 可以在任何页面显示 -->
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

// 检查是否需要自动显示公告（仅在首页）
const checkAutoShow = () => {
  if (typeof window !== 'undefined' && props.autoShow && isHomePage.value) {
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
  console.log('公告按钮被点击了')
  e.preventDefault()
  e.stopPropagation()
  showAnnouncement()
}

// 设置导航栏公告按钮点击事件
const setupNavAnnouncementButton = () => {
  if (typeof window === 'undefined') return
  
  const setupButton = () => {
    // 针对导航栏的按钮选择策略
    const selectors = [
      // VitePress 导航栏相关选择器
      '.VPNavBar a[href*="announcement"]',
      '.VPNavBarMenu a[href*="announcement"]',
      '.VPNavBarMenuGroup a[href*="announcement"]',
      '.VPNavBarMenuLink[href*="announcement"]',
      // 通用导航栏选择器
      'nav a[href*="announcement"]',
      'header a[href*="announcement"]',
      '.nav a[href*="announcement"]',
      // 根据文本内容查找导航栏中的按钮
      '.VPNavBar a, .VPNavBarMenu a, nav a, header a'
    ]
    
    let foundButtons = []
    
    // 通过选择器查找
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(el => {
        // 检查链接或按钮文本
        if (el.textContent && 
            (el.textContent.trim().includes('公告') || 
             el.textContent.trim().includes('announcement') ||
             el.href && el.href.includes('announcement'))) {
          foundButtons.push(el)
        }
      })
    })
    
    // 如果没找到，更广泛地搜索导航区域
    if (foundButtons.length === 0) {
      const navAreas = document.querySelectorAll('.VPNavBar, .VPNavBarMenu, nav, header, .nav')
      navAreas.forEach(navArea => {
        const allLinks = navArea.querySelectorAll('a, button, [role="button"]')
        allLinks.forEach(el => {
          if (el.textContent && 
              (el.textContent.trim().includes('公告') || 
               el.textContent.trim().includes('announcement') ||
               el.href && el.href.includes('announcement'))) {
            foundButtons.push(el)
          }
        })
      })
    }
    
    console.log('找到的导航栏按钮:', foundButtons)
    
    // 为找到的按钮添加事件监听器
    foundButtons.forEach(button => {
      // 移除可能存在的旧事件监听器
      button.removeEventListener('click', handleAnnouncementClick)
      // 添加新的事件监听器
      button.addEventListener('click', handleAnnouncementClick)
      console.log('为导航栏按钮添加了事件监听器:', button)
    })
    
    return foundButtons.length > 0
  }
  
  // 立即尝试设置
  let success = setupButton()
  
  // 如果首次未成功，延迟重试（因为VitePress可能需要时间渲染导航栏）
  if (!success) {
    const retryTimes = [100, 300, 500, 1000, 2000]
    retryTimes.forEach(delay => {
      setTimeout(() => {
        const retrySuccess = setupButton()
        if (!retrySuccess) {
          console.log(`延迟${delay}ms后仍未找到导航栏按钮`)
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
        // 检查是否有新增的导航栏相关元素
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches && (
                node.matches('.VPNavBar') || 
                node.matches('.VPNavBarMenu') || 
                node.matches('nav') ||
                node.matches('header') ||
                node.querySelector('.VPNavBar, .VPNavBarMenu, nav, header')
              )) {
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
    setTimeout(setupButton, 100)
  }
  
  // VitePress 路由变化监听
  if (router && router.onAfterRouteChanged) {
    router.onAfterRouteChanged(handleRouteChange)
    cleanupFunctions.push(() => {
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

// 全局暴露函数，便于调试和外部调用
const exposeGlobalMethods = () => {
  if (typeof window !== 'undefined') {
    window.showAnnouncement = showAnnouncement
    window.closeAnnouncement = closeAnnouncement
    console.log('全局方法已暴露: window.showAnnouncement(), window.closeAnnouncement()')
  }
}

onMounted(async () => {
  console.log('组件挂载，当前路径:', route.path)
  
  await nextTick()
  
  // 设置导航栏按钮点击事件（在所有页面都设置）
  setupNavAnnouncementButton()
  
  // 仅在首页检查是否需要自动显示公告
  if (isHomePage.value) {
    checkAutoShow()
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