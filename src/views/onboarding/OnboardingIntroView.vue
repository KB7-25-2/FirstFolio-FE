<script setup>
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'
import TimetableSheet from '@/components/learning/TimetableSheet.vue'
import MemoPin from '@/components/MemoPin.vue'
import { useOnboardingIntro } from '@/composables/useOnboardingTutorial.js'
import penguin from '@/assets/study/penguin.png'

const {
  step,
  startError,
  isStarting,
  tutorialSteps,
  diagnosisPeriods,
  tutorialRuledOffsets,
  tipRuledOffsets,
  onLater,
  goTutorial,
  onTutorialStart,
  onDiagnosisStart,
} = useOnboardingIntro()
</script>

<template>
  <div class="cork-board mx-auto flex mobile-frame flex-col overflow-hidden">
    <template v-if="step === 'tutorial'">
      <div class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-10 pb-3">
        <p class="font-serif text-[10px] tracking-[0.4px] text-[var(--cork-ink-muted)]">
          FIRSTFOLIO · TUTORIAL
        </p>
        <h1 class="mt-1.5 font-serif text-[22px] leading-snug font-black text-[var(--cork-ink)]">
          금융 공부, 이렇게 시작해요
        </h1>

        <div class="relative mt-5 w-full max-w-[359px] self-center">
          <MemoPin side="center" tone="study" />
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

          <LearningNotePaper :show-pin="false" ruled surface-class="bg-[#fffaed] -rotate-[0.8deg]">
            <div class="px-4 pt-3.5 pb-4">
              <p class="font-serif text-[10px] text-[rgba(139,100,60,0.55)]">
                처음 만나는 금융 학습
              </p>
              <p class="mt-1.5 font-serif text-[18px] leading-snug font-bold text-[#212b5c]">
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
            class="relative w-full rotate-[0.6deg] overflow-hidden rounded-[2px] border-[0.5px] border-[rgba(212,184,150,0.55)] bg-[#f5edd9] shadow-[0_4px_14px_rgba(0,0,0,0.28)]"
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
              <h2 class="mt-1 font-serif text-[20px] leading-snug font-bold text-[#212b5c]">
                네 단계만 따라오세요
              </h2>

              <ul class="mt-4 flex flex-col gap-2.5">
                <li
                  v-for="(s, index) in tutorialSteps"
                  :key="s.key"
                  class="rounded-[4px] border-[0.5px] border-[rgba(184,173,148,0.35)] px-3 py-2.5"
                  :class="s.toneClass"
                >
                  <p class="font-serif text-[13px] font-bold text-[#29211a]">
                    {{ index + 1 }}&nbsp;&nbsp;{{ s.title }}
                  </p>
                  <p class="mt-0.5 font-serif text-[10px] text-[rgba(61,31,8,0.6)]">
                    {{ s.description }}
                  </p>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>

      <div class="flex shrink-0 gap-3 px-4 pt-2 pb-6">
        <button type="button" class="cork-btn cork-btn--danger w-[96px] shrink-0" @click="onLater">
          나중에
        </button>
        <button type="button" class="cork-btn cork-btn--primary flex-1" @click="onTutorialStart">
          시작하기 →
        </button>
      </div>
    </template>

    <template v-else>
      <div class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-10 pb-3">
        <p class="font-serif text-[10px] tracking-[0.4px] text-[var(--cork-ink-muted)]">
          FIRSTFOLIO · DIAGNOSIS
        </p>
        <h1 class="mt-1.5 font-serif text-[22px] leading-snug font-black text-[var(--cork-ink)]">
          금융 기초 지식을 확인해볼게요
        </h1>

        <div class="mt-5 w-full max-w-[320px] self-center">
          <TimetableSheet
            category-label="금융 기초 진단"
            title="오늘의 시험 과목"
            description="예·적금 · 채권 · 주식 · 펀드 단원별 기초 문항"
            unit-index="DIAG 01"
            :periods="diagnosisPeriods"
            :show-scroll-hint="false"
          />
        </div>

        <div class="relative mt-5 w-[280px] self-center">
          <MemoPin side="center" tone="study" />
          <section
            class="relative -rotate-[0.8deg] overflow-hidden rounded-[3px] border-[0.5px] border-[#89d973] bg-[#f1fff0] shadow-[0_3px_8px_rgba(0,0,0,0.28)]"
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
              <p class="mt-1 font-serif text-[15px] leading-snug font-bold text-[#212b5c]">
                틀려도 괜찮아요. 결과는 학습 추천에만 쓰여요.
              </p>
            </div>
          </section>
        </div>
      </div>

      <div class="flex shrink-0 gap-3 px-4 pt-2 pb-6">
        <button
          type="button"
          class="cork-btn cork-btn--danger w-[96px] shrink-0"
          @click="goTutorial"
        >
          이전
        </button>
        <button
          type="button"
          class="cork-btn cork-btn--primary flex-1"
          :disabled="isStarting"
          @click="onDiagnosisStart"
        >
          진단 시작하기 →
        </button>
      </div>
      <p
        v-if="startError"
        class="px-4 pb-4 text-center font-serif text-xs text-[var(--study-total)]"
      >
        {{ startError }}
      </p>
    </template>
  </div>
</template>
