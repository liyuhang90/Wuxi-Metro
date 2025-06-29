<template>
    <div class="bilibili-video">
      <iframe
        :src="`//player.bilibili.com/player.html?bvid=${bvid}&page=1`"
        frameborder="0"
        allowfullscreen
        loading="lazy"
      />
    </div>
  </template>
  
  <script>
  export default {
    props: {
      bvid: {
        type: String,
        required: true
      }
    }
  }
  </script>
  
  <style scoped>
  .bilibili-video {
    aspect-ratio: 16/9;
    width: 100%;
    max-width: 800px;
    margin: 20px auto;
  }
  .bilibili-video iframe {
    width: 100%;
    height: 100%;
  }
  </style>
  