<script setup>
import CurriculumCompletionNote from '@/components/onboarding/CurriculumCompletionNote.vue'
import TimetableSheet from '@/components/learning/TimetableSheet.vue'
import BaseLoading from '@/components/BaseLoading.vue'
import { useCurriculumConfirm } from '@/composables/useCurriculumConfirm.js'

const {
  orderedItems,
  periods,
  isLoading,
  isConfirming,
  error,
  actionError,
  goEdit,
  onStartLearning,
} = useCurriculumConfirm()
</script>

<template>
  <div class="cork-board mx-auto flex mobile-frame flex-col overflow-hidden">
    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-10 pb-3">
      <p class="font-serif text-[10px] tracking-[0.4px] text-[var(--cork-stamp)]">
        READY · CURRICULUM
      </p>
      <h1 class="mt-1.5 font-serif text-[22px] leading-snug font-black text-[var(--cork-ink)]">
        나의 학습 시간표가 완성됐어요
      </h1>

      <div class="mt-5 w-full max-w-[350px] self-center">
        <CurriculumCompletionNote />
      </div>

      <div class="mt-5 w-full max-w-[350px] self-center">
        <BaseLoading v-if="isLoading" />
        <TimetableSheet
          v-else
          category-label="금융 기초 카테고리"
          title="나의 학습 시간표"
          description="필수 기초 + 내가 정한 순서"
          unit-index="READY"
          :periods="periods"
          scroll-hint="포트폴리오 기초부터 시작해보세요"
        />
      </div>

      <p
        v-if="error || actionError"
        class="mt-3 text-center font-serif text-xs text-[var(--study-total)]"
      >
        {{ actionError || error }}
      </p>
    </div>

    <div class="flex shrink-0 gap-3 px-4 pt-2 pb-6">
      <button type="button" class="cork-btn cork-btn--danger flex-1" @click="goEdit">
        다시 구성
      </button>
      <button
        type="button"
        class="cork-btn cork-btn--primary flex-1"
        :disabled="isConfirming || !orderedItems.length"
        @click="onStartLearning"
      >
        {{ isConfirming ? '확정 중…' : '학습 시작 →' }}
      </button>
    </div>
  </div>
</template>
