<!-- .vitepress/theme/components/HomeAnimation.vue -->
<script setup>
import { onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vitepress';

const route = useRoute();

const playAnimation = () => {
  console.log('开始播放首页动画');
  // 先确保添加动画前的准备状态
  document.body.classList.add('prepare-animation');
  
  // 使用nextTick确保DOM更新完成后再添加动画类
  nextTick(() => {
    // 添加一个微小延迟确保样式应用
    setTimeout(() => {
      document.body.classList.add('animate-on-load');
      document.body.classList.remove('prepare-animation');
      
      // 最后一个动画在3.9s开始，持续0.6s，总时长4.5s
      setTimeout(() => {
        console.log('动画结束，触发事件');
        window.dispatchEvent(new CustomEvent('homeAnimationEnd'));
        document.body.classList.remove('animate-on-load');
      }, 4600); // 4.6秒，确保所有动画完成
    }, 50); // 添加50ms的延迟确保CSS正确应用
  });
};

const triggerEventOnly = () => {
  console.log('直接触发事件，不播放动画');
  window.dispatchEvent(new CustomEvent('homeAnimationEnd'));
};

onMounted(() => {
  if (route.path === '/') {
    // 延迟执行动画，确保所有资源加载完成
    setTimeout(() => {
      nextTick(() => {
        playAnimation();
      });
    }, 100);
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