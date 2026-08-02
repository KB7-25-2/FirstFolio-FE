<script setup>
import { computed } from 'vue'
import QuizGradeMark from '@/components/learning/QuizGradeMark.vue'

const props = defineProps({
  optionKey: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  /** green | blue | pink | yellow */
  tone: {
    type: String,
    default: 'yellow',
  },
  /** default | selected | correct | wrong */
  variant: {
    type: String,
    default: 'default',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select'])

const CIRCLE_NUM = { 1: '①', 2: '②', 3: '③', 4: '④', O: 'O', X: 'X' }

const toneClass = computed(() => {
  const map = {
    green: 'bg-[#e5f2e0]',
    blue: 'bg-[#e0edf7]',
    pink: 'bg-[#f5e5ed]',
    yellow: 'bg-[#faf2db]',
  }
  return map[props.tone] ?? map.yellow
})

const variantClass = computed(() => {
  if (props.variant === 'selected') {
    return 'ring-2 ring-[#c17f24] border-[#c17f24]'
  }
  if (props.variant === 'correct') {
    return 'border-[rgba(184,173,148,0.4)] bg-[#d1e5f2]'
  }
  if (props.variant === 'wrong') {
    return 'border-[rgba(184,173,148,0.4)] bg-[#f7e5e5]'
  }
  return 'border-[rgba(184,173,148,0.4)]'
})

const labelClass = computed(() => {
  if (props.variant === 'correct') return 'font-bold text-[#29211a]'
  if (props.variant === 'wrong') return 'font-bold text-[rgba(209,46,41,0.85)]'
  return 'font-normal text-[#29211a]'
})

const circleLabel = computed(() => CIRCLE_NUM[props.optionKey] ?? props.optionKey)
const showCircle = computed(() => props.variant === 'correct')
const showSlash = computed(() => props.variant === 'wrong')
</script>

<template>
  <button
    type="button"
    class="memo-selectable relative flex min-h-[52px] w-full items-center gap-3 overflow-visible rounded-md border-[0.8px] px-3 py-2 text-left transition-[box-shadow,background-color] duration-200 disabled:cursor-default"
    :class="[toneClass, variantClass]"
    :disabled="disabled"
    @click="$emit('select', optionKey)"
  >
    <span class="relative z-[1] shrink-0 font-serif text-[14px] font-bold text-[#29211a]">
      {{ circleLabel }}
      <QuizGradeMark
        v-if="showCircle"
        type="circle"
        size="sm"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[8deg]"
      />
      <QuizGradeMark
        v-else-if="showSlash"
        type="slash"
        size="sm"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[6deg]"
      />
    </span>
    <span class="relative z-[1] font-serif text-[13px]" :class="labelClass">{{ label }}</span>
  </button>
</template>
