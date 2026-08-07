<script setup>
import { computed } from 'vue'
import dottedLine from '@/assets/auth/dotted-line.svg'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  autocomplete: {
    type: String,
    default: 'off',
  },
  maskPassword: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])

const displayValue = computed(() => {
  if (!props.maskPassword || props.type !== 'password') {
    return props.modelValue
  }

  return props.modelValue
    ? Array.from(props.modelValue)
        .map(() => '※')
        .join(' ')
    : ''
})
</script>

<template>
  <label
    :for="id"
    class="flex w-full flex-col gap-0.5"
    :class="disabled ? 'pointer-events-none opacity-50' : ''"
  >
    <span class="font-serif text-[9px] text-[var(--auth-doc-label)]">{{ label }}</span>
    <div class="relative min-h-[28px] w-full">
      <input
        :id="id"
        :type="maskPassword ? 'text' : type"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        required
        class="absolute inset-0 z-10 w-full bg-transparent font-pen text-[20px] leading-none text-transparent caret-[var(--auth-hand)] outline-none disabled:cursor-not-allowed"
        :class="maskPassword ? 'tracking-[0.2em]' : ''"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <span
        class="pointer-events-none font-pen text-[20px] leading-none text-[var(--auth-hand)]"
        :class="displayValue ? '' : 'opacity-35'"
      >
        {{ displayValue || placeholder }}
      </span>
      <img :src="dottedLine" alt="" class="mt-0.5 block h-px w-full max-w-none" />
    </div>
  </label>
</template>
