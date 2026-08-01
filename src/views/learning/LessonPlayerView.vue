<script setup>
import LearningLayout from '@/components/learning/LearningLayout.vue'
import ChapterProgress from '@/components/learning/ChapterProgress.vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'
import TextbookPage from '@/components/learning/TextbookPage.vue'
import LearnMoreModal from '@/components/learning/LearnMoreModal.vue'
import { useLessonPlayer } from '@/composables/useLessonPlayer.js'

const {
  currentPage,
  pageTotal,
  isLastPage,
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
        <p class="text-[11px] text-[#8c8f9e]">학습 화면</p>
        <p class="text-[16px] font-bold text-[#ebebf2]">
          {{ currentPage?.title || '학습 진행' }}
        </p>
      </div>
    </template>

    <p v-if="isLoading" class="font-serif text-sm text-[rgba(245,237,217,0.55)]">불러오는 중…</p>
    <p v-else-if="error" class="font-serif text-sm text-red-300">{{ error }}</p>

    <div
      v-else-if="currentPage"
      class="min-h-0 flex-1"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <LearningNotePaper :show-tape="false" ruled surface-class="bg-[#f5edd9]">
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
      <div class="mt-4 flex gap-4">
        <button
          type="button"
          class="flex h-12 flex-1 items-center justify-center rounded bg-[#c12e24] font-serif text-[15px] font-bold text-[#f5edd9]"
          @click="stopLearning"
        >
          학습 중단
        </button>
        <button
          type="button"
          class="flex h-12 flex-1 items-center justify-center rounded bg-[#c17f24] font-serif text-[15px] font-bold text-[#f5edd9] disabled:opacity-50"
          :disabled="!!error || isLoading || !currentPage"
          @click="onPrimaryAction"
        >
          {{ isLastPage ? '퀴즈 풀기 →' : '다음 컷 →' }}
        </button>
      </div>
    </template>
  </LearningLayout>
</template>
