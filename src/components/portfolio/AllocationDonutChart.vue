<script setup>
import { computed } from 'vue'

// segments: [{ label: '예금', ratio: 50, color: '#5B7FFF' }, ...]
// ratio 합은 100 기준
const props = defineProps({
  segments: {
    type: Array,
    required: true,
  },
})

const conicGradient = computed(() => {
  if (!props.segments.length) return '#B4ACD1'

  let acc = 0
  const stops = props.segments.map((segment) => {
    const start = acc
    acc += segment.ratio
    return `${segment.color} ${start}% ${acc}%`
  })
  return `conic-gradient(${stops.join(', ')})`
})
</script>

<template>
  <div class="relative flex size-24 shrink-0 items-center justify-center">
    <div class="size-24 rounded-full" :style="{ background: conicGradient }" />
    <div
      class="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-[#fff8ec] text-center"
    >
      <slot />
    </div>
  </div>
</template>
