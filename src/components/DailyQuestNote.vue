<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useDailyQuestStore } from '@/store/dailyQuestStore.js'
import { useLeaderboardStore } from '@/store/leaderboardStore.js'
import BaseLoading from '@/components/BaseLoading.vue'
import MemoPin from '@/components/MemoPin.vue'

const STREAK_STORAGE_KEY = 'ff.dailyQuest.streakDays'

const router = useRouter()
const questStore = useDailyQuestStore()
const leaderboardStore = useLeaderboardStore()

const {
  answeredCount,
  totalCount,
  score,
  status,
  isLoading: questLoading,
  error: questError,
  progressLabel,
} = storeToRefs(questStore)
const { myRank, isLoading: rankLoading } = storeToRefs(leaderboardStore)

/** 목업 스트릭 — API 연동 전 로컬 값 */
const streakDays = ref(3)

const isLoading = computed(() => (questLoading.value || rankLoading.value) && !status.value)

const progressPercent = computed(() => {
  const total = totalCount.value || 5
  return Math.min(100, Math.round(((answeredCount.value || 0) / total) * 100))
})

const questStatusLabel = computed(() => {
  if (status.value === 'COMPLETED') return '오늘 퀘스트 완료'
  if (status.value === 'IN_PROGRESS') return '진행 중'
  if (status.value === 'ASSIGNED') return '아직 시작 전'
  return '불러오는 중'
})

const questCtaLabel = computed(() => {
  if (status.value === 'COMPLETED') return '결과 보기 →'
  if (status.value === 'IN_PROGRESS') return '이어하기 →'
  return '시작하기 →'
})

/** 오늘 퀘스트 점수 우선, 없으면 주간 점수 */
const scoreDisplay = computed(() => {
  if (score.value > 0) return score.value.toLocaleString('ko-KR')
  if (myRank.value?.weeklyScore != null) return myRank.value.weeklyScore.toLocaleString('ko-KR')
  return '0'
})

const scoreHint = computed(() => {
  if (score.value > 0) return '오늘 획득'
  if (myRank.value?.weeklyScore != null) return '주간 점수'
  return '점수'
})

const rankDisplay = computed(() => {
  if (!myRank.value?.rank) return '—'
  return `${myRank.value.rank}위`
})

const loadStreak = () => {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY)
    const parsed = raw != null ? Number(raw) : NaN
    streakDays.value = Number.isFinite(parsed) && parsed >= 0 ? parsed : 3
  } catch {
    streakDays.value = 3
  }
}

onMounted(async () => {
  loadStreak()
  await Promise.all([questStore.fetchToday(), leaderboardStore.fetchLeaderboard({ size: 5 })])
})

const goDailyQuest = () => {
  router.push({ name: 'daily-quest' })
}
</script>

<template>
  <div
    class="memo-selectable relative w-full max-w-[346px] rotate-[0.4deg]"
    role="button"
    tabindex="0"
    aria-label="오늘의 일일 퀘스트로 이동"
    @click="goDailyQuest"
    @keydown.enter="goDailyQuest"
  >
    <MemoPin side="center" tone="quest" />

    <section
      class="relative overflow-hidden rounded-[3px] border-[0.5px] border-[var(--study-quest-border)] bg-[var(--study-quest-surface)] shadow-[0_4px_10px_rgba(0,0,0,0.28)]"
      aria-label="오늘의 일일 퀘스트"
    >
      <div class="relative flex flex-col gap-2.5 px-3.5 py-3 pt-4">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="font-serif text-[14px] font-bold text-black/55">오늘의 일일 퀘스트</p>
            <p class="mt-0.5 font-serif text-[10px] text-[rgba(139,100,60,0.8)]">
              {{ questStatusLabel }}
            </p>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-1">
            <span
              class="inline-flex items-center gap-1 rounded-full border-[0.5px] border-[rgba(196,92,42,0.35)] bg-[#fff6ef] px-2 py-0.5"
              :aria-label="`${streakDays}일 연속`"
            >
              <span
                class="font-serif text-[9px] font-bold tracking-wide text-[var(--study-quest-continue)]"
              >
                연속
              </span>
              <span class="font-serif text-[13px] leading-none text-[var(--study-quest-continue)]">
                {{ streakDays }}일
              </span>
            </span>
            <button
              type="button"
              class="rounded px-1.5 py-0.5 font-serif text-[13px] font-bold whitespace-nowrap text-[var(--study-quest-continue)]"
              @click.stop="goDailyQuest"
            >
              {{ questCtaLabel }}
            </button>
          </div>
        </div>

        <BaseLoading
          v-if="isLoading"
          class="py-4 text-center"
          tone="onLight"
          size="xs"
          message="불러오는 중…"
        />

        <p
          v-else-if="questError"
          class="font-serif text-[11px] text-[var(--study-total)]"
          role="alert"
        >
          {{ questError }}
        </p>

        <template v-else>
          <!-- 진행도 -->
          <div>
            <div class="flex items-end justify-between gap-2">
              <p class="font-serif text-[10px] font-bold text-[rgba(139,100,60,0.75)]">진행도</p>
              <p
                class="font-serif font-bold text-[16px] leading-none text-[var(--study-quest-continue)]"
              >
                {{ progressLabel || `0/${totalCount || 5}` }}
              </p>
            </div>
            <div
              class="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[rgba(196,92,42,0.18)]"
              role="progressbar"
              :aria-valuenow="progressPercent"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="`일일 퀘스트 ${progressPercent}%`"
            >
              <div
                class="h-full rounded-full bg-[var(--study-quest-continue)] transition-[width] duration-300"
                :style="{ width: `${progressPercent}%` }"
              />
            </div>
          </div>

          <!-- 점수 · 순위 -->
          <div
            class="grid grid-cols-2 gap-2 rounded-[6px] border-[0.5px] border-[rgba(196,92,42,0.28)] bg-[rgba(255,255,255,0.45)] px-3 py-2.5"
          >
            <div>
              <p class="font-serif text-[9px] text-[rgba(139,100,60,0.7)]">{{ scoreHint }}</p>
              <p class="mt-0.5 font-serif font-bold text-[18px] leading-none text-[#3d1f08]">
                {{ scoreDisplay }}
                <span class="font-serif text-[10px] font-bold">점</span>
              </p>
            </div>
            <div class="text-right">
              <p class="font-serif text-[9px] text-[rgba(139,100,60,0.7)]">내 순위</p>
              <p class="mt-0.5 font-serif font-bold text-[18px] leading-none text-[#3d1f08]">
                {{ rankDisplay }}
              </p>
            </div>
          </div>

          <p class="font-serif text-[8px] text-[var(--study-score-label)]">
            매일 5문제 · 정답 수만큼 포인트 · 연속 출석 {{ streakDays }}일
          </p>
        </template>
      </div>
    </section>
  </div>
</template>
