<script setup>
import CurriculumRecommendNote from '@/components/onboarding/CurriculumRecommendNote.vue'
import { useCurriculumRecommend } from '@/composables/useCurriculumRecommend.js'

const {
  requiredItem,
  recommendationPool,
  cartCandidates,
  selectedCourseCount,
  orderedItems,
  isLoading,
  isConfirming,
  error,
  actionError,
  isSelected,
  onToggle,
  onMoveUp,
  onMoveDown,
  onConfirm,
  goResult,
} = useCurriculumRecommend()
</script>

<template>
  <div class="mx-auto flex mobile-frame flex-col overflow-hidden bg-[#0d1117]">
    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-10 pb-3">
      <div class="relative w-full max-w-[359px] self-center">
        <div
          class="pointer-events-none absolute top-[-6px] left-1/2 z-20 h-3.5 w-[58px] -translate-x-1/2 -rotate-[2deg] border-[0.5px] border-white/25 bg-[var(--study-tape)]"
          aria-hidden="true"
        />
        <div
          class="-rotate-[0.6deg] rounded-[3px] border border-[rgba(212,184,150,0.55)] bg-[#fff4c8] px-4 pt-4 pb-3.5 shadow-[0_3px_10px_rgba(0,0,0,0.28)]"
        >
          <p class="font-serif text-[10px] tracking-wide text-[rgba(139,100,60,0.55)]">
            STEP 3 · 개인 커리큘럼
          </p>
          <h1 class="mt-1.5 font-pen text-[26px] leading-tight text-[#212b5c]">
            오답은 넣고, 정답은 장바구니에서
          </h1>
          <p class="mt-1.5 font-serif text-[12px] leading-relaxed text-[rgba(61,31,8,0.7)]">
            추가·제거·순서 변경을 한 화면에서 정한 뒤 확정해요
          </p>
        </div>
      </div>

      <div class="mt-5 w-full max-w-[359px] self-center">
        <CurriculumRecommendNote
          :required-item="requiredItem"
          :recommendations="recommendationPool"
          :cart-candidates="cartCandidates"
          :ordered-items="orderedItems"
          :course-count="selectedCourseCount"
          :is-selected="isSelected"
          :loading="isLoading"
          @toggle="onToggle"
          @move-up="onMoveUp"
          @move-down="onMoveDown"
        />
      </div>
      <p v-if="error || actionError" class="mt-3 text-center font-serif text-xs text-red-300">
        {{ actionError || error }}
      </p>
    </div>

    <div class="flex shrink-0 gap-3 px-4 pt-2 pb-6">
      <button
        type="button"
        class="btn-hover flex h-12 flex-1 items-center justify-center rounded-[10px] bg-[#c12e24] font-serif text-[14px] font-bold text-[#f5edd9]"
        @click="goResult"
      >
        이전
      </button>
      <button
        type="button"
        class="flex h-12 flex-1 items-center justify-center rounded-[10px] bg-[#c17f24] font-serif text-[14px] font-bold text-[#fff8ec] disabled:opacity-60"
        :class="{ 'btn-hover': !isConfirming }"
        :disabled="isConfirming || !orderedItems.length"
        @click="onConfirm"
      >
        {{ isConfirming ? '확정 중…' : '구성 확정 →' }}
      </button>
    </div>
  </div>
</template>
