<script setup>
import { computed } from 'vue'

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
    return 'ring-2 ring-[#3d7a4a] border-[#3d7a4a] bg-[#d8efd0]'
  }
  if (props.variant === 'wrong') {
    return 'ring-2 ring-[#c12e24] border-[#c12e24] bg-[#f8d4d0] opacity-90'
  }
  return 'border-[rgba(184,173,148,0.4)]'
})

const circleLabel = computed(() => CIRCLE_NUM[props.optionKey] ?? props.optionKey)
</script>

<template>
  <button
    type="button"
    class="flex min-h-[52px] w-full items-center gap-3 rounded-md border-[0.8px] px-3 py-2 text-left disabled:cursor-default"
    :class="[toneClass, variantClass]"
    :disabled="disabled"
    @click="$emit('select', optionKey)"
  >
    <span class="shrink-0 font-serif text-[14px] font-bold text-[#29211a]">{{ circleLabel }}</span>
    <span class="font-serif text-[13px] text-[#29211a]">{{ label }}</span>
  </button>
</template>
