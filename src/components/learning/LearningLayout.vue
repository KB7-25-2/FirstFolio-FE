<script setup>
/**
 * 학습 화면 공통 페이지 셸 (코르크보드 배경)
 */
defineProps({
  /** 하단 네비 없는 몰입 화면 */
  immersive: {
    type: Boolean,
    default: false,
  },
  /** 헤더를 좌우·상단 풀블리드로 (칠판 헤더용) */
  bleedHeader: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div
    class="cork-board flex h-full min-h-0 flex-col overflow-hidden"
    :class="immersive && !bleedHeader ? 'px-4 pt-4' : ''"
  >
    <div class="shrink-0" :class="bleedHeader ? 'w-full' : ''">
      <slot name="header" />
    </div>
    <div
      class="flex min-h-0 w-full max-w-full flex-1 flex-col overflow-x-hidden overflow-y-auto"
      :class="[
        immersive ? (bleedHeader ? 'px-4 pt-4 pb-2' : 'mt-4 pb-2') : 'mt-4 px-5',
        !immersive && !$slots.footer ? 'nav-scroll-pad' : '',
      ]"
    >
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="shrink-0"
      :class="immersive ? (bleedHeader ? 'px-4 pb-5' : 'pb-6') : 'nav-dock-pad px-5 pt-1'"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
