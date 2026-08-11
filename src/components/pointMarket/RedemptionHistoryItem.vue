<script setup>
import { computed } from 'vue'

const STATUS_DOT_CLASS = {
  REQUESTED: 'bg-[rgba(41,33,26,0.3)]',
  SENT: 'bg-[#c17f24]',
  COMPLETED: 'bg-[#1D9E75]',
}

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
})

const dotClass = computed(() => STATUS_DOT_CLASS[props.order.status] ?? 'bg-[rgba(41,33,26,0.3)]')

const requestedAtLabel = computed(() => {
  if (!props.order.requestedAt) return ''
  return new Date(props.order.requestedAt).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })
})
</script>

<template>
  <li
    class="flex items-center justify-between gap-3 rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.25)] bg-[#fff8ec] px-3 py-3"
  >
    <div class="min-w-0">
      <p class="truncate font-serif text-sm font-bold text-[#2c1810]">{{ order.displayName }}</p>
      <p class="mt-0.5 font-serif text-xs text-[rgba(41,33,26,0.45)]">
        {{ requestedAtLabel }} 신청
      </p>
    </div>

    <div class="flex shrink-0 items-center gap-1.5">
      <span class="size-1.5 rounded-full" :class="dotClass" />
      <span class="font-serif text-xs font-bold text-[#2c1810]">{{ order.statusLabel }}</span>
    </div>
  </li>
</template>
