<!-- .vitepress/theme/components/HomeAnimation.vue -->
<script setup>
import { onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vitepress';
const route = useRoute();
const playAnimation = () => {
  console.log('开始播放首页动画');
  
  // 设置路径标识，配合CSS预防闪现
  document.body.setAttribute('data-path', '/');
  
  // 添加动画类
  document.body.classList.add('animate-on-load');
  
  setTimeout(() => {
    console.log('动画结束，触发事件');
    window.dispatchEvent(new CustomEvent('homeAnimationEnd'));
    document.body.classList.remove('animate-on-load');
    // 保留 data-path 属性，以防用户快速切换页面
  }, 4600);
};
const triggerEventOnly = () => {
  console.log('直接触发事件，不播放动画');
  // 设置路径但不播放动画
  document.body.setAttribute('data-path', '/');
  window.dispatchEvent(new CustomEvent('homeAnimationEnd'));
};
// 清理函数，离开主页时移除标识
const cleanup = () => {
  document.body.removeAttribute('data-path');
  document.body.classList.remove('animate-on-load');
};
onMounted(() => {
  if (route.path === '/') {
    nextTick(() => {
      playAnimation();
    });
  }
});
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath === '/') {
      triggerEventOnly();
    } else if (oldPath === '/') {
      // 离开主页时清理
      cleanup();
    }
  }
);
</script>
