<script setup>
import LearningLayout from '@/components/learning/LearningLayout.vue'
import ChapterProgress from '@/components/learning/ChapterProgress.vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'
import TextbookPage from '@/components/learning/TextbookPage.vue'
import LearnMoreModal from '@/components/learning/LearnMoreModal.vue'
import BaseLoading from '@/components/BaseLoading.vue'
import { useLessonPlayer } from '@/composables/useLessonPlayer.js'

const {
  currentPage,
  pageTotal,
  isLastPage,
  isFirstPage,
  isLoading,
  error,
  learnMoreOpen,
  learnMorePayload,
  pageCurrent,
  chapterLabel,
  chapterTitle,
  openLearnMore,
  closeLearnMore,
  onTouchStart,
  onTouchEnd,
  onPrimaryAction,
  goPrevCut,
  stopLearning,
} = useLessonPlayer()
</script>

<template>
  <LearningLayout immersive>
    <template #header>
      <ChapterProgress
        :chapter-label="chapterLabel"
        :title="chapterTitle"
        :current="pageTotal ? pageCurrent : 1"
        :total="pageTotal || 1"
      />
      <div class="mt-3">
        <p class="text-[11px] text-[var(--cork-ink-muted)]">학습 화면</p>
        <p class="text-[16px] font-bold text-[var(--cork-ink)]">
          {{ currentPage?.title || '학습 진행' }}
        </p>
      </div>
    </template>

    <BaseLoading v-if="isLoading" />
    <p v-else-if="error" class="font-serif text-sm text-red-300">{{ error }}</p>

    <div
      v-else-if="currentPage"
      class="min-h-0 flex-1"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <LearningNotePaper :show-pin="false" ruled surface-class="bg-[#f5edd9]">
        <TextbookPage
          :title="currentPage.title"
          :blocks="currentPage.blocks"
          @open-learn-more="openLearnMore"
        />
      </LearningNotePaper>
    </div>

    <LearnMoreModal
      :open="learnMoreOpen"
      :title="learnMorePayload?.title || ''"
      :example="learnMorePayload?.example || ''"
      :body="learnMorePayload?.body || ''"
      :footer="learnMorePayload?.footer || ''"
      @close="closeLearnMore"
    />

    <template #footer>
      <div class="mt-4 flex gap-3">
        <button type="button" class="cork-btn cork-btn--danger flex-1" @click="stopLearning">
          학습 중단
        </button>
        <button
          type="button"
          class="cork-btn cork-btn--ghost flex-1"
          :disabled="!!error || isLoading || !currentPage || isFirstPage"
          @click="goPrevCut"
        >
          ← 이전 컷
        </button>
        <button
          type="button"
          class="cork-btn cork-btn--primary flex-1"
          :disabled="!!error || isLoading || !currentPage"
          @click="onPrimaryAction"
        >
          {{ isLastPage ? '퀴즈 풀기 →' : '다음 컷 →' }}
        </button>
      </div>
    </template>
  </LearningLayout>
</template>
