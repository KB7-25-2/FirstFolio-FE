<script setup>
import { computed } from 'vue'
import ChapterProgress from '@/components/learning/ChapterProgress.vue'
import CurriculumRecommendNote from '@/components/onboarding/CurriculumRecommendNote.vue'
import { useCurriculumRecommend } from '@/composables/useCurriculumRecommend.js'

const {
  selectedCourseCount,
  orderedItems,
  availableItems,
  isLoading,
  isSaving,
  isConfirming,
  isEditMode,
  error,
  actionError,
  onToggle,
  onReorder,
  onConfirm,
  goBack,
} = useCurriculumRecommend()

const selectedOptionalCount = computed(
  () => orderedItems.value.filter((i) => i.sourceType !== 'REQUIRED').length,
)

const progressTitle = computed(() => `필수 1 + 선택 ${selectedOptionalCount.value}`)

const progressTotal = computed(() =>
  Math.max(1, orderedItems.value.length + availableItems.value.length),
)
</script>

<template>
  <div class="cork-board mx-auto flex mobile-frame flex-col overflow-hidden">
    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-10 pb-3">
      <p class="font-serif text-[10px] tracking-[0.4px] text-[var(--cork-stamp)]">
        {{ isEditMode ? 'EDIT · CURRICULUM ORDER' : 'STEP 4 · CURRICULUM ORDER' }}
      </p>
      <h1 class="mt-1.5 font-serif text-[22px] leading-snug font-black text-[var(--cork-ink)]">
        {{ isEditMode ? '학습 순서를 수정해보세요' : '학습 순서를 정해보세요' }}
      </h1>

      <div class="mt-4 w-full max-w-[359px] self-center">
        <ChapterProgress
          chapter-label="INCLUDED"
          :title="progressTitle"
          :current="selectedCourseCount"
          :total="progressTotal"
        />
      </div>

      <div class="mt-5 w-full max-w-[359px] self-center">
        <CurriculumRecommendNote
          :ordered-items="orderedItems"
          :available-items="availableItems"
          :course-count="selectedCourseCount"
          :loading="isLoading"
          @toggle="onToggle"
          @reorder="onReorder"
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
      <button type="button" class="cork-btn cork-btn--danger flex-1" @click="goBack">
        {{ isEditMode ? '학습으로' : '이전' }}
      </button>
      <button
        type="button"
        class="cork-btn cork-btn--primary flex-1"
        :disabled="isConfirming || isSaving || !orderedItems.length"
        @click="onConfirm"
      >
        {{ isConfirming || isSaving ? '적용 중…' : isEditMode ? '수정 확정 →' : '구성 확정 →' }}
      </button>
    </div>
  </div>
</template>
