<script setup>
defineProps({
  selected: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
})

defineEmits(['select'])
</script>

<template>
  <button
    type="button"
    class="flex w-full items-start gap-2.5 rounded-[8px] border px-3 py-3 text-left"
    :class="
      selected
        ? 'border-[rgba(139,100,60,0.55)] bg-white/70'
        : 'border-[var(--auth-method-border)] bg-[var(--auth-method-card)]'
    "
    @click="$emit('select')"
  >
    <span
      class="mt-0.5 flex size-[14px] shrink-0 items-center justify-center rounded-[2px] border border-[rgba(139,100,60,0.6)]"
    >
      <span v-if="selected" class="font-pen text-[12px] leading-none text-[var(--auth-hand)]"
        >✓</span
      >
    </span>
    <span class="flex min-w-0 flex-1 flex-col gap-0.5">
      <span class="font-serif text-[12px] font-bold text-[var(--auth-doc-ink)]">{{ title }}</span>
      <span v-if="description" class="font-serif text-[9px] text-[var(--auth-doc-label)]">
        {{ description }}
      </span>
    </span>
  </button>
</template>
