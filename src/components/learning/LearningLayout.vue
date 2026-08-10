<script setup>
/**
 * 학습 화면 공통 페이지 셸
 * — 기본: 코르크보드 / immersive(퀴즈·플레이어): 다크
 */
defineProps({
  /** 하단 네비 없는 몰입 화면에서 패딩 조정 */
  immersive: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div
    class="flex h-full min-h-0 flex-col overflow-hidden"
    :class="immersive ? 'bg-[var(--auth-page)] px-4 pt-4 pb-6' : 'cork-board'"
  >
    <slot name="header" />
    <div
      class="flex min-h-0 w-full max-w-full flex-1 flex-col overflow-x-hidden overflow-y-auto"
      :class="immersive ? 'mt-4' : 'mt-4 px-5 pb-3'"
    >
      <slot />
    </div>
    <div v-if="$slots.footer" :class="immersive ? '' : 'px-5'">
      <slot name="footer" />
    </div>
  </div>
</template>
