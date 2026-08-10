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
    <p class="text-sm leading-relaxed text-[var(--pf-text)]">
      포트폴리오를 초기화하고 모의투자금을
      <span class="font-bold text-[var(--pf-highlight)]">30,000,000원</span>으로 다시 시작해요.
    </p>

    <ul class="mt-4 flex flex-col gap-2 rounded-xl bg-white/5 p-3 text-xs">
      <li class="flex items-start gap-2 text-[var(--pf-negative)]">
        <span>✕</span>
        <span>보유 중인 모든 자산이 종료돼요 (되돌릴 수 없어요)</span>
      </li>
      <li class="flex items-start gap-2 text-[var(--pf-positive)]">
        <span>✓</span>
        <span>포인트, 학습 진도, 퀴즈 기록은 그대로 유지돼요</span>
      </li>
    </ul>

    <p v-if="errorMessage" class="mt-3 text-xs text-[var(--pf-negative)]">
      {{ errorMessage }}
    </p>

    <div class="mt-5 flex gap-2">
      <button
        type="button"
        class="flex-1 rounded-full border border-[var(--pf-card-border)] py-2 text-sm text-[var(--pf-text)] disabled:opacity-40"
        :disabled="isSubmitting"
        @click="$emit('close')"
      >
        취소
      </button>
      <button
        type="button"
        class="flex-1 rounded-full border border-[var(--pf-danger-border)] bg-[var(--pf-danger-bg)] py-2 text-sm font-bold text-[var(--pf-danger-text)] disabled:opacity-40"
        :disabled="isSubmitting"
        @click="$emit('confirm')"
      >
        {{ isSubmitting ? '초기화 처리 중…' : '초기화하기' }}
      </button>
    </div>
  </PortfolioModal>
</template>
