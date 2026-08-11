<script setup>
import PortfolioModal from '@/components/portfolio/PortfolioModal.vue'

defineProps({
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: null,
  },
})

defineEmits(['close', 'confirm'])
</script>

<template>
  <PortfolioModal title="파산 신청" @close="!isSubmitting && $emit('close')">
    <p class="font-serif text-sm leading-relaxed text-[#f5edd9]">
      포트폴리오를 초기화하고 모의투자금을
      <span class="font-bold text-[#e2b84a]">30,000,000원</span>으로 다시 시작해요.
    </p>

    <ul
      class="mt-4 flex flex-col gap-2 rounded-xl bg-[rgba(245,237,217,0.06)] p-3 font-serif text-xs"
    >
      <li class="flex items-start gap-2 text-[#f0b4b4]">
        <span>✕</span>
        <span>보유 중인 모든 자산이 종료돼요 (되돌릴 수 없어요)</span>
      </li>
      <li class="flex items-start gap-2 text-[#8fd6a8]">
        <span>✓</span>
        <span>포인트, 학습 진도, 퀴즈 기록은 그대로 유지돼요</span>
      </li>
    </ul>

    <p v-if="errorMessage" class="mt-3 font-serif text-xs text-[#f0b4b4]">
      {{ errorMessage }}
    </p>

    <div class="mt-5 flex gap-2">
      <button
        type="button"
        class="flex-1 rounded-xl border-[0.5px] border-[rgba(245,237,217,0.18)] py-2.5 font-serif text-sm text-[rgba(245,237,217,0.85)] disabled:opacity-40"
        :disabled="isSubmitting"
        @click="$emit('close')"
      >
        취소
      </button>
      <button
        type="button"
        class="flex-1 rounded-xl border-[0.5px] border-[rgba(220,80,80,0.45)] bg-[rgba(220,80,80,0.18)] py-2.5 font-serif text-sm font-bold text-[#f0b4b4] disabled:opacity-40"
        :disabled="isSubmitting"
        @click="$emit('confirm')"
      >
        {{ isSubmitting ? '초기화 처리 중…' : '초기화하기' }}
      </button>
    </div>
  </PortfolioModal>
</template>
