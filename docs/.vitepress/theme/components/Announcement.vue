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

let observer = null
const cleanupFunctions = []

const showAnnouncement = () => {
  isVisible.value = true
}

const closeAnnouncement = () => {
  isVisible.value = false
}

// 检查是否需要自动显示公告（仅在首页）
const checkAutoShow = () => {
  // 确保在浏览器环境中执行
  if (typeof window === 'undefined' || !props.autoShow || !isHomePage.value) {
    return
  }

  const onAnimationEnd = () => {
    console.log('接收到 homeAnimationEnd 事件，准备检查公告版本。');
    const lastVersion = localStorage.getItem('lastAnnouncementVersion')
    const currentVersion = props.version
    
    if (lastVersion !== currentVersion) {
      showAnnouncement()
      localStorage.setItem('lastAnnouncementVersion', currentVersion)
    }
    // 任务完成后移除监听器，避免内存泄漏
    window.removeEventListener('homeAnimationEnd', onAnimationEnd)
  }

  // 添加事件监听器，等待主页动画完成的信号
  window.addEventListener('homeAnimationEnd', onAnimationEnd)

  // 将移除监听器的操作添加到清理函数中
  cleanupFunctions.push(() => {
    window.removeEventListener('homeAnimationEnd', onAnimationEnd)
  })
}

const handleAnnouncementClick = (e) => {
  e.preventDefault()
  e.stopPropagation()
  showAnnouncement()
}

// 设置导航栏公告按钮点击事件
const setupNavAnnouncementButton = () => {
  if (typeof window === 'undefined') return

  // 使用更稳定、更具体的选择器，并增加文本内容检查
  const navLinks = document.querySelectorAll('.VPNavBarMenu a.VPNavBarMenuLink')
  let announcementButton = null;

  navLinks.forEach(link => {
    if (link.textContent && link.textContent.trim().includes('公告')) {
      announcementButton = link;
    }
  });

  if (announcementButton) {
    console.log('成功找到公告按钮:', announcementButton);
    // 先移除旧的监听器，再添加新的，防止重复绑定
    announcementButton.removeEventListener('click', handleAnnouncementClick);
    announcementButton.addEventListener('click', handleAnnouncementClick);
    
    // 将移除操作添加到清理函数
    cleanupFunctions.push(() => {
      announcementButton.removeEventListener('click', handleAnnouncementClick);
    });
  } else {
    // 如果在主导航没找到，尝试在移动端菜单中查找
    const mobileMenuLinks = document.querySelectorAll('.VPNavBarMenu a[href]')
    mobileMenuLinks.forEach(link => {
        if (link.textContent && link.textContent.trim().includes('公告')) {
            announcementButton = link;
        }
    });

    if (announcementButton) {
        console.log('成功找到移动端公告按钮:', announcementButton);
        announcementButton.removeEventListener('click', handleAnnouncementClick);
        announcementButton.addEventListener('click', handleAnnouncementClick);
        cleanupFunctions.push(() => {
            announcementButton.removeEventListener('click', handleAnnouncementClick);
        });
    } else {
        console.warn('未在导航栏或移动菜单中找到“公告”按钮。');
    }
  }
}

onMounted(() => {
  // nextTick 确保 DOM 已经渲染完毕
  nextTick(() => {
    setupNavAnnouncementButton()
    checkAutoShow()
  });

  // 监听 VitePress 路由变化，在导航后重新设置按钮事件
  if (router.onAfterRouteChanged) {
    const cleanup = router.onAfterRouteChanged((to) => {
      nextTick(() => {
        setupNavAnnouncementButton()
        // 只有在目标路径是主页时才再次检查自动显示
        if (to === '/') {
          checkAutoShow()
        }
      })
    })
    cleanupFunctions.push(cleanup)
  }
})

onUnmounted(() => {
  // 组件卸载时，执行所有清理工作
  cleanupFunctions.forEach(cleanup => cleanup())
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
