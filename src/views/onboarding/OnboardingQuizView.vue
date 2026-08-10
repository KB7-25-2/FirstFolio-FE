<script setup>
import LearningLayout from '@/components/learning/LearningLayout.vue'
import LearningPageHeader from '@/components/learning/LearningPageHeader.vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'
import QuizExamPaper from '@/components/learning/QuizExamPaper.vue'
import QuizChoiceOption from '@/components/learning/QuizChoiceOption.vue'
import BaseLoading from '@/components/BaseLoading.vue'
import { useLevelTestQuiz } from '@/composables/useLevelTestQuiz.js'
import { computed } from 'vue'

const {
  currentQuestion,
  questionTotal,
  questionNumber,
  isFirstQuestion,
  examTitle,
  subject,
  statusBadge,
  optionsWithTone,
  primaryLabel,
  primaryEnabled,
  actionError,
  storeError,
  optionVariant,
  selectOption,
  onPrimaryAction,
  goPrev,
  goIntro,
} = useLevelTestQuiz()

const scorePerQuestion = computed(() =>
  questionTotal.value > 0 ? Math.round(100 / questionTotal.value) : 10,
)
</script>

<template>
  <div class="cork-board mx-auto flex mobile-frame flex-col overflow-hidden">
    <LearningLayout immersive bleed-header>
      <template #header>
        <LearningPageHeader title="시험지" subtitle="FIRSTFOLIO · DIAGNOSIS">
          <template #badge>
            <span
              class="chalk-header__stamp rotate-3 rounded px-2 py-0.5 font-pen text-[12px]"
              :class="statusBadge.class"
            >
              {{ statusBadge.label }}
            </span>
          </template>
        </LearningPageHeader>
      </template>

      <BaseLoading v-if="!currentQuestion" />

      <LearningNotePaper v-else ruled pin-tone="red" surface-class="bg-[#faf5eb]">
        <QuizExamPaper
          :exam-title="examTitle"
          :subject="subject"
          :question-index="questionNumber"
          :question-total="questionTotal"
          :score-per-question="scorePerQuestion"
        >
          <div class="relative flex gap-2">
            <p class="relative z-[1] shrink-0 font-serif text-[13px] font-black text-[#29211a]">
              문 {{ questionNumber }}.
            </p>
            <p
              class="relative z-[1] font-serif text-[14px] leading-[22px] font-bold whitespace-pre-line text-[#29211a]"
            >
              {{ currentQuestion.prompt }}
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
              @select="selectOption"
            />
          </div>

          <p class="mt-8 font-pen text-[15px] text-[rgba(33,43,92,0.75)]">
            보기 번호를 골라 답을 쓰세요
          </p>
        </QuizExamPaper>
      </LearningNotePaper>

      <p
        v-if="actionError || storeError"
        class="mt-3 text-center font-serif text-xs text-[var(--study-total)]"
      >
        {{ actionError || storeError }}
      </p>

      <template #footer>
        <div class="mt-4 flex gap-3">
          <button
            type="button"
            class="cork-btn cork-btn--ghost flex-1"
            @click="isFirstQuestion ? goIntro() : goPrev()"
          >
            {{ isFirstQuestion ? '이전' : '이전 문항' }}
          </button>
          <button
            type="button"
            class="cork-btn cork-btn--primary flex-1"
            :disabled="!primaryEnabled"
            @click="onPrimaryAction"
          >
            {{ primaryLabel }}
          </button>
        </div>
      </template>
    </LearningLayout>
  </div>
</template>
