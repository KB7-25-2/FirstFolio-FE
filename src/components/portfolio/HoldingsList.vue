<script setup>
import HoldingItem from '@/components/portfolio/HoldingItem.vue'

defineProps({
  holdings: {
    type: Array,
    required: true,
  },
})

defineEmits(['request-sell'])
</script>

<template>
  <section
    class="rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] p-4 shadow-[0_4px_12px_rgba(44,24,16,0.1)]"
  >
    <p class="font-serif text-[10px] font-bold tracking-wide text-[rgba(41,33,26,0.4)]">
      보유 목록
    </p>

    <ul class="mt-3 flex flex-col gap-2.5">
      <HoldingItem
        v-for="holding in holdings"
        :key="holding.holdingId"
        :holding="holding"
        @request-sell="$emit('request-sell', $event)"
      />
    </ul>
  </section>
</template>
