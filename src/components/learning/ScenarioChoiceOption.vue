<script setup>
import { computed } from 'vue'

const props = defineProps({
  optionKey: { type: String, required: true },
  label: { type: String, required: true },
  description: { type: String, default: '' },
  /** default | selected | correct | wrong */
  variant: { type: String, default: 'default' },
  disabled: { type: Boolean, default: false },
})

defineEmits(['select'])

const interactive = computed(() => !props.disabled && props.variant === 'default')

const shellClass = computed(() => {
  if (props.variant === 'selected') {
    return 'border-[#c17f24] bg-[rgba(255,248,236,0.95)] ring-1 ring-[#c17f24] shadow-[0_2px_8px_rgba(193,127,36,0.2)]'
  }
  if (props.variant === 'correct') {
    return 'border-[#c17f24] bg-[rgba(193,127,36,0.15)] shadow-[0_2px_8px_rgba(139,80,20,0.2)]'
  }
  if (props.variant === 'wrong') {
    return 'border-[rgba(209,46,41,0.4)] bg-[#faebe5]'
  }
  return 'border-[rgba(139,100,60,0.28)] bg-[rgba(255,255,255,0.5)]'
})

const radioClass = computed(() => {
  if (props.variant === 'selected' || props.variant === 'correct') {
    return 'border-[#c17f24] bg-[#c17f24]'
  }
  if (props.variant === 'wrong') {
    return 'border-[#d12e29] bg-[#d12e29]'
  }
  return 'border-[rgba(139,100,60,0.35)] bg-[rgba(245,237,216,0.9)]'
})
</script>

<template>
  <button
    type="button"
    class="scenario-choice flex w-full items-start gap-3 rounded-[10px] border-[0.8px] px-3 py-2.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out disabled:cursor-default"
    :class="[shellClass, interactive ? 'scenario-choice--interactive' : '']"
    :disabled="disabled"
    @click="$emit('select', optionKey)"
  >
    <span
      class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-[1.6px] transition-colors duration-200"
      :class="radioClass"
    >
      <span
        v-if="variant === 'selected' || variant === 'correct' || variant === 'wrong'"
        class="size-1.5 rounded-full bg-white"
      />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block font-serif text-[14px] leading-[19px] font-semibold text-[#3d1f08]">
        {{ label }}
      </span>
      <span
        v-if="description"
        class="mt-0.5 block text-[11px] leading-[15px] font-medium text-[#9a7050]"
      >
        {{ description }}
      </span>
    </span>
  </button>
</template>

<style scoped>
@media (hover: hover) and (pointer: fine) {
  .scenario-choice--interactive:hover {
    transform: translateY(-2px);
    border-color: rgba(193, 127, 36, 0.65);
    background-color: rgba(255, 248, 236, 0.92);
    box-shadow: 0 4px 12px rgba(139, 80, 20, 0.14);
  }

  .scenario-choice--interactive:active {
    transform: translateY(0);
  }
}
</style>
