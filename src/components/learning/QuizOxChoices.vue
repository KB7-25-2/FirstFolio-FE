<script setup>
import { computed } from 'vue'
import QuizGradeMark from '@/components/learning/QuizGradeMark.vue'

const props = defineProps({
  /** @type {{ key: string, label?: string }[]} */
  choices: {
    type: Array,
    default: () => [],
  },
  /** @type {(key: string) => 'default' | 'selected' | 'correct' | 'wrong'} */
  optionVariant: {
    type: Function,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select'])

const normalizedChoices = computed(() => {
  const fromProps = props.choices.filter((choice) => choice?.key === 'O' || choice?.key === 'X')
  if (fromProps.length) {
    return fromProps.slice().sort((a, b) => {
      if (a.key === b.key) return 0
      return a.key === 'O' ? -1 : 1
    })
  }
  return [
    { key: 'O', label: 'O' },
    { key: 'X', label: 'X' },
  ]
})

const choiceClass = (key) => {
  const variant = props.optionVariant(key)
  if (variant === 'selected') return 'ring-2 ring-[#c17f24] border-[#c17f24] bg-[#faf2db]'
  if (variant === 'correct') return 'border-[rgba(184,173,148,0.4)] bg-[#d1e5f2]'
  if (variant === 'wrong') return 'border-[rgba(184,173,148,0.4)] bg-[#f7e5e5]'
  if (key === 'O') return 'border-[rgba(184,173,148,0.4)] bg-[#e5f2e0]'
  return 'border-[rgba(184,173,148,0.4)] bg-[#f5e5ed]'
}

const labelClass = (key) => {
  const variant = props.optionVariant(key)
  if (variant === 'wrong') return 'text-[rgba(209,46,41,0.85)]'
  return 'text-[#29211a]'
}
</script>

<template>
  <div class="flex gap-4">
    <button
      v-for="choice in normalizedChoices"
      :key="choice.key"
      type="button"
      class="memo-selectable relative flex min-h-[96px] flex-1 flex-col items-center justify-center overflow-visible rounded-md border-[0.5px] px-4 py-5 transition-[box-shadow,background-color] duration-200 disabled:cursor-default"
      :class="choiceClass(choice.key)"
      :disabled="disabled"
      @click="$emit('select', choice.key)"
    >
      <span
        class="relative z-[1] font-serif text-[42px] leading-none font-black"
        :class="labelClass(choice.key)"
      >
        {{ choice.label || choice.key }}
        <QuizGradeMark
          v-if="optionVariant(choice.key) === 'correct'"
          type="circle"
          size="lg"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[8deg]"
        />
        <QuizGradeMark
          v-else-if="optionVariant(choice.key) === 'wrong'"
          type="slash"
          size="lg"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[6deg]"
        />
      </span>
    </button>
  </div>
</template>
