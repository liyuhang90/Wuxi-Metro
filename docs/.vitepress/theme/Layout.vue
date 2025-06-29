<!-- .vitepress/theme/Layout.vue -->
<template>
    <Layout>
      <template #layout-bottom>
        <BackToTop />
      </template>
    </Layout>
  </template>
  
  <script setup>
  import DefaultTheme from 'vitepress/theme'
  import BackToTop from './components/BackToTop.vue'
  
  const { Layout } = DefaultTheme
  </script>
  