<script setup>
import { computed } from 'vue'

const props = defineProps({
  gifticon: {
    type: Object,
    required: true,
  },
  pointBalance: {
    type: Number,
    required: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['redeem'])

const remainingAfter = computed(() => props.pointBalance - props.gifticon.pricePoints)
const isInsufficient = computed(() => remainingAfter.value < 0)
</script>

<template>
  <div
    class="flex items-center justify-between gap-3 rounded-2xl border-[0.5px] border-white/10 bg-[#14161f] p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.3)]"
  >
    <div class="min-w-0">
      <p class="truncate text-xs text-[#9aa1b0]">선택한 상품</p>
      <p class="truncate text-sm font-bold text-white">{{ gifticon.displayName }}</p>
      <p class="text-xs" :class="isInsufficient ? 'text-[#ff8f8a]' : 'text-[#9aa1b0]'">
        {{ gifticon.pricePoints.toLocaleString('ko-KR') }}원 · 교환 후
        {{ Math.max(remainingAfter, 0).toLocaleString('ko-KR') }}P
      </p>
    </div>

    <button
      type="button"
      class="flex shrink-0 flex-col items-center gap-0.5 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#4FD8EF] px-5 py-2 text-white disabled:opacity-40"
      :disabled="isInsufficient || isSubmitting"
      @click="$emit('redeem')"
    >
      <span class="text-[10px] leading-none"
        >{{ gifticon.pricePoints.toLocaleString('ko-KR') }} P</span
      >
      <span class="flex items-center gap-1 text-sm leading-none font-bold">
        {{ isSubmitting ? '교환 중…' : '교환하기' }}
        <span v-if="!isSubmitting">→</span>
      </span>
    </button>
  </div>
</template>
