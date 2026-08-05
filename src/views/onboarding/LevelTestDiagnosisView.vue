<script setup>
import LearningLayout from '@/components/learning/LearningLayout.vue'
import LearningPageHeader from '@/components/learning/LearningPageHeader.vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'
import QuizExamPaper from '@/components/learning/QuizExamPaper.vue'
import QuizChoiceOption from '@/components/learning/QuizChoiceOption.vue'
import TimetableSheet from '@/components/learning/TimetableSheet.vue'
import { useOnboardingTutorial } from '@/composables/useOnboardingTutorial.js'
import { useLevelTestQuiz } from '@/composables/useLevelTestQuiz.js'
import penguin from '@/assets/study/penguin.png'

const {
  phase,
  startError,
  isStarting,
  tutorialSteps,
  diagnosisPeriods,
  tutorialRuledOffsets,
  tipRuledOffsets,
  onLater,
  goTutorial,
  goDiagnosisIntro,
  onTutorialStart,
  onDiagnosisStart,
  goResult,
} = useOnboardingTutorial()

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
  chapterResults,
  recommendations,
  cartCandidates,
  optionVariant,
  selectOption,
  onPrimaryAction,
  goPrev,
} = useLevelTestQuiz()

const ASSET_LABELS = {
  DEPOSIT_SAVINGS: '예·적금',
  BOND: '채권',
  STOCK: '주식',
  FUND: '펀드',
}

const onQuizPrimary = async () => {
  const result = await onPrimaryAction()
  if (result === 'submitted') goResult()
}
</script>

<template>
  <div class="mx-auto flex mobile-frame flex-col overflow-hidden bg-[#0d1117]">
    <!-- 01 튜토리얼 시작 -->
    <template v-if="phase === 'tutorial'">
      <div class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-10 pb-3">
        <p class="font-serif text-[10px] tracking-[0.4px] text-[rgba(245,237,217,0.55)]">
          FIRSTFOLIO · TUTORIAL
        </p>
        <h1 class="mt-1.5 font-serif text-[22px] leading-snug font-black text-[#f5edd9]">
          금융 공부, 이렇게 시작해요
        </h1>

        <div class="relative mt-5 w-full max-w-[359px] self-center">
          <div
            class="pointer-events-none absolute top-[-7px] left-1/2 z-20 h-3.5 w-[70px] -translate-x-1/2 -rotate-[2deg] border-[0.5px] border-white/25 bg-[var(--study-tape)]"
            aria-hidden="true"
          />
          <div
            class="pointer-events-none absolute -right-0.5 -bottom-3 z-20 size-11 rotate-8 overflow-hidden rounded-[22px] border-[2.5px] border-white bg-[var(--study-sticker)] shadow-[0_3px_6px_rgba(0,0,0,0.3)]"
            aria-hidden="true"
          >
            <img
              :src="penguin"
              alt=""
              class="absolute top-[8px] left-[2px] h-[25px] w-[34px] object-cover"
            />
          </div>

          <LearningNotePaper :show-tape="false" ruled surface-class="bg-[#fffaed] -rotate-[0.8deg]">
            <div class="px-4 pt-3.5 pb-4">
              <p class="font-serif text-[10px] text-[rgba(139,100,60,0.55)]">
                처음 만나는 금융 학습
              </p>
              <p class="mt-1.5 font-pen text-[24px] leading-none text-[#212b5c]">
                나만의 금융 로드맵을 만들어요
              </p>
              <p class="mt-2 font-serif text-[11px] leading-relaxed text-[rgba(61,31,8,0.7)]">
                진단 후 개인 커리큘럼을 직접 구성해요
              </p>
            </div>
          </LearningNotePaper>
        </div>

        <div class="relative mt-7 w-full max-w-[320px] self-center">
          <section
            class="relative w-full rotate-[0.6deg] overflow-hidden rounded-[2px] border border-[rgba(212,184,150,0.55)] bg-[#f5edd9] shadow-[0_4px_14px_rgba(0,0,0,0.28)]"
            aria-label="튜토리얼 진행 순서"
          >
            <div class="pointer-events-none absolute inset-0" aria-hidden="true">
              <div
                v-for="top in tutorialRuledOffsets"
                :key="top"
                class="absolute left-0 h-px w-full bg-[rgba(139,100,60,0.1)]"
                :style="{ top: `${top}px` }"
              />
            </div>

            <div class="relative px-4 pt-4 pb-5">
              <p class="font-serif text-[10px] tracking-wide text-[rgba(139,100,60,0.55)]">
                TUTORIAL · 진행 순서
              </p>
              <h2 class="mt-1 font-pen text-[26px] leading-none text-[#212b5c]">
                네 단계만 따라오세요
              </h2>

              <ul class="mt-4 flex flex-col gap-2.5">
                <li
                  v-for="(step, index) in tutorialSteps"
                  :key="step.key"
                  class="rounded-[4px] border border-[rgba(184,173,148,0.35)] px-3 py-2.5"
                  :class="step.toneClass"
                >
                  <p class="font-serif text-[13px] font-bold text-[#29211a]">
                    {{ index + 1 }}&nbsp;&nbsp;{{ step.title }}
                  </p>
                  <p class="mt-0.5 font-serif text-[10px] text-[rgba(61,31,8,0.6)]">
                    {{ step.description }}
                  </p>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>

      <div class="flex shrink-0 gap-3 px-4 pt-2 pb-6">
        <button
          type="button"
          class="btn-hover flex h-12 w-[96px] shrink-0 items-center justify-center rounded-[10px] bg-[#c12e24] font-serif text-[14px] font-bold text-[#f5edd9]"
          @click="onLater"
        >
          나중에
        </button>
        <button
          type="button"
          class="btn-hover flex h-12 min-w-0 flex-1 items-center justify-center rounded-[10px] bg-[#c17f24] font-serif text-[14px] font-bold text-[#fff8ec]"
          @click="onTutorialStart"
        >
          시작하기 →
        </button>
      </div>
    </template>

    <!-- 02 금융 기초 진단 안내 -->
    <template v-else-if="phase === 'diagnosisIntro'">
      <div class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-10 pb-3">
        <p class="font-serif text-[10px] tracking-[0.4px] text-[rgba(245,237,217,0.55)]">
          FIRSTFOLIO · DIAGNOSIS
        </p>
        <h1 class="mt-1.5 font-serif text-[22px] leading-snug font-black text-[#f5edd9]">
          금융 기초 지식을 확인해볼게요
        </h1>

        <div class="mt-5 w-full max-w-[320px] self-center">
          <TimetableSheet
            category-label="금융 기초 진단"
            title="오늘의 시험 과목"
            description="예·적금 · 채권 · 주식 · 펀드 각 1문항"
            unit-index="DIAG 01"
            :periods="diagnosisPeriods"
            :show-scroll-hint="false"
          />
        </div>

        <div class="relative mt-5 w-[280px] self-center">
          <div
            class="pointer-events-none absolute top-[-6px] left-1/2 z-20 h-3.5 w-[58px] -translate-x-1/2 -rotate-[3deg] border-[0.5px] border-white/25 bg-[var(--study-tape)]"
            aria-hidden="true"
          />
          <section
            class="relative -rotate-[0.8deg] overflow-hidden rounded-[3px] border-[0.8px] border-[#89d973] bg-[#f1fff0] shadow-[0_3px_8px_rgba(0,0,0,0.28)]"
          >
            <div class="pointer-events-none absolute inset-0" aria-hidden="true">
              <div
                v-for="top in tipRuledOffsets"
                :key="top"
                class="absolute left-0 h-px w-full bg-[var(--study-line)]"
                :style="{ top: `${top}px` }"
              />
            </div>
            <div class="relative px-3.5 py-3">
              <p class="font-serif text-[9px] text-[rgba(139,100,60,0.55)]">TIP</p>
              <p class="mt-1 font-pen text-[18px] leading-tight text-[#212b5c]">
                틀려도 괜찮아요. 결과는 학습 추천에만 쓰여요.
              </p>
            </div>
          </section>
        </div>
      </div>

      <div class="flex shrink-0 gap-3 px-4 pt-2 pb-6">
        <button
          type="button"
          class="btn-hover flex h-12 w-[96px] shrink-0 items-center justify-center rounded-[10px] bg-[#c12e24] font-serif text-[14px] font-bold text-[#f5edd9]"
          @click="goTutorial"
        >
          이전
        </button>
        <button
          type="button"
          class="flex h-12 min-w-0 flex-1 items-center justify-center rounded-[10px] bg-[#c17f24] font-serif text-[14px] font-bold text-[#fff8ec] disabled:cursor-not-allowed disabled:opacity-60"
          :class="{ 'btn-hover': !isStarting }"
          :disabled="isStarting"
          @click="onDiagnosisStart"
        >
          진단 시작하기 →
        </button>
      </div>
      <p v-if="startError" class="px-4 pb-4 text-center font-serif text-xs text-red-300">
        {{ startError }}
      </p>
    </template>

    <!-- 03–06 진단 퀴즈 (소단원 퀴즈 UI 재사용) -->
    <LearningLayout v-else-if="phase === 'quiz'" immersive class="!px-0 !pt-0 !pb-0">
      <template #header>
        <div class="px-4 pt-4">
          <LearningPageHeader title="시험지" eyebrow="FIRSTFOLIO · DIAGNOSIS">
            <template #badge>
              <span
                class="rotate-3 rounded border-[1.5px] px-2 py-0.5 font-serif text-[10px] font-black"
                :class="statusBadge.class"
              >
                {{ statusBadge.label }}
              </span>
            </template>
          </LearningPageHeader>
        </div>
      </template>

      <div class="px-4">
        <p v-if="!currentQuestion" class="font-serif text-sm text-[rgba(245,237,217,0.55)]">
          불러오는 중…
        </p>

        <LearningNotePaper v-else ruled surface-class="bg-[#faf5eb]">
          <QuizExamPaper
            :exam-title="examTitle"
            :subject="subject"
            :question-index="questionNumber"
            :question-total="questionTotal"
            :score-per-question="25"
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
          class="mt-3 text-center font-serif text-xs text-red-300"
        >
          {{ actionError || storeError }}
        </p>
      </div>

      <template #footer>
        <div class="mt-4 flex gap-4 px-4 pb-6">
          <button
            type="button"
            class="btn-hover flex h-12 flex-1 items-center justify-center rounded bg-[#c12e24] font-serif text-[15px] font-bold text-[#f5edd9]"
            @click="isFirstQuestion ? goDiagnosisIntro() : goPrev()"
          >
            {{ isFirstQuestion ? '이전' : '이전 문항' }}
          </button>
          <button
            type="button"
            class="flex h-12 flex-1 items-center justify-center rounded font-serif text-[15px] font-bold text-[#f5edd9] disabled:cursor-not-allowed disabled:opacity-70"
            :class="[
              primaryEnabled ? 'bg-[#c17f24]' : 'bg-[#c3b097]',
              { 'btn-hover': primaryEnabled },
            ]"
            :disabled="!primaryEnabled"
            @click="onQuizPrimary"
          >
            {{ primaryLabel }}
          </button>
        </div>
      </template>
    </LearningLayout>

    <!-- 제출 후 임시 결과 (결과 UI 본문은 후속) -->
    <div
      v-else-if="phase === 'result'"
      class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-10 pb-8"
    >
      <p class="font-serif text-[10px] tracking-wide text-[rgba(245,237,217,0.5)]">
        FIRSTFOLIO · RESULT
      </p>
      <h1 class="mt-2 font-serif text-[22px] font-black text-[#f5edd9]">진단 결과</h1>

      <LearningNotePaper class="mt-6" surface-class="bg-[#f5edd9]">
        <div class="px-4 py-4">
          <p class="font-pen text-[22px] text-[#212b5c]">채점이 완료됐어요</p>
          <ul class="mt-4 flex flex-col gap-2">
            <li
              v-for="row in chapterResults"
              :key="row.mainChapterId"
              class="flex items-center justify-between font-serif text-[13px] text-[#29211a]"
            >
              <span>{{ ASSET_LABELS[row.assetType] ?? row.assetType }}</span>
              <span :class="row.isCorrect ? 'text-[#3d7a4a]' : 'text-[#c12e24]'">
                {{ row.isCorrect ? '정답' : '오답' }}
              </span>
            </li>
          </ul>
          <p class="mt-4 font-serif text-[11px] text-[rgba(61,31,8,0.65)]">
            추천 {{ recommendations.length }}개 · 장바구니 후보 {{ cartCandidates.length }}개
          </p>
          <p class="mt-2 font-pen text-[16px] text-[rgba(139,100,60,0.45)]">
            커리큘럼 담기 화면은 다음 이슈에서 연결됩니다
          </p>
        </div>
      </LearningNotePaper>
    </div>
  </div>
</template>
