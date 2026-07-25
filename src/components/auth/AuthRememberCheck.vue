<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  label: {
    type: String,
    default: '자동 입장 유지',
  },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <button
    type="button"
    class="relative flex items-center gap-[5px]"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span class="relative size-[11px] rounded-[2px] border border-[rgba(139,100,60,0.6)]">
      <span
        v-if="modelValue"
        class="absolute top-[-7px] left-px font-pen text-[14px] leading-none text-[var(--auth-hand)]"
      >
        ✓
      </span>
    </span>
    <span class="font-serif text-[9px] text-[var(--auth-doc-guide)]">{{ label }}</span>
  </button>
</template>
