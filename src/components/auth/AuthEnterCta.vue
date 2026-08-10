<script setup>
defineProps({
  label: {
    type: String,
    default: '입장하기  →',
  },
  type: {
    type: String,
    default: 'button',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="flex w-full items-center justify-center rounded-[10px] border-[0.5px] border-white/15 bg-[var(--auth-cta)] py-[13px] shadow-[0_3px_8px_rgba(0,0,0,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
    :class="{ 'btn-hover': !disabled }"
  >
    <span class="font-serif text-[14px] font-bold whitespace-pre text-[var(--auth-cta-text)]">
      {{ label }}
    </span>
  </button>
</template>
