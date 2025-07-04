<!-- components/Announcement.vue -->
<template>
  <!-- 当在主页时显示 -->
  <div v-if="isHomePage">
    <!-- 公告弹窗 -->
    <div v-if="isVisible" class="announcement-modal">
      <div class="announcement-content">
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
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vitepress'

const props = defineProps({
  version: {
    type: String,
    required: true
  }
})

const route = useRoute()
const isHomePage = computed(() => route.path === '/')
const isVisible = ref(false)

const showAnnouncement = () => {
  isVisible.value = true
}

const closeAnnouncement = () => {
  isVisible.value = false
}

const checkAutoShow = () => {
  if (typeof window !== 'undefined') {
    const lastVersion = localStorage.getItem('lastAnnouncementVersion')
    const currentVersion = props.version
    
    if (lastVersion !== currentVersion) {
      setTimeout(() => {
        showAnnouncement()
        localStorage.setItem('lastAnnouncementVersion', currentVersion)
      }, 100)
    }
  }
}

const exposeShowAnnouncement = () => {
  if (typeof window !== 'undefined') {
    window.showAnnouncement = showAnnouncement
  }
}

onMounted(() => {
  if (isHomePage.value) {
    checkAutoShow()
    exposeShowAnnouncement()
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
}

.announcement-content {
  background-color: var(--vp-c-bg);
  padding: 20px;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 10px;
}

.announcement-header h3 {
  margin: 0;
  color: var(--vp-c-text-1);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--vp-c-text-1);
  padding: 4px 8px;
  transition: color 0.2s;
  border-radius: 50%;
}

.close-btn:hover {
  color: var(--vp-c-text-2);
}

.announcement-body {
  color: var(--vp-c-text-1);
  padding: 0 10px;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 1em;
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
  color: #5672CD;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  color: #2A5CCC;
  text-decoration: underline;
}

.markdown-body :deep(code) {
  background-color: var(--vp-c-bg-soft);
  padding: 2px 4px;
  border-radius: 4px;
}

.markdown-body :deep(pre) {
  background-color: var(--vp-c-bg-soft);
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
}
</style>