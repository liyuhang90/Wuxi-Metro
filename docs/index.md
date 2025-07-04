---
title: 无锡地铁信息集
description: 由个人创建的非官方无锡地铁信息合集
keywords: [无锡地铁,地铁]
layout: home
hero:
  name: "无锡地铁"
  text: "非官方信息合集"
  tagline: 持续更新中
  image:
    src: /background.svg
    alt: background
  actions:
    - theme: brand
      text: 本站说明
      link: README/index
    - theme: brand
      text: 线路简介
      link: /line_intro/general_intro/index
    - theme: brand
      text: 站点明细
      link: /station_intro/general_intro/index
    - theme: brand
      text: 公告
      link: '#'

features:
  - icon:
      src: /计划.svg
    title: 更新计划
    details: 完成4号线2期工程、5号线以及6号线的信息收录
  - icon:
      src: /官网.svg
    title: 无锡地铁官网
    details: 点击访问
    link: https://www.wxmetro.net/wxmetro/home
  - icon:
      src: /邮箱.svg
    title: 反馈邮箱
    details: Li-feedback@outlook.com
---
<Announcement :version="'0.0.2'">
2025-07-04: 更改了2号线站点的一处错误。<br>
2025-06-29: 由原 li-web.xyz 拆分而来的独立板块。
</Announcement>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const setupAnnouncementButton = () => {
    const actionButtons = document.querySelectorAll('.VPButton')
    actionButtons.forEach(button => {
      if (button.textContent && button.textContent.includes('本站公告')) {
        button.addEventListener('click', (e) => {
          e.preventDefault()
          if (window.showAnnouncement) {
            window.showAnnouncement()
          }
        })
      }
    })
  }
  
  setTimeout(setupAnnouncementButton, 100)
})
</script>
