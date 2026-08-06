<script setup>
defineProps({
  /** @type {import('vue').PropType<import('@/types/study.js').ScheduleStatus>} */
  status: {
    type: String,
    required: true,
  },
  /** 배지 문구 덮어쓰기 (예: 필수, 시작, 선택) */
  label: {
    type: String,
    default: '',
  },
})

const LABEL = {
  COMPLETED: '완료',
  IN_PROGRESS: '진행 중',
  NEXT: '다음',
  LOCKED: '잠김',
}

const CLASS = {
  COMPLETED: 'bg-[rgba(89,140,82,0.15)] text-[#598c52]',
  IN_PROGRESS: 'bg-[rgba(193,127,36,0.2)] text-[#c17f24]',
  NEXT: 'bg-[rgba(33,43,92,0.1)] text-[rgba(33,43,92,0.7)]',
  LOCKED: 'bg-[rgba(139,100,60,0.08)] text-[rgba(139,100,60,0.4)]',
}
</script>

<template>
  <span
    class="shrink-0 rounded-[3px] px-1.5 py-[3px] font-serif text-[9px] font-black"
    :class="CLASS[status] ?? CLASS.LOCKED"
  >
    {{ label || LABEL[status] || status }}
  </span>
</template>
