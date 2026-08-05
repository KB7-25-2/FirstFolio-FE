<script setup>
import { computed, ref } from 'vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'
import { useAuthStore } from '@/store/authStore.js'
import { useLevelTestStore } from '@/store/levelTestStore.js'
import penguin from '@/assets/study/penguin.png'

const authStore = useAuthStore()
const levelTestStore = useLevelTestStore()

/** @type {import('vue').Ref<'tutorial' | 'started'>} */
const phase = ref('tutorial')
const startError = ref('')
const isStarting = ref(false)

const TUTORIAL_STEPS = [
  {
    key: 'questions',
    title: '기초 질문 4개 풀기',
    description: '지금 알고 있는 만큼 편하게 답해요',
    toneClass: 'bg-[#e5f2e0]',
  },
  {
    key: 'recommend',
    title: '진단 결과로 추천 구성하기',
    description: '오답은 자동 포함, 정답은 장바구니',
    toneClass: 'bg-[#e0edf7]',
  },
  {
    key: 'adjust',
    title: '내 마음대로 조정하기',
    description: '필수 기초는 고정, 순서는 직접 조정',
    toneClass: 'bg-[#f5e5ed]',
  },
  {
    key: 'start',
    title: '바로 학습 시작하기',
    description: '완성된 시간표는 학습 탭에 저장돼요',
    toneClass: 'bg-[#faf2db]',
  },
]

const ruledOffsets = computed(() => Array.from({ length: 16 }, (_, index) => 52 + index * 22))

const onLater = () => {
  authStore.logout()
}

const onStart = async () => {
  startError.value = ''
  isStarting.value = true
  try {
    await levelTestStore.start()
    phase.value = 'started'
  } catch (err) {
    startError.value = err?.message || '레벨 테스트를 시작할 수 없습니다.'
  } finally {
    isStarting.value = false
  }
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

        <!-- 상단 로드맵 메모 -->
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

        <!-- 진행 순서 노트 -->
        <div class="relative mt-7 w-full max-w-[320px] self-center">
          <section
            class="relative w-full rotate-[0.6deg] overflow-hidden rounded-[2px] border border-[rgba(212,184,150,0.55)] bg-[#f5edd9] shadow-[0_4px_14px_rgba(0,0,0,0.28)]"
            aria-label="튜토리얼 진행 순서"
          >
            <div class="pointer-events-none absolute inset-0" aria-hidden="true">
              <div
                v-for="top in ruledOffsets"
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
                  v-for="(step, index) in TUTORIAL_STEPS"
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
          class="flex h-12 min-w-0 flex-1 items-center justify-center rounded-[10px] bg-[#c17f24] font-serif text-[14px] font-bold text-[#fff8ec] disabled:cursor-not-allowed disabled:opacity-60"
          :class="{ 'btn-hover': !isStarting }"
          :disabled="isStarting"
          @click="onStart"
        >
          시작하기 →
        </button>
      </div>
      <p v-if="startError" class="px-4 pb-4 text-center font-serif text-xs text-red-300">
        {{ startError }}
      </p>
    </template>

    <!-- CTA 이후 임시 상태 -->
    <div v-else class="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-10 pb-8">
      <p class="font-serif text-[10px] tracking-wide text-[rgba(245,237,217,0.5)]">
        FIRSTFOLIO · DIAGNOSIS
      </p>
      <h1 class="mt-2 font-serif text-[22px] font-black text-[#f5edd9]">금융 기초 진단</h1>

      <div v-if="levelTestStore.attempt" class="mt-8">
        <LearningNotePaper surface-class="bg-[#f5edd9]">
          <div class="px-4 py-4">
            <p class="font-serif text-[12px] text-[rgba(139,100,60,0.7)]">
              응시 ID {{ levelTestStore.attempt.attemptId }} ·
              {{ levelTestStore.attempt.questions.length }}문항
            </p>
            <ul class="mt-3 flex flex-col gap-2">
              <li
                v-for="(q, index) in levelTestStore.attempt.questions"
                :key="q.questionId"
                class="font-serif text-[12px] text-[rgba(61,31,8,0.85)]"
              >
                {{ index + 1 }}. {{ q.prompt }}
              </li>
            </ul>
            <p class="mt-4 font-pen text-[18px] text-[rgba(139,100,60,0.45)]">
              진단 퀴즈 화면은 다음 이슈에서 연결됩니다
            </p>
          </div>
        </LearningNotePaper>
      </div>
    </div>
  </div>
</template>
