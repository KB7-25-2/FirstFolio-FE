<script setup>
import LearningLayout from '@/components/learning/LearningLayout.vue'
import LearningPageHeader from '@/components/learning/LearningPageHeader.vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'
import QuizExamPaper from '@/components/learning/QuizExamPaper.vue'
import QuizChoiceOption from '@/components/learning/QuizChoiceOption.vue'
import QuizFeedbackBlock from '@/components/learning/QuizFeedbackBlock.vue'
import { useSubChapterQuiz } from '@/composables/useSubChapterQuiz.js'

const {
  subChapterId,
  isLoading,
  error,
  examTitle,
  subject,
  scorePerQuestion,
  statusBadge,
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

    <LearningNotePaper v-else-if="quizFinished" ruled surface-class="bg-[#faf5eb]">
      <div class="px-5 py-8 text-center">
        <p class="font-serif text-[18px] font-black text-[#29211a]">시험 결과</p>
        <p class="mt-4 font-pen text-[28px] text-[#212b5c]">
          {{ quizAttemptResult?.correctCount ?? quizCorrectCount }} /
          {{ quizAttemptResult?.totalCount ?? quizQuestionTotal }}
        </p>
        <p class="mt-2 font-serif text-[13px] text-[rgba(61,31,8,0.7)]">
          득점
          {{ (quizAttemptResult?.correctCount ?? quizCorrectCount) * scorePerQuestion }}점 · 정답률
          {{ quizAttemptResult?.quizScore ?? 0 }}%
        </p>
        <p
          v-if="quizAttemptResult?.pointsGranted != null"
          class="mt-3 font-serif text-[12px] text-[rgba(139,100,60,0.75)]"
        >
          포인트 +{{ quizAttemptResult.pointsGranted }}
        </p>
      </div>
    </LearningNotePaper>

    <LearningNotePaper v-else-if="quizCurrentQuestion" ruled surface-class="bg-[#faf5eb]">
      <QuizExamPaper
        :exam-title="examTitle"
        :subject="subject"
        :question-index="quizQuestionNumber"
        :question-total="quizQuestionTotal"
        :score-per-question="scorePerQuestion"
      >
        <div class="flex gap-2">
          <p class="shrink-0 font-serif text-[13px] font-black text-[#29211a]">
            문 {{ quizQuestionNumber }}.
          </p>
          <p
            class="font-serif text-[14px] leading-[22px] font-bold whitespace-pre-line text-[#29211a]"
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
            :disabled="quizIsGraded"
            @select="selectOption"
          />
        </div>

        <QuizFeedbackBlock
          v-if="quizUiStatus === 'CORRECT'"
          result="correct"
          :explanation="quizCurrentQuestion.explanation"
        />
        <QuizFeedbackBlock
          v-else-if="quizUiStatus === 'WRONG'"
          result="wrong"
          :explanation="quizCurrentQuestion.explanation"
        />
        <p v-else class="mt-8 font-pen text-[15px] text-[rgba(33,43,92,0.75)]">
          보기 번호를 골라 답을 쓰세요
        </p>
      </QuizExamPaper>
    </LearningNotePaper>

    <template #footer>
      <div class="mt-4 flex gap-4">
        <button
          type="button"
          class="flex h-12 flex-1 items-center justify-center rounded bg-[#c12e24] font-serif text-[15px] font-bold text-[#f5edd9]"
          @click="giveUp"
        >
          {{ quizFinished ? '닫기' : '시험 포기' }}
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
