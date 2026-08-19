<script setup>
defineOptions({ name: 'LearningShellView' })

import { computed, onActivated, onDeactivated, onUnmounted, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

const SCENARIO_ROOM_CLASS = 'scenario-room'
const SCENARIO_ROOM_BG = '#1a1a2e'
const CORK_THEME_COLOR = '#f7f1e4'
const CROSSFADE_MS = 300

const route = useRoute()
const fromScenarioQuiz = ref(false)
/** 콘텐츠 fade-out 이후에만 상담실 배경으로 바꾼다 */
const isScenarioRoom = ref(route.name === 'learning-scenario-quiz')
let roomTimer

function crossfadeMs() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : CROSSFADE_MS
}

function syncDocumentRoom(on) {
  document.documentElement.classList.toggle(SCENARIO_ROOM_CLASS, on)
  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) themeColor.setAttribute('content', on ? SCENARIO_ROOM_BG : CORK_THEME_COLOR)
}

function clearRoomTimer() {
  if (roomTimer) {
    window.clearTimeout(roomTimer)
    roomTimer = undefined
  }
}

watch(
  () => route.name,
  (name, prev) => {
    fromScenarioQuiz.value = prev === 'learning-scenario-quiz'
  },
)

if (isScenarioRoom.value) syncDocumentRoom(true)

onActivated(() => {
  syncDocumentRoom(isScenarioRoom.value)
})

onDeactivated(() => {
  clearRoomTimer()
  syncDocumentRoom(false)
})

onUnmounted(() => {
  clearRoomTimer()
  syncDocumentRoom(false)
})

const pageTransition = computed(() =>
  route.name === 'learning-scenario-quiz' || fromScenarioQuiz.value ? 'scenario-route' : '',
)

const onAfterLeave = () => {
  const on = route.name === 'learning-scenario-quiz'
  isScenarioRoom.value = on
  clearRoomTimer()
  if (on) {
    roomTimer = window.setTimeout(() => syncDocumentRoom(true), crossfadeMs())
    return
  }
  syncDocumentRoom(false)
}
</script>

<template>
  <div class="relative flex h-full min-h-0 flex-col overflow-hidden">
    <div class="cork-board absolute inset-0" aria-hidden="true" />
    <div
      class="scenario-room-veil pointer-events-none absolute inset-0"
      :class="{ 'is-on': isScenarioRoom }"
      aria-hidden="true"
    />
    <Teleport to="body">
      <div
        class="scenario-room-veil pointer-events-none fixed inset-0 z-0"
        :class="{ 'is-on': isScenarioRoom }"
        aria-hidden="true"
      />
    </Teleport>
    <div class="relative z-10 flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <RouterView v-slot="{ Component, route: viewRoute }">
        <Transition :name="pageTransition" mode="out-in" @after-leave="onAfterLeave">
          <KeepAlive :include="['LearningRoadmapView']">
            <component :is="Component" :key="viewRoute.name" class="h-full min-h-0" />
          </KeepAlive>
        </Transition>
      </RouterView>
    </div>
  </div>
</template>
