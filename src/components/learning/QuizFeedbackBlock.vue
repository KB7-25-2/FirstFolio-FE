<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** correct | wrong */
  result: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    default: '',
  },
  score: {
    type: Number,
    default: 0,
  },
  hint: {
    type: String,
    default: '',
  },
})

const title = computed(() =>
  props.result === 'correct' ? `채점: 정답 (${props.score}점)` : `채점: 오답 (0점)`,
)

const titleClass = computed(() =>
  props.result === 'correct' ? 'text-[#478552]' : 'text-[#d12e29]',
)

const boxClass = computed(() =>
  props.result === 'correct'
    ? 'border-[rgba(71,133,82,0.35)] bg-[#edf5e5]'
    : 'border-[rgba(209,46,41,0.35)] bg-[#faebe5]',
)
</script>

<template>
  <div class="mt-6">
    <div class="mt-3 overflow-hidden rounded border-[0.5px] px-3 py-3" :class="boxClass">
      <p class="font-serif text-[12px] font-black" :class="titleClass">{{ title }}</p>
      <p
        v-if="explanation"
        class="mt-2 font-serif text-[11px] leading-[17px] whitespace-pre-line text-[rgba(41,33,26,0.85)]"
      >
        {{ explanation }}
      </p>
    </div>
  </div>
</template>
