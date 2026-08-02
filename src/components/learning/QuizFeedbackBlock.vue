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
})

const title = computed(() => (props.result === 'correct' ? '정답이에요!' : '아쉬워요, 오답이에요'))
const titleClass = computed(() =>
  props.result === 'correct' ? 'text-[#3d7a4a]' : 'text-[#c12e24]',
)
</script>

<template>
  <div class="mt-5 rounded border border-[rgba(139,100,60,0.2)] bg-[#fff7eb] px-3 py-3">
    <p class="font-serif text-[13px] font-black" :class="titleClass">{{ title }}</p>
    <p
      v-if="explanation"
      class="mt-2 font-serif text-[12px] leading-relaxed whitespace-pre-line text-[rgba(41,33,26,0.85)]"
    >
      {{ explanation }}
    </p>
  </div>
</template>
