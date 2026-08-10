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
  <div class="rounded-2xl border border-white/10 bg-white/8">
    <ul class="divide-y divide-white/5">
      <HoldingItem
        v-for="holding in holdings"
        :key="holding.holdingId"
        :holding="holding"
        @request-sell="$emit('request-sell', $event)"
      />
    </ul>
  </div>
</template>
