<script setup>
import MemoPin from '@/components/MemoPin.vue'

defineProps({
  /** 배경색 (포스트잇/노트지) */
  surfaceClass: {
    type: String,
    default: 'bg-[#f5edd9]',
  },
  /** 압정 표시 */
  showPin: {
    type: Boolean,
    default: true,
  },
  /** 줄노트 가이드라인 */
  ruled: {
    type: Boolean,
    default: false,
  },
  /** 압정 색 톤 */
  pinTone: {
    type: String,
    default: 'study',
  },
})
</script>

<template>
  <div class="relative w-full">
    <MemoPin v-if="showPin" side="center" :tone="pinTone" />

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
