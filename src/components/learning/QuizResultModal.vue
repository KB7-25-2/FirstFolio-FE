<script setup>
import { computed } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  correctCount: {
    type: Number,
    default: 0,
  },
  totalCount: {
    type: Number,
    default: 0,
  },
  quizScore: {
    type: Number,
    default: 0,
  },
  scorePerQuestion: {
    type: Number,
    default: 10,
  },
  pointsGranted: {
    type: Number,
    default: 0,
  },
})

defineEmits(['confirm', 'close'])

const earnedScore = computed(() => props.correctCount * props.scorePerQuestion)
</script>

<template>
  <Teleport to="body">
    <Transition name="quiz-result-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center px-5"
        role="dialog"
        aria-modal="true"
        aria-label="시험 결과"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/50"
          aria-label="닫기"
          @click="$emit('close')"
        />
        <Transition name="quiz-result-pop" appear>
          <div
            v-if="open"
            class="relative z-10 w-full max-w-[320px] overflow-hidden rounded-lg border border-[rgba(212,184,150,0.55)] bg-[#faf5eb] shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          >
            <div
              class="pointer-events-none absolute top-3 left-1/2 h-3.5 w-[72px] -translate-x-1/2 rotate-[3deg] bg-[rgba(217,209,184,0.7)]"
              aria-hidden="true"
            />
            <div class="relative px-5 pt-8 pb-5 text-center">
              <p class="font-serif text-[11px] tracking-wide text-[rgba(139,100,60,0.65)]">
                QUIZ RESULT
              </p>
              <p class="mt-1 font-serif text-[18px] font-black text-[#29211a]">시험 결과</p>

              <p class="mt-5 font-pen text-[36px] leading-none text-[#212b5c]">
                {{ correctCount }}
                <span class="text-[22px] text-[rgba(33,43,92,0.45)]">/ {{ totalCount }}</span>
              </p>

              <p class="mt-3 font-serif text-[13px] text-[rgba(61,31,8,0.75)]">
                득점 {{ earnedScore }}점 · 정답률 {{ quizScore }}%
              </p>

              <p
                v-if="pointsGranted > 0"
                class="mt-3 inline-block rounded border border-[rgba(193,127,36,0.45)] bg-[#fff7eb] px-3 py-1 font-serif text-[12px] font-bold text-[#c17f24]"
              >
                포인트 +{{ pointsGranted }}
              </p>
              <p v-else class="mt-3 font-serif text-[12px] text-[rgba(139,100,60,0.55)]">
                이번 응시 포인트 없음
              </p>

              <button
                type="button"
                class="btn-hover mt-6 flex h-12 w-full items-center justify-center rounded bg-[#c17f24] font-serif text-[15px] font-bold text-[#f5edd9]"
                @click="$emit('confirm')"
              >
                학습 목록으로
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.quiz-result-fade-enter-active,
.quiz-result-fade-leave-active {
  transition: opacity 0.22s ease;
}
.quiz-result-fade-enter-from,
.quiz-result-fade-leave-to {
  opacity: 0;
}

.quiz-result-pop-enter-active {
  transition:
    opacity 0.28s ease,
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
.quiz-result-pop-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.quiz-result-pop-enter-from,
.quiz-result-pop-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}
</style>
