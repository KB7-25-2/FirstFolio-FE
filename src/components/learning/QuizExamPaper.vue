<script setup>
defineProps({
  examTitle: {
    type: String,
    default: '금융 기초 퀴즈 시험',
  },
  subject: {
    type: String,
    default: '',
  },
  /** 1-based */
  questionIndex: {
    type: Number,
    default: 1,
  },
  questionTotal: {
    type: Number,
    default: 1,
  },
  scorePerQuestion: {
    type: Number,
    default: 10,
  },
})
</script>

<template>
  <div class="relative px-5 pt-4 pb-6">
    <p class="text-center font-serif text-[18px] font-black text-[#29211a]">
      {{ examTitle }}
    </p>
    <p class="mt-2 font-serif text-[10px] text-[rgba(139,100,60,0.7)]">
      과목: {{ subject }}&nbsp;&nbsp;&nbsp;&nbsp;문항: {{ questionIndex }}/{{
        questionTotal
      }}&nbsp;&nbsp;&nbsp;&nbsp;배점: {{ scorePerQuestion }}점
    </p>
    <div class="mt-3 h-[1.5px] w-full bg-[rgba(41,33,26,0.35)]" />
    <div class="mt-4">
      <slot />
    </div>
  </div>
</template>
