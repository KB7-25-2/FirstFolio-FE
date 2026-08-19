<script setup>
import { computed } from 'vue'
import roomBg from '@/assets/learning/scenario/room-bg.jpg'
import penguin from '@/assets/learning/scenario/penguin.png'
import ScenarioClipboardBoard from '@/components/learning/ScenarioClipboardBoard.vue'
import ScenarioBriefDocument from '@/components/learning/ScenarioBriefDocument.vue'
import ScenarioPersonaCard from '@/components/learning/ScenarioPersonaCard.vue'
import ScenarioRequirementsCard from '@/components/learning/ScenarioRequirementsCard.vue'
import ScenarioClipboardQuestion from '@/components/learning/ScenarioClipboardQuestion.vue'
import ScenarioChoiceOption from '@/components/learning/ScenarioChoiceOption.vue'
import ScenarioEvaluationBlock from '@/components/learning/ScenarioEvaluationBlock.vue'
import ScenarioMarketBar from '@/components/learning/ScenarioMarketBar.vue'
import ScenarioResultPanel from '@/components/learning/ScenarioResultPanel.vue'
import BaseLoading from '@/components/BaseLoading.vue'
import FoundationUnlockCeremony from '@/components/FoundationUnlockCeremony.vue'
import { useMainChapterScenarioQuiz } from '@/composables/useMainChapterScenarioQuiz.js'

const {
  isLoading,
  error,
  opening,
  conditions,
  chapterTitle,
  chapterSubtitle,
  stampLabel,
  progressRatio,
  showClientScene,
  scenarioPhase,
  scenarioCurrentStep,
  scenarioIsGraded,
  scenarioUiStatus,
  retryMainChapterQuiz,
  scenarioOptions,
  stepCorrectOption,
  stepSelectedOption,
  evaluationScore,
  primaryLabel,
  primaryEnabled,
  optionVariant,
  startGame,
  selectOption,
  onPrimaryAction,
  goToMainChapter,
  goToRoadmap,
  showUnlockCeremony,
  confirmUnlockCeremony,
  dismissUnlockCeremony,
  pendingFoundationUnlock,
} = useMainChapterScenarioQuiz()

const resultConfirmLabel = computed(() =>
  retryMainChapterQuiz.value
    ? '새 응시로 다시 도전하기 →'
    : pendingFoundationUnlock.value
      ? '모의투자금 받기 →'
      : '학습 로드맵으로',
)
const resultCongratsMessage = computed(() =>
  retryMainChapterQuiz.value
    ? '모든 문항을 맞혀야 대단원을 수료할 수 있어요. 틀린 문항을 확인한 뒤 새 응시로 다시 도전해 보세요.'
    : pendingFoundationUnlock.value
      ? '포트폴리오 기초를 모두 마쳤어요. 모의투자금이 지급되고 포트폴리오가 해금됩니다.'
      : '수고하셨습니다! 실전 상담 시나리오를 모두 마쳤습니다. 앞으로도 꾸준히 학습하며 상담 역량을 키워 보세요.',
)
</script>

<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden bg-[#1a1a2e]">
    <header class="shrink-0 bg-[#1a1a2e] px-4 pt-3 pb-2.5">
      <div class="flex items-center">
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded border-[0.5px] border-[rgba(245,237,217,0.45)] text-[#f5edd9]"
          aria-label="닫기"
          @click="goToMainChapter"
        >
          ✕
        </button>
        <div class="min-w-0 flex-1 text-center">
          <p class="font-serif text-[17px] font-black text-[#f5edd9]">{{ chapterTitle }}</p>
          <p class="font-serif text-[13px] text-[rgba(245,237,217,0.55)]">{{ chapterSubtitle }}</p>
        </div>
        <span
          class="rounded-[2px] border-[0.5px] border-[#c17f24] px-2 py-1 font-serif text-[12px] text-[#c17f24]"
        >
          {{ stampLabel }}
        </span>
      </div>
    </header>
    <div class="h-0.5 w-full shrink-0 bg-[#333347]">
      <div
        class="h-full bg-[#c17f24] transition-[width] duration-300"
        :style="{ width: progressRatio }"
      />
    </div>

    <BaseLoading v-if="isLoading" class="px-4 py-6" />
    <p v-else-if="error" class="px-4 py-6 font-serif text-sm text-red-300">{{ error }}</p>

    <template v-else>
      <div class="relative h-[152px] w-full shrink-0 overflow-hidden">
        <img :src="roomBg" alt="" class="absolute inset-0 size-full object-cover" />
        <div
          class="absolute inset-0 bg-gradient-to-b from-[rgba(15,20,40,0.3)] to-[rgba(15,20,40,0.7)]"
        />
        <div class="absolute inset-x-0 top-0 flex justify-center">
          <span
            class="rounded-full border-[0.5px] border-[rgba(255,214,0,0.3)] bg-[rgba(255,214,0,0.15)] px-2.5 py-1 text-[10px] font-bold text-[#ffd600]"
          >
            금융 상담실 · 실전 게임
          </span>
        </div>

        <template v-if="showClientScene && conditions">
          <div class="absolute bottom-1.5 left-1.5 z-[1]">
            <ScenarioPersonaCard
              :name="conditions.persona.name"
              :age="conditions.persona.age"
              :job="conditions.persona.job"
              :monthly-income="conditions.persona.monthlyIncome"
              :monthly-saving="conditions.persona.monthlySaving"
            />
          </div>
          <div class="pointer-events-none absolute inset-x-0 bottom-1 z-[2] flex justify-center">
            <div class="scenario-penguin">
              <img
                :src="penguin"
                alt=""
                class="h-[82px] w-[110px] object-contain"
                width="110"
                height="82"
              />
            </div>
          </div>
          <div class="absolute right-1.5 bottom-2 z-[1]">
            <ScenarioRequirementsCard
              :assets="conditions.requirements.assets"
              :risk="conditions.requirements.risk"
              :goal="conditions.requirements.goal"
            />
          </div>
        </template>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-3 pt-1 pb-2">
        <ScenarioClipboardBoard v-if="scenarioPhase === 'INTRO' && opening" paper-title="">
          <ScenarioBriefDocument
            :document-title="opening.documentTitle"
            :doc-no="opening.docNo"
            :doc-date="opening.docDate"
            :org-name="opening.orgName"
            :title="opening.title"
            :mission="opening.mission"
            :issuer-label="opening.issuerLabel"
            :issuer-name="opening.issuerName"
            :start-label="opening.startLabel"
            @start="startGame"
          />
        </ScenarioClipboardBoard>

        <ScenarioClipboardBoard
          v-else-if="scenarioPhase === 'PLAY' && scenarioCurrentStep"
          :paper-title="scenarioCurrentStep.paperTitle || '포트폴리오 추천서'"
        >
          <ScenarioClipboardQuestion :prompt="scenarioCurrentStep.prompt">
            <template v-if="scenarioUiStatus === 'CORRECT' && stepCorrectOption">
              <div
                class="scenario-grade-card relative rounded-[10px] border-[0.5px] border-[#c17f24] bg-[rgba(193,127,36,0.15)] px-3 py-2.5 shadow-[0_2px_8px_rgba(139,80,20,0.2)]"
              >
                <div class="flex items-start gap-3 pr-16">
                  <span
                    class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#c17f24] text-[10px] text-white"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <div>
                    <p class="font-serif text-[14px] font-semibold text-[#3d1f08]">
                      {{ stepCorrectOption.label }}
                    </p>
                    <p
                      v-if="stepCorrectOption.description"
                      class="mt-0.5 text-[11px] font-medium text-[#9a7050]"
                    >
                      {{ stepCorrectOption.description }}
                    </p>
                  </div>
                </div>
                <span
                  class="absolute top-2 right-2 inline-flex items-center gap-1 rounded bg-[#c17f24] px-2 py-0.5 font-serif text-[10px] font-bold text-[#fff8ec]"
                >
                  ★ 정답
                </span>
              </div>
              <ScenarioEvaluationBlock
                :key="`eval-ok-${scenarioCurrentStep.stepId}`"
                tone="pass"
                stamp-label="최적"
                :quiz-score="evaluationScore"
                :summary="scenarioCurrentStep.explanation"
              />
            </template>

            <template v-else-if="scenarioUiStatus === 'WRONG' && stepSelectedOption">
              <div
                class="scenario-grade-card relative rounded-[10px] border-[0.5px] border-[rgba(196,92,74,0.55)] bg-[#faebe5] px-3 py-2.5 shadow-[0_2px_8px_rgba(168,56,42,0.16)]"
              >
                <div class="flex items-start gap-3 pr-16">
                  <span
                    class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#c45c4a] text-[10px] text-white"
                    aria-hidden="true"
                  >
                    ✕
                  </span>
                  <div>
                    <p class="font-serif text-[14px] font-semibold text-[#3d1f08]">
                      {{ stepSelectedOption.label }}
                    </p>
                    <p
                      v-if="stepSelectedOption.description"
                      class="mt-0.5 text-[11px] font-medium text-[#9a7050]"
                    >
                      {{ stepSelectedOption.description }}
                    </p>
                  </div>
                </div>
                <span
                  class="absolute top-2 right-2 inline-flex items-center gap-1 rounded bg-[#c45c4a] px-2 py-0.5 font-serif text-[10px] font-bold text-[#fff8ec]"
                >
                  오답
                </span>
              </div>
              <ScenarioEvaluationBlock
                :key="`eval-ng-${scenarioCurrentStep.stepId}`"
                tone="fail"
                stamp-label="부적합"
                :quiz-score="evaluationScore"
                :summary="scenarioCurrentStep.explanation"
              />
            </template>

            <template v-else>
              <ScenarioChoiceOption
                v-for="opt in scenarioOptions"
                :key="opt.key"
                :option-key="opt.key"
                :label="opt.label"
                :description="opt.description || ''"
                :variant="optionVariant(opt.key)"
                :disabled="scenarioIsGraded"
                @select="selectOption"
              />
            </template>

            <template #footer>
              <button
                type="button"
                class="mt-1 flex h-11 w-full items-center justify-center gap-1 rounded-[10px] font-serif text-[14px] font-bold tracking-wide disabled:cursor-not-allowed disabled:opacity-70"
                :class="[
                  primaryEnabled
                    ? 'btn-hover bg-[#c17f24] text-[#fff8ec]'
                    : 'bg-[rgba(232,214,180,0.75)] text-[rgba(61,31,8,0.45)]',
                ]"
                :disabled="!primaryEnabled"
                @click="onPrimaryAction"
              >
                {{ primaryLabel }}
                <span aria-hidden="true">→</span>
              </button>
            </template>
          </ScenarioClipboardQuestion>
        </ScenarioClipboardBoard>

        <ScenarioClipboardBoard v-else-if="scenarioPhase === 'RESULT'" paper-title="">
          <ScenarioResultPanel
            :subject-name="chapterTitle"
            :congrats-message="resultCongratsMessage"
            :confirm-label="resultConfirmLabel"
            :completed="!retryMainChapterQuiz"
            @confirm="goToRoadmap"
          />
        </ScenarioClipboardBoard>
      </div>

      <ScenarioMarketBar
        v-if="conditions"
        :title="conditions.marketTitle"
        :date="conditions.marketDate || ''"
        :bullets="conditions.marketBullets"
        :constraints="conditions.constraints || []"
      />
    </template>

    <FoundationUnlockCeremony
      :open="showUnlockCeremony"
      @confirm="confirmUnlockCeremony"
      @close="dismissUnlockCeremony"
    />
  </div>
</template>

<style scoped>
.scenario-penguin {
  animation: scenario-penguin-breath 2.8s ease-in-out infinite;
  transform-origin: center bottom;
  will-change: transform;
}

.scenario-grade-card {
  animation: scenario-grade-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes scenario-penguin-breath {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes scenario-grade-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .scenario-penguin {
    animation: none;
  }
}
</style>
