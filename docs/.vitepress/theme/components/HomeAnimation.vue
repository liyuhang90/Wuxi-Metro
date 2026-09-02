<script setup>
import { onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'


const route = useRoute()


let animationTimer = null

let animationRunning = false



/**
 * 结束动画
 *
 * skip:
 * true  = 用户点击跳过
 * false = 动画自然结束
 */
const endAnimation = (skip = false) => {


  if (!animationRunning) {
    return
  }


  animationRunning = false


  // 清除计时器
  if (animationTimer) {

    clearTimeout(animationTimer)

    animationTimer = null

  }



  if (skip) {

    // 添加跳过状态
    document.body.classList.add(
      'animation-skip'
    )

  }



  // 移除播放状态
  document.body.classList.remove(
    'animate-on-load'
  )



  // 通知其他组件动画结束
  window.dispatchEvent(
    new CustomEvent(
      'homeAnimationEnd'
    )
  )



  // 移除监听
  window.removeEventListener(
    'pointerdown',
    skipAnimation
  )

}





/**
 * 用户点击 / 触摸屏幕
 */
const skipAnimation = () => {


  endAnimation(true)


}




/**
 * 开始首页动画
 */
const playAnimation = () => {


  console.log(
    '开始首页动画'
  )


  animationRunning = true



  // 清除旧状态
  document.body.classList.remove(
    'animation-skip'
  )



  // 添加动画状态
  document.body.classList.add(
    'animate-on-load'
  )



  /**
   * pointerdown:
   *
   * PC:
   * 鼠标按下立即触发
   *
   * Mobile:
   * 手指接触屏幕立即触发
   *
   * 不会触发移动端 click 延迟问题
   */
  window.addEventListener(
    'pointerdown',
    skipAnimation,
    {
      passive: true
    }
  )



  /**
   * 动画总时间
   *
   * 最后一个 Feature:
   * 3.9s 延迟
   * +0.6s 动画
   *
   * =4.5s
   *
   * 留100ms缓冲
   */
  animationTimer = setTimeout(() => {


    console.log(
      '动画自然结束'
    )


    endAnimation(false)


  }, 4600)



}





/**
 * 只触发事件
 *
 * 用于已经访问过首页
 * 或路由重新进入首页
 */
const triggerEventOnly = () => {


  window.dispatchEvent(
    new CustomEvent(
      'homeAnimationEnd'
    )
  )


}





onMounted(() => {


  if (route.path === '/') {


    nextTick(() => {


      playAnimation()


    })


  }


})





watch(
  () => route.path,
  (newPath, oldPath) => {


    if (
      newPath === '/' &&
      oldPath !== '/'
    ) {


      triggerEventOnly()


    }


  }

)

</script>