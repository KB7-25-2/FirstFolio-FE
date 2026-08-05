<script setup>
import { computed } from 'vue'

// points: [{ label: 'D0', value: 20 }, ...] value는 0~100 스케일
const props = defineProps({
  points: {
    type: Array,
    required: true,
  },
})

const VIEW_WIDTH = 280
const VIEW_HEIGHT = 100
const PADDING_Y = 12

const coordinates = computed(() => {
  const values = props.points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = VIEW_WIDTH / (props.points.length - 1 || 1)

  return props.points.map((point, index) => {
    const x = index * step
    const normalized = (point.value - min) / range
    const y = VIEW_HEIGHT - PADDING_Y - normalized * (VIEW_HEIGHT - PADDING_Y * 2)
    return { x, y, label: point.label }
  })
})

const polylinePoints = computed(() =>
  coordinates.value.map((coord) => `${coord.x},${coord.y}`).join(' '),
)
</script>

<template>
  <div>
    <svg
      :viewBox="`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`"
      class="h-24 w-full"
      preserveAspectRatio="none"
    >
      <polyline
        :points="polylinePoints"
        fill="none"
        stroke="var(--pf-highlight)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle
        v-for="coord in coordinates"
        :key="coord.label"
        :cx="coord.x"
        :cy="coord.y"
        r="2.5"
        fill="var(--pf-highlight)"
      />
    </svg>

    <div class="mt-1 flex justify-between text-[10px] text-[var(--pf-text-muted)]">
      <span v-for="point in points" :key="point.label">{{ point.label }}</span>
    </div>
  </div>
</template>
