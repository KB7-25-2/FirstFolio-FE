<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDailyQuestStore } from '@/store/dailyQuestStore.js'
import { useLeaderboardStore } from '@/store/leaderboardStore.js'
import { __POINTS_PER_CORRECT } from '@/services/dailyQuestService.js'

defineEmits(['dashboard'])

const questStore = useDailyQuestStore()
const leaderboardStore = useLeaderboardStore()
const { correctCount, totalCount, score, rewardPoints } = storeToRefs(questStore)
const { myRank } = storeToRefs(leaderboardStore)

const ready = ref(false)
onMounted(() => {
  requestAnimationFrame(() => {
    ready.value = true
  })
})

const accuracyPct = computed(() => {
  if (!totalCount.value) return 0
  return Math.round((correctCount.value / totalCount.value) * 100)
})

const scoreLabel = computed(() => `${Number(score.value || 0).toLocaleString('ko-KR')}점`)

const rankLabel = computed(() => {
  if (!myRank.value?.rank) return '랭킹 —'
  return `랭킹 ${myRank.value.rank}위`
})

const rankSub = computed(() => {
  if (!myRank.value) return '주간 리더보드에 점수가 반영됩니다.'
  return `주간 점수 ${myRank.value.weeklyScore.toLocaleString('ko-KR')}점 · 리더보드 반영`
})

const accuracyLabel = computed(
  () => `정답률 ${accuracyPct.value}% (${correctCount.value}/${totalCount.value})`,
)

const pointsLabel = computed(
  () => `포인트 +${Number(rewardPoints.value || 0).toLocaleString('ko-KR')} P 지급`,
)

const pointsSub = computed(() => {
  const per = __POINTS_PER_CORRECT
  return `정답 ${correctCount.value}개 x ${per}P · 원장 기록 · 당일 중복 없음`
})

const stampLabel = computed(() => {
  if (accuracyPct.value >= 80) return '우수'
  if (accuracyPct.value >= 60) return '양호'
  if (accuracyPct.value >= 40) return '보통'
  return '미흡'
})

const filledStars = computed(() => {
  if (accuracyPct.value >= 80) return 5
  if (accuracyPct.value >= 60) return 4
  if (accuracyPct.value >= 40) return 3
  if (accuracyPct.value >= 20) return 2
  return 1
})

const meters = computed(() => {
  const base = Math.max(20, Math.min(98, accuracyPct.value || 20))
  return [
    { label: '정확도', value: accuracyPct.value || base, bar: 'bg-[#c17f24]' },
    { label: '응답 속도', value: Math.min(99, Math.max(40, base - 5)), bar: 'bg-[#478552]' },
    { label: '리스크 관리', value: Math.min(99, Math.max(45, base + 2)), bar: 'bg-[#3d6ea8]' },
  ]
})

const evalSummary = computed(
  () =>
    `정답 ${correctCount.value}개 기준으로 포인트가 지급되었습니다. 출석 체크 포인트는 별도입니다.`,
)
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col pt-1" :class="ready ? 'dq-result--ready' : ''">
    <div class="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain pb-1">
      <!-- 타이틀 -->
      <div
        class="relative flex items-center justify-center border-b border-[rgba(139,100,60,0.2)] pb-2"
      >
        <span
          class="absolute top-0.5 left-0.5 size-1.5 rounded-sm bg-[rgba(0,0,0,0.12)] shadow-[inset_0_1px_1px_rgba(0,0,0,0.2)]"
        />
        <span
          class="absolute top-0.5 right-0.5 size-1.5 rounded-sm bg-[rgba(0,0,0,0.12)] shadow-[inset_0_1px_1px_rgba(0,0,0,0.2)]"
        />
        <h2 class="font-serif text-[15px] font-black tracking-wide text-[#3d1f08]">
          최종 결과 보고서
        </h2>
      </div>

      <!-- 지표 카드 -->
      <div class="flex flex-col gap-2">
        <div
          class="dq-result__card relative flex items-start gap-2.5 rounded-[10px] border border-[rgba(193,127,36,0.35)] bg-[rgba(193,127,36,0.12)] px-3 py-2.5"
        >
          <span
            class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#c17f24] text-[11px] font-bold text-white"
            aria-hidden="true"
          >
            ✓
          </span>
          <div class="min-w-0 flex-1 pr-14">
            <p class="font-serif text-[13px] font-black text-[#3d1f08]">
              최종 점수 {{ scoreLabel }}
            </p>
            <p class="mt-0.5 font-serif text-[10px] leading-[14px] text-[rgba(61,31,8,0.65)]">
              오늘의 퀘스트 점수가 확정되었습니다.
            </p>
          </div>
          <span
            class="absolute top-2 right-2 rounded bg-[#8b5014] px-1.5 py-0.5 font-serif text-[9px] font-bold text-[#fff8ec]"
          >
            ★ 완료
          </span>
        </div>

        <div
          class="dq-result__card flex items-start gap-2.5 rounded-[10px] border border-[rgba(139,100,60,0.22)] bg-[rgba(255,255,255,0.35)] px-3 py-2.5"
          style="animation-delay: 0.06s"
        >
          <span
            class="mt-0.5 size-6 shrink-0 rounded-full border-[1.5px] border-[rgba(139,100,60,0.4)]"
            aria-hidden="true"
          />
          <div class="min-w-0 flex-1">
            <p class="font-serif text-[13px] font-black text-[#3d1f08]">{{ rankLabel }}</p>
            <p class="mt-0.5 font-serif text-[10px] leading-[14px] text-[rgba(61,31,8,0.65)]">
              {{ rankSub }}
            </p>
          </div>
        </div>

        <div
          class="dq-result__card flex items-start gap-2.5 rounded-[10px] border border-[rgba(139,100,60,0.22)] bg-[rgba(255,255,255,0.35)] px-3 py-2.5"
          style="animation-delay: 0.12s"
        >
          <span
            class="mt-0.5 size-6 shrink-0 rounded-full border-[1.5px] border-[rgba(139,100,60,0.4)]"
            aria-hidden="true"
          />
          <div class="min-w-0 flex-1">
            <p class="font-serif text-[13px] font-black text-[#3d1f08]">{{ accuracyLabel }}</p>
            <p class="mt-0.5 font-serif text-[10px] leading-[14px] text-[rgba(61,31,8,0.65)]">
              정답 {{ correctCount }}개 기준 포인트 산정
            </p>
          </div>
        </div>

        <div
          class="dq-result__card flex items-start gap-2.5 rounded-[10px] border border-[rgba(139,100,60,0.22)] bg-[rgba(255,255,255,0.35)] px-3 py-2.5"
          style="animation-delay: 0.18s"
        >
          <span
            class="mt-0.5 size-6 shrink-0 rounded-full border-[1.5px] border-[rgba(139,100,60,0.4)]"
            aria-hidden="true"
          />
          <div class="min-w-0 flex-1">
            <p class="font-serif text-[13px] font-black text-[#3d1f08]">{{ pointsLabel }}</p>
            <p class="mt-0.5 font-serif text-[10px] leading-[14px] text-[rgba(61,31,8,0.65)]">
              {{ pointsSub }}
            </p>
          </div>
        </div>
      </div>

      <!-- 종합 평가 -->
      <div
        class="dq-result__eval overflow-hidden rounded-[10px] border border-dashed border-[rgba(139,100,60,0.35)] px-3 py-2"
      >
        <div class="flex items-center gap-2 py-1">
          <div class="h-px flex-1 bg-[rgba(139,100,60,0.25)]" />
          <p class="font-serif text-[10px] font-bold tracking-[1.2px] text-[#7a5230]">종합 평가</p>
          <div class="h-px flex-1 bg-[rgba(139,100,60,0.25)]" />
        </div>

        <div class="relative mt-1 flex items-center justify-center gap-1 py-2">
          <span
            v-for="n in 5"
            :key="n"
            class="dq-result__star text-[18px]"
            :class="n <= filledStars ? 'text-[#c17f24]' : 'text-[rgba(139,100,60,0.25)]'"
            :style="{ animationDelay: `${0.12 + n * 0.07}s` }"
          >
            ★
          </span>
          <span
            class="dq-result__stamp absolute -right-0.5 top-0 rounded border-2 border-[rgba(139,69,19,0.6)] bg-[rgba(245,237,217,0.35)] px-2.5 py-1 font-serif text-[13px] font-black tracking-wide text-[rgba(139,69,19,0.75)]"
            aria-hidden="true"
          >
            {{ stampLabel }}
          </span>
        </div>

        <div class="mt-1 flex flex-col gap-2 px-0.5">
          <div v-for="(meter, index) in meters" :key="meter.label">
            <div class="mb-1 flex items-center justify-between text-[11px]">
              <span class="font-serif text-[#3d1f08]">{{ meter.label }}</span>
              <span class="font-bold text-[#3d1f08]">{{ meter.value }}%</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-[rgba(139,100,60,0.15)]">
              <div
                class="dq-result__bar h-full rounded-full"
                :class="meter.bar"
                :style="{
                  '--bar-width': `${meter.value}%`,
                  animationDelay: `${0.35 + index * 0.12}s`,
                }"
              />
            </div>
          </div>
        </div>

        <p
          class="dq-result__summary mt-3 text-center font-serif text-[11px] leading-[17px] text-[#7a5230]"
        >
          {{ evalSummary }}
        </p>
      </div>
    </div>

    <button
      type="button"
      class="mt-2 flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-[10px] border border-[rgba(139,100,60,0.35)] bg-[rgba(255,248,236,0.9)] font-serif text-[14px] font-bold text-[#3d1f08]"
      @click="$emit('dashboard')"
    >
      돌아가기
    </button>
  </div>
</template>

<style scoped>
.dq-result__card {
  opacity: 0;
  transform: translateY(8px);
}

.dq-result--ready .dq-result__card {
  animation: dq-result-fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.dq-result__star {
  opacity: 0;
  transform: scale(0.4) translateY(6px);
}

.dq-result--ready .dq-result__star {
  animation: dq-result-star-pop 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.dq-result__stamp {
  opacity: 0;
  transform: rotate(-28deg) scale(1.55) translateY(-18px);
}

.dq-result--ready .dq-result__stamp {
  animation: dq-result-stamp 0.55s cubic-bezier(0.2, 0.9, 0.25, 1.15) 0.45s forwards;
}

.dq-result__bar {
  width: 0;
}

.dq-result--ready .dq-result__bar {
  animation: dq-result-bar 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.dq-result__summary {
  opacity: 0;
}

.dq-result--ready .dq-result__summary {
  animation: dq-result-fade-up 0.4s ease 0.75s forwards;
}

@keyframes dq-result-fade-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dq-result-star-pop {
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes dq-result-stamp {
  0% {
    opacity: 0;
    transform: rotate(-28deg) scale(1.55) translateY(-18px);
  }
  55% {
    opacity: 1;
    transform: rotate(-10deg) scale(0.94) translateY(1px);
  }
  100% {
    opacity: 1;
    transform: rotate(-12deg) scale(1) translateY(0);
  }
}

@keyframes dq-result-bar {
  to {
    width: var(--bar-width);
  }
}
</style>
