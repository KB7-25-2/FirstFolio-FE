<script setup>
import LearningLayout from '@/components/learning/LearningLayout.vue'
import LearningPageHeader from '@/components/learning/LearningPageHeader.vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'
import QuizExamPaper from '@/components/learning/QuizExamPaper.vue'
import QuizChoiceOption from '@/components/learning/QuizChoiceOption.vue'
import QuizFeedbackBlock from '@/components/learning/QuizFeedbackBlock.vue'
import QuizResultModal from '@/components/learning/QuizResultModal.vue'
import QuizGradeMark from '@/components/learning/QuizGradeMark.vue'
import { useSubChapterQuiz } from '@/composables/useSubChapterQuiz.js'

const {
  subChapterId,
  isLoading,
  error,
  examTitle,
  subject,
  scorePerQuestion,
  statusBadge,
  feedbackHint,
  quizCurrentQuestion,
  quizQuestionTotal,
  quizQuestionNumber,
  quizIsGraded,
  quizUiStatus,
  quizFinished,
  quizCorrectCount,
  quizAttemptResult,
  optionsWithTone,
  primaryLabel,
  primaryEnabled,
  optionVariant,
  selectOption,
  onPrimaryAction,
  giveUp,
  goToMainChapter,
} = useSubChapterQuiz()
</script>

<template>
  <LearningLayout immersive>
    <template #header>
      <LearningPageHeader title="시험지" :eyebrow="`소단원 #${subChapterId} · 퀴즈`">
        <template #badge>
          <span
            class="rotate-3 rounded border-[1.5px] px-2 py-0.5 font-serif text-[10px] font-black"
            :class="statusBadge.class"
          >
            {{ statusBadge.label }}
          </span>
        </template>
      </LearningPageHeader>
    </template>

    <p v-if="isLoading" class="font-serif text-sm text-[rgba(245,237,217,0.55)]">불러오는 중…</p>
    <p v-else-if="error" class="font-serif text-sm text-red-300">{{ error }}</p>

    <LearningNotePaper v-else-if="quizCurrentQuestion" ruled surface-class="bg-[#faf5eb]">
      <QuizExamPaper
        :exam-title="examTitle"
        :subject="subject"
        :question-index="quizQuestionNumber"
        :question-total="quizQuestionTotal"
        :score-per-question="scorePerQuestion"
      >
        <div class="relative flex gap-2">
          <QuizGradeMark
            v-if="quizUiStatus === 'CORRECT'"
            type="circle"
            size="lg"
            class="absolute -top-3 -left-2 z-[2] rotate-[6deg]"
          />
          <QuizGradeMark
            v-else-if="quizUiStatus === 'WRONG'"
            type="slash"
            size="lg"
            class="absolute -top-2 -left-1 z-[2] rotate-[8deg]"
          />
          <p class="relative z-[1] shrink-0 font-serif text-[13px] font-black text-[#29211a]">
            문 {{ quizQuestionNumber }}.
          </p>
          <p
            class="relative z-[1] font-serif text-[14px] leading-[22px] font-bold whitespace-pre-line text-[#29211a]"
          >
            {{ quizCurrentQuestion.prompt }}
          </p>
        </div>

        <div class="mt-5 flex flex-col gap-3">
          <QuizChoiceOption
            v-for="opt in optionsWithTone"
            :key="opt.key"
            :option-key="opt.key"
            :label="opt.label"
            :tone="opt.tone"
            :variant="optionVariant(opt.key)"
            :disabled="quizIsGraded || quizFinished"
            @select="selectOption"
          />
        </div>

        <QuizFeedbackBlock
          v-if="quizUiStatus === 'CORRECT'"
          result="correct"
          :explanation="quizCurrentQuestion.explanation"
          :score="scorePerQuestion"
          :hint="feedbackHint"
        />
        <QuizFeedbackBlock
          v-else-if="quizUiStatus === 'WRONG'"
          result="wrong"
          :explanation="quizCurrentQuestion.explanation"
          :hint="feedbackHint"
        />
        <p v-else class="mt-8 font-pen text-[15px] text-[rgba(33,43,92,0.75)]">
          보기 번호를 골라 답을 쓰세요
        </p>
      </QuizExamPaper>
    </LearningNotePaper>

    <QuizResultModal
      :open="quizFinished"
      :correct-count="quizAttemptResult?.correctCount ?? quizCorrectCount"
      :total-count="quizAttemptResult?.totalCount ?? quizQuestionTotal"
      :quiz-score="quizAttemptResult?.quizScore ?? 0"
      :score-per-question="scorePerQuestion"
      :points-granted="quizAttemptResult?.pointsGranted ?? 0"
      @confirm="goToMainChapter"
      @close="goToMainChapter"
    />

    <template v-if="!quizFinished" #footer>
      <div class="mt-4 flex gap-4">
        <button
          type="button"
          class="flex h-12 flex-1 items-center justify-center rounded bg-[#c12e24] font-serif text-[15px] font-bold text-[#f5edd9]"
          @click="giveUp"
        >
          시험 포기
        </button>
        <button
          type="button"
          class="flex h-12 flex-1 items-center justify-center rounded font-serif text-[15px] font-bold text-[#f5edd9] disabled:opacity-70"
          :class="primaryEnabled ? 'bg-[#c17f24]' : 'bg-[#c3b097]'"
          :disabled="!primaryEnabled || !!error"
          @click="onPrimaryAction"
        >
          {{ primaryLabel }}
        </button>
      </div>
    </template>
  </LearningLayout>
</template>
