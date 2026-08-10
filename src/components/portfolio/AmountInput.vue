<script setup>
const props = defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    default: '원',
  },
  maxButtonLabel: {
    type: String,
    default: '전액',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const handleInput = (event) => {
  const digitsOnly = event.target.value.replace(/[^0-9]/g, '')
  const next = digitsOnly ? Number(digitsOnly) : 0
  emit('update:modelValue', Math.min(next, props.max))
}

const setMax = () => {
  if (props.disabled) return
  emit('update:modelValue', props.max)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <div
      class="flex flex-1 items-center gap-1 rounded-lg border-[0.5px] border-[var(--pf-card-border)] bg-white/5 px-3 py-2"
    >
      <input
        type="text"
        inputmode="numeric"
        class="w-full min-w-0 bg-transparent text-right text-[var(--pf-text)] outline-none disabled:opacity-40"
        :value="modelValue.toLocaleString('ko-KR')"
        :disabled="disabled"
        @input="handleInput"
      />
      <span class="shrink-0 text-xs text-[var(--pf-text-muted)]">{{ unit }}</span>
    </div>
    <button
      type="button"
      class="shrink-0 rounded-lg border-[0.5px] border-[var(--pf-card-border)] px-2 py-2 text-xs text-[var(--pf-text)] disabled:opacity-40"
      :disabled="disabled"
      @click="setMax"
    >
      {{ maxButtonLabel }}
    </button>
  </div>
</template>
