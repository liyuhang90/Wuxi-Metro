<!-- .vitepress/theme/components/HomeAnimation.vue -->
<script setup>
import { onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vitepress';

const route = useRoute();

const playAnimation = () => {
  console.log('开始播放首页动画');
  document.body.classList.add('animate-on-load');
  
  // 最后一个动画在3.9s开始，持续0.6s，总时长4.5s
  setTimeout(() => {
    console.log('动画结束，触发事件');
    window.dispatchEvent(new CustomEvent('homeAnimationEnd'));
    document.body.classList.remove('animate-on-load');
  }, 4600); // 4.6秒，确保所有动画完成
};

const triggerEventOnly = () => {
  console.log('直接触发事件，不播放动画');
  window.dispatchEvent(new CustomEvent('homeAnimationEnd'));
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
  (newPath) => {
    if (newPath === '/') {
      triggerEventOnly();
    }
  }
);
</script>
