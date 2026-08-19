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
  needsQuiz,
  quizProgressLabel,
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
  goToQuiz,
  backToLesson,
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
      v-else-if="needsQuiz"
      class="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8 text-center"
    >
      <LearningNotePaper :show-pin="false" ruled surface-class="bg-[#f5edd9] w-full max-w-[320px]">
        <div class="px-4 py-6">
          <p class="font-serif text-[11px] font-bold text-[#c17f24]">학습 완료</p>
          <p class="mt-2 font-serif text-[18px] font-bold leading-snug text-[#212b5c]">
            강좌를 모두 읽었어요
          </p>
          <p class="mt-2 font-serif text-[13px] leading-relaxed text-[rgba(61,31,8,0.65)]">
            이제 소단원 퀴즈를 풀어 학습을 마무리해 주세요.
          </p>
          <p v-if="quizProgressLabel" class="mt-3 font-serif text-[12px] font-bold text-[#c17f24]">
            진행 중 · {{ quizProgressLabel }}
          </p>
          <button type="button" class="cork-btn cork-btn--primary mt-5 w-full" @click="goToQuiz">
            {{ quizProgressLabel ? '퀴즈 이어하기 →' : '퀴즈 풀기 →' }}
          </button>
        </div>
      </LearningNotePaper>
    </div>

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
      <div v-if="needsQuiz" class="mt-4 flex gap-3">
        <button type="button" class="cork-btn cork-btn--ghost flex-1" @click="backToLesson">
          ← 강좌 보기
        </button>
        <button type="button" class="cork-btn cork-btn--danger flex-1" @click="stopLearning">
          로드맵으로
        </button>
      </div>
      <div v-else class="mt-4 flex gap-3">
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
