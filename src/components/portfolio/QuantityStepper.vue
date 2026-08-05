<script setup>
const props = defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
  min: {
    type: Number,
    default: 1,
  },
  max: {
    type: Number,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  unit: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const decrease = () => {
  if (props.disabled) return
  if (props.modelValue > props.min) emit('update:modelValue', props.modelValue - 1)
}

const increase = () => {
  if (props.disabled) return
  if (props.modelValue < props.max) emit('update:modelValue', props.modelValue + 1)
}

const handleInput = (event) => {
  if (props.disabled) return
  const next = Number(event.target.value)
  if (Number.isNaN(next)) return
  emit('update:modelValue', Math.min(Math.max(next, props.min), props.max))
}
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      type="button"
      class="size-8 rounded-full border border-[var(--pf-card-border)] text-[var(--pf-text)] disabled:opacity-30"
      :disabled="disabled || modelValue <= min"
      @click="decrease"
    >
      −
    </button>
    <input
      type="number"
      class="w-16 rounded-lg bg-white/5 px-2 py-1 text-center text-[var(--pf-text)] disabled:opacity-40"
      :value="modelValue"
      :min="min"
      :max="max"
      :disabled="disabled"
      @input="handleInput"
    />
    <button
      type="button"
      class="size-8 rounded-full border border-[var(--pf-card-border)] text-[var(--pf-text)] disabled:opacity-30"
      :disabled="disabled || modelValue >= max"
      @click="increase"
    >
      +
    </button>
    <span v-if="unit" class="text-xs text-[var(--pf-text-muted)]">{{ unit }}</span>
  </div>
</template>
