<script setup>
import LearningLayout from '@/components/learning/LearningLayout.vue'
import LearningPageHeader from '@/components/learning/LearningPageHeader.vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'
import ScenarioBriefDocument from '@/components/learning/ScenarioBriefDocument.vue'
import ScenarioPersonaCard from '@/components/learning/ScenarioPersonaCard.vue'
import ScenarioClipboardQuestion from '@/components/learning/ScenarioClipboardQuestion.vue'
import ScenarioMarketBar from '@/components/learning/ScenarioMarketBar.vue'
import ScenarioResultPanel from '@/components/learning/ScenarioResultPanel.vue'
import QuizChoiceOption from '@/components/learning/QuizChoiceOption.vue'
import QuizFeedbackBlock from '@/components/learning/QuizFeedbackBlock.vue'
import { useMainChapterScenarioQuiz } from '@/composables/useMainChapterScenarioQuiz.js'

const {
  mainChapterId,
  isLoading,
  error,
  rewardStar,
  opening,
  conditions,
  statusBadge,
  scenarioPhase,
  scenarioCurrentStep,
  scenarioStepTotal,
  scenarioStepNumber,
  scenarioIsGraded,
  scenarioUiStatus,
  scenarioCorrectCount,
  scenarioAttemptResult,
  optionsWithTone,
  scorePerQuestion,
  primaryLabel,
  primaryEnabled,
  optionVariant,
  startGame,
  selectOption,
  onPrimaryAction,
  giveUp,
  goToMainChapter,
} = useMainChapterScenarioQuiz()
</script>

<template>
  <LearningLayout immersive>
    <template #header>
      <LearningPageHeader title="시나리오 퀴즈" :eyebrow="`대단원 #${mainChapterId}`">
        <template #badge>
          <span
            class="rotate-3 rounded border-[1.5px] px-2 py-0.5 font-serif text-[10px] font-black"
            :class="statusBadge.class"
          >
            {{ statusBadge.label }}
          </span>
        </template>
        <template #actions>
          <button
            type="button"
            class="font-serif text-lg text-[#f5edd9]"
            aria-label="닫기"
            @click="goToMainChapter"
          >
            ✕
          </button>
        </template>
      </LearningPageHeader>
    </template>

    <p v-if="isLoading" class="font-serif text-sm text-[rgba(245,237,217,0.55)]">불러오는 중…</p>
    <p v-else-if="error" class="font-serif text-sm text-red-300">{{ error }}</p>

    <LearningNotePaper
      v-else-if="scenarioPhase === 'INTRO' && opening"
      surface-class="bg-[#f0e6d4]"
    >
      <ScenarioBriefDocument
        :document-title="opening.documentTitle"
        :greeting="opening.greeting"
        :mission="opening.mission"
        :start-label="opening.startLabel"
        @start="startGame"
      />
    </LearningNotePaper>

    <template v-else-if="scenarioPhase === 'PLAY' && scenarioCurrentStep && conditions">
      <LearningNotePaper surface-class="bg-[#faf5eb]">
        <div class="flex flex-col gap-4 px-4 py-4">
          <ScenarioPersonaCard
            :name="conditions.persona.name"
            :role="conditions.persona.role"
            :summary="conditions.persona.summary"
          />
          <ScenarioClipboardQuestion
            :step-number="scenarioStepNumber"
            :step-total="scenarioStepTotal"
            :prompt="scenarioCurrentStep.prompt"
          >
            <QuizChoiceOption
              v-for="opt in optionsWithTone"
              :key="opt.key"
              :option-key="opt.key"
              :label="opt.label"
              :tone="opt.tone"
              :variant="optionVariant(opt.key)"
              :disabled="scenarioIsGraded"
              @select="selectOption"
            />
            <QuizFeedbackBlock
              v-if="scenarioUiStatus === 'CORRECT'"
              result="correct"
              :explanation="scenarioCurrentStep.explanation"
              :score="scorePerQuestion"
              hint="잘했어요 · 상담 메모에 기록"
            />
            <QuizFeedbackBlock
              v-else-if="scenarioUiStatus === 'WRONG'"
              result="wrong"
              :explanation="scenarioCurrentStep.explanation"
              hint="다시 생각해 보세요"
            />
          </ScenarioClipboardQuestion>
        </div>
      </LearningNotePaper>

      <div class="mt-3">
        <ScenarioMarketBar
          :title="conditions.marketTitle"
          :bullets="conditions.marketBullets"
          :constraints="conditions.constraints"
        />
      </div>
    </template>

    <LearningNotePaper v-else-if="scenarioPhase === 'RESULT'" surface-class="bg-[#f0e6d4]">
      <ScenarioResultPanel
        :correct-count="scenarioAttemptResult?.correctCount ?? scenarioCorrectCount"
        :total-count="scenarioAttemptResult?.totalCount ?? scenarioStepTotal"
        :quiz-score="scenarioAttemptResult?.quizScore ?? 0"
        :reward-star="scenarioAttemptResult?.rewardStar ?? rewardStar"
        :points-granted="scenarioAttemptResult?.pointsGranted ?? 0"
        @confirm="goToMainChapter"
      />
    </LearningNotePaper>

    <template v-if="scenarioPhase === 'PLAY' && !error" #footer>
      <div class="mt-4 flex gap-4">
        <button
          type="button"
          class="flex h-12 flex-1 items-center justify-center rounded bg-[#c12e24] font-serif text-[15px] font-bold text-[#f5edd9]"
          @click="giveUp"
        >
          상담 포기
        </button>
        <button
          type="button"
          class="flex h-12 flex-1 items-center justify-center rounded font-serif text-[15px] font-bold text-[#f5edd9] disabled:opacity-70"
          :class="primaryEnabled ? 'bg-[#c17f24]' : 'bg-[#c3b097]'"
          :disabled="!primaryEnabled"
          @click="onPrimaryAction"
        >
          {{ primaryLabel }}
        </button>
      </div>
    </template>
  </LearningLayout>
</template>
