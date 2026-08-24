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
    class="flex items-center justify-between gap-3 rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.35)] bg-[#fff8ec] p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.18)]"
  >
    <div class="min-w-0">
      <p class="truncate font-serif text-xs text-[rgba(41,33,26,0.45)]">선택한 상품</p>
      <p class="truncate font-serif text-sm font-bold text-[#2c1810]">
        {{ gifticon.displayName }}
      </p>
      <p
        class="font-serif text-xs"
        :class="isInsufficient ? 'text-[#c0433f]' : 'text-[rgba(41,33,26,0.55)]'"
      >
        {{ gifticon.pricePoints.toLocaleString('ko-KR') }}P · 교환 후
        {{ Math.max(remainingAfter, 0).toLocaleString('ko-KR') }}P
      </p>
    </div>

    <button
      type="button"
      class="flex shrink-0 flex-col items-center gap-0.5 rounded-[3px] bg-[#c17f24] px-5 py-2 font-serif text-[#fff8ec] disabled:opacity-40"
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
