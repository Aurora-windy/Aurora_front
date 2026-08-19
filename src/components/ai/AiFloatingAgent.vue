<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const ballSize = 60
const ballMargin = 24
const tuckedVisibleSize = 22
const dragThreshold = 6
const ballPosition = reactive({ x: 0, y: 0 })
const isDragging = ref(false)
const isHoveringBall = ref(false)
const isTucked = ref(false)
const dockSide = ref<'left' | 'right'>('right')
const dragState = reactive({
  pointerId: 0,
  startClientX: 0,
  startClientY: 0,
  startX: 0,
  startY: 0,
  moved: false,
  suppressClick: false,
})

const isBallExpanded = computed(() => isDragging.value || isHoveringBall.value || !isTucked.value)

const ballStyle = computed(() => {
  const x = isDragging.value ? ballPosition.x : isBallExpanded.value ? expandedDockX() : tuckedDockX()

  return {
    left: `${x}px`,
    top: `${ballPosition.y}px`,
  }
})

function viewportWidth() {
  return window.innerWidth || document.documentElement.clientWidth
}

function viewportHeight() {
  return window.innerHeight || document.documentElement.clientHeight
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function maxBallY() {
  return Math.max(ballMargin, viewportHeight() - ballSize - ballMargin)
}

function expandedDockX() {
  return dockSide.value === 'left' ? 0 : viewportWidth() - ballSize
}

function tuckedDockX() {
  return dockSide.value === 'left' ? -(ballSize - tuckedVisibleSize) : viewportWidth() - tuckedVisibleSize
}

function normalizeBallPosition() {
  ballPosition.y = clamp(ballPosition.y || viewportHeight() - ballSize - ballMargin, ballMargin, maxBallY())
}

function dockBall() {
  dockSide.value = ballPosition.x + ballSize / 2 < viewportWidth() / 2 ? 'left' : 'right'
  ballPosition.x = expandedDockX()
  normalizeBallPosition()
  tuckBallLater()
}

function tuckBallLater() {
  window.setTimeout(() => {
    if (!isDragging.value && !isHoveringBall.value) {
      isTucked.value = true
    }
  }, 650)
}

function handleBallPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  isDragging.value = true
  isTucked.value = false
  dragState.pointerId = event.pointerId
  dragState.startClientX = event.clientX
  dragState.startClientY = event.clientY
  dragState.startX = isBallExpanded.value ? expandedDockX() : tuckedDockX()
  dragState.startY = ballPosition.y
  dragState.moved = false
  dragState.suppressClick = false
  window.addEventListener('pointermove', handleBallPointerMove)
  window.addEventListener('pointerup', handleBallPointerUp)
  window.addEventListener('pointercancel', handleBallPointerUp)
}

function handleBallPointerMove(event: PointerEvent) {
  if (!isDragging.value || event.pointerId !== dragState.pointerId) return
  const deltaX = event.clientX - dragState.startClientX
  const deltaY = event.clientY - dragState.startClientY
  if (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold) {
    dragState.moved = true
    dragState.suppressClick = true
  }
  ballPosition.x = clamp(dragState.startX + deltaX, 0, viewportWidth() - ballSize)
  ballPosition.y = clamp(dragState.startY + deltaY, ballMargin, maxBallY())
}

function handleBallPointerUp(event: PointerEvent) {
  if (event.pointerId !== dragState.pointerId) return
  isDragging.value = false
  removeBallListeners()
  if (dragState.moved) {
    dockBall()
  }
}

function handleBallClick() {
  if (dragState.suppressClick) {
    dragState.suppressClick = false
    return
  }
  // 点击悬浮球 → 进入 AI 助手系统（全屏对话页）
  router.push('/assistant/chat')
}

function handleWindowResize() {
  normalizeBallPosition()
  ballPosition.x = expandedDockX()
}

function removeBallListeners() {
  window.removeEventListener('pointermove', handleBallPointerMove)
  window.removeEventListener('pointerup', handleBallPointerUp)
  window.removeEventListener('pointercancel', handleBallPointerUp)
}

onMounted(() => {
  ballPosition.x = expandedDockX()
  ballPosition.y = viewportHeight() - ballSize - ballMargin
  dockBall()
  window.addEventListener('resize', handleWindowResize)
})

onBeforeUnmount(() => {
  removeBallListeners()
  window.removeEventListener('resize', handleWindowResize)
})
</script>

<template>
  <button
    class="ai-agent-ball"
    :class="[`dock-${dockSide}`, { dragging: isDragging, tucked: isTucked }]"
    :style="ballStyle"
    title="进入 AI 助手系统"
    @click="handleBallClick"
    @pointerdown="handleBallPointerDown"
    @mouseenter="isHoveringBall = true"
    @mouseleave="isHoveringBall = false"
    @focus="isHoveringBall = true"
    @blur="isHoveringBall = false"
  >
    <icon-robot class="ai-agent-ball-icon" />
  </button>
</template>

<style scoped>
.ai-agent-ball {
  position: fixed;
  z-index: 1000;
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 50%;
  color: #fff;
  letter-spacing: 0.5px;
  touch-action: none;
  user-select: none;
  background:
    radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.28), transparent 55%),
    linear-gradient(135deg, rgb(var(--primary-5)), rgb(var(--primary-7)));
  box-shadow:
    0 14px 32px rgba(var(--primary-6), 0.45),
    0 0 0 0 rgba(var(--primary-6), 0.5);
  cursor: grab;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: ball-pulse 2.6s ease-in-out infinite;
  transition:
    left 0.25s ease,
    top 0.2s ease,
    border-radius 0.25s ease,
    box-shadow 0.25s ease,
    opacity 0.25s ease,
    transform 0.25s ease;
}

.ai-agent-ball-icon {
  font-size: 30px;
  color: #fff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.18));
}

.ai-agent-ball:hover,
.ai-agent-ball:focus-visible {
  box-shadow:
    0 18px 40px rgba(var(--primary-6), 0.55),
    0 0 0 6px rgba(var(--primary-6), 0.18);
  outline: none;
  transform: scale(1.08);
}

.ai-agent-ball.dragging {
  cursor: grabbing;
  transition: none;
  animation: none;
}

.ai-agent-ball.tucked {
  opacity: 0.92;
  animation: none;
}

.ai-agent-ball.dock-left.tucked {
  border-radius: 0 50% 50% 0;
}

.ai-agent-ball.dock-right.tucked {
  border-radius: 50% 0 0 50%;
}

@keyframes ball-pulse {
  0% {
    box-shadow:
      0 14px 32px rgba(var(--primary-6), 0.45),
      0 0 0 0 rgba(var(--primary-6), 0.5);
  }
  70% {
    box-shadow:
      0 14px 32px rgba(var(--primary-6), 0.45),
      0 0 0 16px rgba(var(--primary-6), 0);
  }
  100% {
    box-shadow:
      0 14px 32px rgba(var(--primary-6), 0.45),
      0 0 0 0 rgba(var(--primary-6), 0);
  }
}
</style>
