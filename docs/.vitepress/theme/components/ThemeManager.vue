<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

// --- 响应式状态和常量 ---
const sunTimes = ref({ sunrise: null, sunset: null }); // 存储日出日落时间
let mainTimerId = null; // 主定时器ID

// --- 核心功能函数 ---

/**
 * 设置主题（通过操作 <html> 元素的 class）
 * @param {'light' | 'dark'} theme 
 */
function setTheme(theme) {
  const htmlEl = document.documentElement;
  if (theme === 'dark') {
    if (!htmlEl.classList.contains('dark')) htmlEl.classList.add('dark');
  } else {
    if (htmlEl.classList.contains('dark')) htmlEl.classList.remove('dark');
  }
}

/**
 * 主逻辑：仅负责根据当前时间段应用主题
 */
function applyThemeBasedOnPeriod() {
  // 确保已获取日出日落时间
  if (!sunTimes.value.sunrise) return; 

  const now = new Date();
  
  // 应用主题
  if (now >= sunTimes.value.sunrise && now < sunTimes.value.sunset) {
    setTheme('light');
  } else {
    setTheme('dark');
  }
}

/**
 * 获取日出日落时间的API调用函数
 */
async function fetchSunTimes() {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const apiUrl = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0&date=today`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status !== 'OK') return;

        sunTimes.value = {
          sunrise: new Date(data.results.sunrise),
          sunset: new Date(data.results.sunset)
        };
        
        // 首次获取成功后，立即应用一次主题并启动定时器
        applyThemeBasedOnPeriod();
        if (mainTimerId) clearInterval(mainTimerId);
        // 定时器会定期运行，将主题校准回日出日落时间对应的模式
        mainTimerId = setInterval(applyThemeBasedOnPeriod, 1000 * 60); // 每分钟检查一次

      } catch (error) {
        console.error('ThemeManager: 处理API数据时出错:', error);
      }
    },
    (error) => console.warn(`ThemeManager: 无法获取地理位置: ${error.message}。`)
  );
}

/**
 * 设置并监听权限状态
 */
async function setupPermissionAndFetchData() {
  if (!navigator.permissions || !navigator.geolocation) return;

  const confirmText = "本网站获取您的位置用于检测日出日落时间来设置网站的深浅模式，不会用于其他用途，禁用不会影响其他功能。如果不想使用自动切换，请禁用位置权限。";

  try {
    const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
    
    const handlePermission = () => {
      if (permissionStatus.state === 'granted') {
        fetchSunTimes();
      } else if (permissionStatus.state === 'prompt') {
        if (confirm(confirmText)) {
          fetchSunTimes();
        }
      }
    };

    handlePermission();
    permissionStatus.onchange = handlePermission;
  } catch (error) {
    console.warn("ThemeManager: 浏览器不支持查询权限，将直接请求。");
    if (confirm(confirmText)) {
      fetchSunTimes();
    }
  }
}

// --- Vue生命周期钩子 ---

onMounted(() => {
  setupPermissionAndFetchData();
});

onUnmounted(() => {
  if (mainTimerId) clearInterval(mainTimerId);
});
</script>

<!-- 纯逻辑组件，无需<template> -->
