<script setup>
import officialSeal from '@/assets/learning/scenario/official-seal.svg'

defineProps({
  subjectName: {
    type: String,
    default: '',
  },
  congratsMessage: {
    type: String,
    default: '수고하셨습니다! 실전 상담 시나리오를 모두 마쳤습니다.',
  },
  confirmLabel: {
    type: String,
    default: '학습 목록으로',
  },
  completed: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['confirm'])
</script>

<template>
  <div class="flex flex-col items-center px-2 pt-3 pb-2 text-center">
    <div
      class="relative mb-1 flex w-full items-center justify-center border-b border-[rgba(139,100,60,0.2)] pb-2.5"
    >
      <span
        class="absolute top-1 left-1 size-2 rounded bg-[rgba(0,0,0,0.12)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
      />
      <span
        class="absolute top-1 right-1 size-2 rounded bg-[rgba(0,0,0,0.12)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
      />
      <p class="font-serif text-[14px] font-bold tracking-[0.7px] text-[#3d1f08]">
        {{ completed ? '수 료 증' : '재도전 안내' }}
      </p>
    </div>

    <img :src="officialSeal" alt="" class="mt-5 size-16 object-contain" width="64" height="64" />
    <p class="mt-2 font-serif text-[10px] tracking-[1.8px] text-[rgba(139,100,60,0.5)]">
      금융 상담 교육원
    </p>

    <div class="mt-4 flex w-full items-center gap-3">
      <div class="h-px flex-1 bg-[rgba(139,100,60,0.28)]" />
      <div class="size-1 rounded-sm bg-[rgba(139,100,60,0.4)]" />
      <div class="h-px flex-1 bg-[rgba(139,100,60,0.28)]" />
    </div>

    <p class="mt-5 font-serif font-bold text-[28px] leading-tight text-[#212b5c]">
      {{ completed ? '축하합니다' : '다시 도전해요' }}
    </p>
    <p class="mt-3 max-w-[280px] font-serif text-[13px] leading-[20px] text-[#7a5230]">
      {{ congratsMessage }}
    </p>

    <p
      class="mt-6 font-serif text-[16px] leading-[24px] font-black tracking-[0.3px] text-[#3d1f08]"
    >
      <template v-if="completed">
        <span class="text-[#c17f24]">{{ subjectName }}</span>
        과목을 수료하셨습니다!
      </template>
      <template v-else>다음 대단원은 만점 수료 후 열립니다.</template>
    </p>

    <div class="mt-5 flex w-full items-center gap-3">
      <div class="h-px flex-1 bg-[rgba(139,100,60,0.28)]" />
      <div class="size-1 rounded-sm bg-[rgba(139,100,60,0.4)]" />
      <div class="h-px flex-1 bg-[rgba(139,100,60,0.28)]" />
    </div>

    <div class="flex items-center justify-center gap-2">
      <p class="mt-4 font-serif text-[11px] font-bold text-[#3d1f08]">퍼스트폴리오 학습원장</p>
      <span
        class="mt-2 -rotate-8 rounded border-[0.5px] border-[rgba(139,69,19,0.5)] px-2 py-1 font-serif text-[9px] font-black tracking-[1px] text-[rgba(139,69,19,0.55)]"
      >
        {{ completed ? '수료' : '재도전' }}
      </span>
    </div>
    <button
      type="button"
      class="mt-8 flex h-11 w-full items-center justify-center rounded-[10px] bg-[#c17f24] font-serif text-[14px] font-bold text-[#fff8ec] shadow-[0_3px_6px_rgba(139,80,20,0.35)]"
      @click="$emit('confirm')"
    >
      {{ confirmLabel }}
    </button>
  </div>
</template>
