<script setup>
import { computed } from 'vue'

const STATUS_DOT_CLASS = {
  REQUESTED: 'bg-white/40',
  SENT: 'bg-[#f5c76b]',
  COMPLETED: 'bg-[#6bd67f]',
}

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
})

const dotClass = computed(() => STATUS_DOT_CLASS[props.order.status] ?? 'bg-white/40')

const requestedAtLabel = computed(() => {
  if (!props.order.requestedAt) return ''
  return new Date(props.order.requestedAt).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })
})
</script>

<template>
  <li class="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-3">
    <div class="min-w-0">
      <p class="truncate text-sm font-bold text-white">{{ order.displayName }}</p>
      <p class="mt-0.5 text-xs text-[#9aa1b0]">{{ requestedAtLabel }} 신청</p>
    </div>

    <div class="flex shrink-0 items-center gap-1.5">
      <span class="size-1.5 rounded-full" :class="dotClass" />
      <span class="text-xs font-bold text-white">{{ order.statusLabel }}</span>
    </div>
  </li>
</template>
