<script setup>
/**
 * 학습 화면 공통 페이지 셸 (다크 배경 + 헤더 슬롯)
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
    class="flex h-full min-h-0 flex-col bg-[var(--auth-page)]"
    :class="immersive ? 'px-4 pt-4 pb-6' : 'px-5 pt-6 pb-3'"
  >
    <slot name="header" />
    <div
      class="mt-4 flex min-h-0 w-full max-w-full flex-1 flex-col overflow-x-hidden overflow-y-auto"
    >
      <slot />
    </div>
    <slot name="footer" />
  </div>
</template>
