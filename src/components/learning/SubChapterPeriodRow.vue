<script setup>
import SubChapterStatusBadge from '@/components/learning/SubChapterStatusBadge.vue'

defineProps({
  order: { type: [Number, String], required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  /** @type {import('vue').PropType<import('@/types/study.js').ScheduleStatus>} */
  scheduleStatus: { type: String, required: true },
  /** 배지 문구 덮어쓰기 */
  statusLabel: { type: String, default: '' },
})

defineEmits(['select'])

const numClass = {
  COMPLETED: 'bg-[rgba(89,140,82,0.85)] text-[#f5edd9]',
  IN_PROGRESS: 'bg-[#c17f24] text-[#f5edd9]',
  NEXT: 'bg-[rgba(139,100,60,0.2)] text-[#f5edd9]',
  LOCKED: 'bg-[rgba(139,100,60,0.2)] text-[#8b643c]',
}

const titleClass = {
  COMPLETED: 'text-[#29211a]',
  IN_PROGRESS: 'text-[#29211a]',
  NEXT: 'text-[#29211a]',
  LOCKED: 'text-[rgba(41,33,26,0.35)]',
}

const subClass = {
  COMPLETED: 'text-[rgba(139,100,60,0.65)]',
  IN_PROGRESS: 'text-[rgba(139,100,60,0.65)]',
  NEXT: 'text-[rgba(139,100,60,0.65)]',
  LOCKED: 'text-[rgba(139,100,60,0.3)]',
}

const rowClass = {
  COMPLETED: 'bg-[rgba(237,229,209,0.9)]',
  IN_PROGRESS: 'border-[0.5px] border-[rgba(193,127,36,0.7)] bg-[#fae8a8]',
  NEXT: 'bg-[rgba(240,232,214,0.55)]',
  LOCKED: 'bg-[rgba(240,232,214,0.55)]',
}
</script>

<template>
  <button
    type="button"
    class="flex h-14 w-full cursor-pointer items-center gap-2.5 overflow-hidden p-2.5 text-left transition-shadow duration-200 ease-out hover:shadow-[0_2px_8px_rgba(139,80,20,0.18)] disabled:cursor-not-allowed disabled:hover:shadow-none"
    :class="rowClass[scheduleStatus] ?? rowClass.LOCKED"
    :disabled="scheduleStatus === 'LOCKED'"
    @click="$emit('select')"
  >
    <span
      class="flex size-9 shrink-0 items-center justify-center rounded font-pen text-[18px]"
      :class="numClass[scheduleStatus] ?? numClass.LOCKED"
    >
      {{ order }}
    </span>
    <span class="min-w-0 flex-1">
      <span
        class="block truncate font-serif text-[13px] font-bold"
        :class="titleClass[scheduleStatus] ?? titleClass.LOCKED"
      >
        {{ title }}
      </span>
      <span
        class="mt-0.5 block truncate font-serif text-[10px]"
        :class="subClass[scheduleStatus] ?? subClass.LOCKED"
      >
        {{ subtitle }}
      </span>
    </span>
    <SubChapterStatusBadge :status="scheduleStatus" :label="statusLabel" />
  </button>
</template>
