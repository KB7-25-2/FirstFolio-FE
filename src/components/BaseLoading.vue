<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: String,
    default: '불러오는 중…',
  },
  /** 영역 중앙 정렬 (화면/패널 단위 로딩) */
  fullPage: {
    type: Boolean,
    default: false,
  },
  /** onDark: 다크 배경 · onLight: 메모지/밝은 배경 */
  tone: {
    type: String,
    default: 'onDark',
    validator: (value) => ['onDark', 'onLight'].includes(value),
  },
})

const toneClass = computed(() =>
  props.tone === 'onLight' ? 'text-[rgba(41,33,26,0.55)]' : 'text-[rgba(245,237,217,0.55)]',
)
</script>

<template>
  <div
    class="font-serif text-sm"
    :class="[toneClass, fullPage ? 'flex flex-1 items-center justify-center py-10' : '']"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <p class="animate-pulse">{{ message }}</p>
  </div>
</template>
