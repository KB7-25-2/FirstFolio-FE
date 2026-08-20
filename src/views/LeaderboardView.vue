<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useLeaderboardStore } from '@/store/leaderboardStore.js'

const router = useRouter()
const leaderboardStore = useLeaderboardStore()
const { items, myRank, questDate, nextCursor, isLoading, error } = storeToRefs(leaderboardStore)

onMounted(() => {
  leaderboardStore.fetchLeaderboard({ size: 50 })
})

const dayLabel = computed(() => {
  if (!questDate.value || !questDate.value) return ''
  return `${formatDateLabel(questDate.value)} ~ ${formatDateLabel(questDate.value)}`
})

/**
 * @param {string} isoDate YYYY-MM-DD
 */
const formatDateLabel = (isoDate) => {
  const [y, m, d] = isoDate.split('-')
  if (!y || !m || !d) return isoDate
  return `${Number(m)}.${Number(d)}`
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push({ name: 'home' })
}

/**
 * @param {number} rank
 */
const rankToneClass = (rank) => {
  if (rank === 1) return 'text-[#c17f24]'
  if (rank === 2) return 'text-[rgba(245,237,217,0.75)]'
  if (rank === 3) return 'text-[#c45c2a]'
  return 'text-[rgba(245,237,217,0.45)]'
}

/**
 * @param {import('@/types/leaderboard.js').LeaderboardItem} item
 */
const isMe = () => false
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden bg-[#0d1117]">
    <header class="shrink-0 px-5 pt-6 pb-3">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn-hover flex size-8 items-center justify-center rounded-md text-[rgba(245,237,217,0.55)] hover:bg-white/5 hover:text-[#f5edd9]"
          aria-label="뒤로가기"
          @click="goBack"
        >
          <span class="font-serif text-[18px] leading-none" aria-hidden="true">←</span>
        </button>
        <div class="min-w-0">
          <h1 class="font-serif text-[20px] font-black text-[#f5edd9]">오늘의 리더보드</h1>
          <p v-if="dayLabel" class="mt-0.5 font-serif text-[11px] text-[rgba(245,237,217,0.45)]">
            오늘 완료한 일일 퀘스트 점수 · {{ dayLabel }}
          </p>
        </div>
      </div>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-8">
      <div
        v-if="isLoading"
        class="py-16 text-center font-serif text-sm text-[rgba(245,237,217,0.5)]"
      >
        순위를 불러오는 중…
      </div>

      <div
        v-else-if="error"
        class="rounded-2xl border-[0.5px] border-[rgba(220,80,80,0.35)] bg-[rgba(220,80,80,0.1)] px-4 py-6 text-center"
      >
        <p class="font-serif text-[13px] text-[#f0b4b4]">{{ error }}</p>
        <button
          type="button"
          class="study-continue-cta mt-4 rounded px-3 py-1.5 font-serif text-[13px] font-bold text-[rgba(193,127,36,0.95)]"
          @click="leaderboardStore.fetchLeaderboard({ size: 50 })"
        >
          다시 시도
        </button>
      </div>

      <template v-else>
        <!-- 내 순위 -->
        <section
          v-if="myRank"
          class="mb-5 rounded-2xl border-[0.5px] border-[rgba(193,127,36,0.45)] bg-[rgba(193,127,36,0.12)] px-4 py-3"
          aria-label="내 순위"
        >
          <p class="font-serif text-[10px] font-bold tracking-wide text-[rgba(193,127,36,0.9)]">
            MY RANK
          </p>
          <div class="mt-1 flex items-end justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-serif text-[16px] font-bold text-[#f5edd9]">
                오늘의 일일 퀘스트
              </p>
              <p class="mt-0.5 font-serif text-[11px] text-[rgba(245,237,217,0.5)]">
                오늘 완료한 일일 퀘스트 점수
              </p>
            </div>
            <div class="shrink-0 text-right">
              <p class="font-serif font-bold text-[28px] leading-none text-[rgba(193,127,36,0.95)]">
                {{ myRank.rank }}
              </p>
              <p class="mt-1 font-serif text-[12px] font-bold text-[#f5edd9]">
                {{ myRank.score }}점
              </p>
            </div>
          </div>
        </section>

        <!-- 순위 목록 -->
        <section
          class="overflow-hidden rounded-[4px] border-[0.5px] border-[rgba(224,160,122,0.45)] bg-[var(--study-quest-surface)] shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
          aria-label="순위 목록"
        >
          <div
            class="flex items-center justify-between border-b border-[rgba(224,160,122,0.35)] px-3.5 py-2.5"
          >
            <p class="font-serif text-[11px] font-bold text-[rgba(61,31,8,0.7)]">전체 순위</p>
            <p class="font-serif text-[10px] text-[rgba(139,100,60,0.55)]">오늘 점수</p>
          </div>

          <ol v-if="items.length" class="divide-y divide-[rgba(224,160,122,0.25)]">
            <li
              v-for="item in items"
              :key="`${item.rank}-${item.nickname}`"
              class="flex items-center gap-3 px-3.5 py-2.5"
              :class="isMe(item) ? 'bg-[rgba(196,92,42,0.12)]' : ''"
            >
              <span
                class="w-7 shrink-0 text-center font-serif font-bold text-[20px] leading-none"
                :class="rankToneClass(item.rank)"
              >
                {{ item.rank }}
              </span>
              <span
                class="min-w-0 flex-1 truncate font-serif text-[13px]"
                :class="
                  isMe(item) ? 'font-bold text-[var(--study-quest-continue)]' : 'text-[#212b5c]'
                "
              >
                {{ item.nickname }}
                <span
                  v-if="isMe(item)"
                  class="ml-1 font-serif text-[10px] font-bold text-[var(--study-quest-continue)]"
                >
                  (나)
                </span>
              </span>
              <span class="shrink-0 font-serif text-[13px] font-bold text-[rgba(61,31,8,0.8)]">
                {{ item.score }}
              </span>
            </li>
          </ol>

          <p
            v-else
            class="px-3.5 py-8 text-center font-serif text-[12px] text-[rgba(139,100,60,0.55)]"
          >
            아직 순위 데이터가 없어요.
          </p>
        </section>

        <button
          v-if="nextCursor"
          type="button"
          class="study-continue-cta mt-4 w-full rounded px-3 py-2 font-serif text-[12px] font-bold text-[rgba(193,127,36,0.95)]"
          @click="leaderboardStore.loadMore(50)"
        >
          더 보기
        </button>
        <p class="mt-4 text-center font-serif text-[10px] text-[rgba(245,237,217,0.35)]">
          오늘 완료된 일일 퀘스트 점수 기준 · 실시간 순위
        </p>
      </template>
    </div>
  </div>
</template>
