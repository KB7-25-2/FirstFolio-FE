<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** circle | slash */
  type: {
    type: String,
    required: true,
  },
  /** sm | lg */
  size: {
    type: String,
    default: 'sm',
  },
})

const isCircle = computed(() => props.type === 'circle')
const boxClass = computed(() => (props.size === 'lg' ? 'h-[88px] w-[110px]' : 'h-7 w-7'))
</script>

<template>
  <span
    class="quiz-grade-mark pointer-events-none inline-block"
    :class="boxClass"
    aria-hidden="true"
  >
    <svg v-if="isCircle" class="quiz-grade-mark__svg size-full" viewBox="0 0 56 56" fill="none">
      <ellipse
        class="quiz-grade-mark__stroke quiz-grade-mark__stroke--circle"
        cx="28"
        cy="28"
        rx="22"
        ry="20"
        transform="rotate(-8 28 28)"
        stroke="#d12e29"
        stroke-width="3.2"
        stroke-linecap="round"
      />
    </svg>
    <svg v-else class="quiz-grade-mark__svg size-full" viewBox="0 0 40 72" fill="none">
      <path
        class="quiz-grade-mark__stroke quiz-grade-mark__stroke--slash"
        d="M28 6 C22 22 16 40 10 64"
        stroke="#d12e29"
        stroke-width="4"
        stroke-linecap="round"
      />
    </svg>
  </span>
</template>

<style scoped>
.quiz-grade-mark__stroke {
  fill: none;
  opacity: 0.92;
}

.quiz-grade-mark__stroke--circle {
  stroke-dasharray: 140;
  stroke-dashoffset: 140;
  animation: quiz-mark-draw 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.quiz-grade-mark__stroke--slash {
  stroke-dasharray: 90;
  stroke-dashoffset: 90;
  animation: quiz-mark-draw 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.quiz-grade-mark__svg {
  display: block;
  filter: drop-shadow(0 1px 0 rgba(209, 46, 41, 0.15));
}

@keyframes quiz-mark-draw {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
