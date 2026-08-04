<script setup>
defineProps({
  /** 배경색 (포스트잇/노트지) */
  surfaceClass: {
    type: String,
    default: 'bg-[#f5edd9]',
  },
  /** 테이프 표시 */
  showTape: {
    type: Boolean,
    default: true,
  },
  /** 줄노트 가이드라인 */
  ruled: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="relative w-full">
    <div
      v-if="showTape"
      class="pointer-events-none absolute top-[-8px] left-1/2 z-20 h-4 w-[70px] -translate-x-1/2 -rotate-[2deg] border-[0.5px] border-white/25 bg-[var(--study-tape)]"
      aria-hidden="true"
    />

    <div
      class="relative overflow-hidden rounded-[2px] border border-[rgba(212,184,150,0.55)] shadow-[0_4px_14px_rgba(0,0,0,0.28)]"
      :class="surfaceClass"
    >
      <!-- 줄노트 배경 -->
      <div
        v-if="ruled"
        class="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style="
          background-image:
            linear-gradient(
              to right,
              transparent 27px,
              rgba(193, 80, 80, 0.35) 27px,
              rgba(193, 80, 80, 0.35) 28px,
              transparent 28px
            ),
            repeating-linear-gradient(
              to bottom,
              transparent,
              transparent 21px,
              rgba(139, 100, 60, 0.12) 21px,
              rgba(139, 100, 60, 0.12) 22px
            );
          background-position: 0 36px;
        "
      />
      <div class="relative z-10">
        <slot />
      </div>
    </div>
  </div>
</template>
