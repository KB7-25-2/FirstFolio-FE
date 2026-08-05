<script setup>
// rule: { productId, productName, compressedCycle, realCycle, assetType, ... }
defineProps({
  rule: {
    type: Object,
    required: true,
  },
  isHeld: {
    type: Boolean,
    default: false,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select'])
</script>

<template>
  <li
    class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-2 py-3 transition-colors"
    :class="
      isSelected
        ? 'border-[var(--pf-highlight)] bg-white/10'
        : 'border-transparent hover:bg-white/5'
    "
    role="button"
    tabindex="0"
    @click="$emit('select', rule)"
    @keydown.enter="$emit('select', rule)"
  >
    <div class="min-w-0">
      <div class="flex items-center gap-1.5">
        <p class="truncate font-bold text-[var(--pf-text)]">{{ rule.productName }}</p>
        <span
          v-if="isHeld"
          class="shrink-0 rounded-full bg-[var(--pf-highlight)]/20 px-1.5 py-0.5 text-[9px] font-bold text-[var(--pf-highlight)]"
        >
          보유중
        </span>
      </div>
      <p class="text-xs text-[var(--pf-text-muted)]">{{ rule.compressedCycle }}</p>
    </div>
    <p class="shrink-0 text-xs text-[var(--pf-text-muted)]">{{ rule.realCycle }}</p>
  </li>
</template>
