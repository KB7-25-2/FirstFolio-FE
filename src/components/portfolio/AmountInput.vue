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
    <div class="flex flex-1 items-center gap-1 rounded-lg bg-[rgba(245,237,217,0.06)] px-3 py-2">
      <input
        type="text"
        inputmode="numeric"
        class="w-full min-w-0 bg-transparent text-right font-serif text-[#f5edd9] outline-none disabled:opacity-40"
        :value="modelValue.toLocaleString('ko-KR')"
        :disabled="disabled"
        @input="handleInput"
      />
      <span class="shrink-0 font-serif text-xs text-[rgba(245,237,217,0.5)]">{{ unit }}</span>
    </div>
    <button
      type="button"
      class="shrink-0 rounded-lg bg-[#c17f24] px-2.5 py-2 font-serif text-xs font-bold text-[#1a1208] disabled:opacity-40"
      :disabled="disabled"
      @click="setMax"
    >
      {{ maxButtonLabel }}
    </button>
  </div>
</template>
