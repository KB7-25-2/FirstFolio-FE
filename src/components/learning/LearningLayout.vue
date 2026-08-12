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
  /**
   * 하단 Navbar 높이만큼 스크롤 끝 여백(`nav-scroll-pad`) 추가
   * — 내부에서 별도 스크롤 패널을 쓰는 화면은 false로 두고 그 패널에 pad를 붙인다
   */
  padForNav: {
    type: Boolean,
    default: true,
  },
  /** 스크롤 패널 추가 클래스 (snap 등) */
  contentClass: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div
    class="cork-board flex h-full min-h-0 flex-col overflow-hidden"
    :class="immersive ? 'px-4 pt-4' : ''"
  >
    <div class="shrink-0">
      <slot name="header" />
    </div>
    <div
      data-scroll-reveal-root
      class="flex min-h-0 w-full max-w-full flex-1 flex-col overflow-x-hidden overflow-y-auto"
      :class="[
        immersive ? 'pt-4 pb-2' : 'pt-4 px-5',
        !immersive && padForNav && !$slots.footer ? 'nav-scroll-pad' : '',
        contentClass,
      ]"
    >
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="shrink-0"
      :class="immersive ? 'pb-6' : 'nav-dock-pad px-5 pt-1'"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
