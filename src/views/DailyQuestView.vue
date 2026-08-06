<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import roomBg from '@/assets/learning/scenario/room-bg.jpg'
import ScenarioClipboardBoard from '@/components/learning/ScenarioClipboardBoard.vue'
import { useLeaderboardStore } from '@/store/leaderboardStore.js'

const router = useRouter()
const leaderboardStore = useLeaderboardStore()
const { items, myRank, isLoading, error, isSnapshotMissing, snapshotDate } =
  storeToRefs(leaderboardStore)

onMounted(() => {
  leaderboardStore.fetchLeaderboard({ size: 20 })
})

const goHome = () => {
  router.push({ name: 'home' })
}

const topRanks = computed(() => items.value.slice(0, 3))

const myScoreLabel = computed(() => {
  if (!myRank.value) return '—'
  return `${myRank.value.weeklyScore.toLocaleString('ko-KR')} 점`
})

const myRankLabel = computed(() => {
  if (!myRank.value) return '—'
  return `${myRank.value.rank}위`
})

const formatDotDate = (date = new Date()) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}. ${m}. ${d}`
}

const docDateLabel = computed(() => {
  if (snapshotDate.value) {
    const [y, m, d] = snapshotDate.value.split('-')
    if (y && m && d) return `${y}. ${m}. ${d}`
  }
  return formatDotDate()
})

/**
 * @param {number} rank
 */
const rankScoreClass = (rank) =>
  rank === 1 ? 'font-bold text-[#c17f24]' : 'font-bold text-[#3d1f08]'

const onChallenge = () => {
  // 풀이 플로우는 후속 이슈 — 대시보드 CTA만 우선 배치
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden bg-[#1a1a2e]">
    <header class="shrink-0 bg-[#1a1a2e] px-4 pt-3 pb-2.5">
      <div class="flex items-center">
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded border-[1.25px] border-[rgba(245,237,217,0.45)] text-[#f5edd9]"
          aria-label="닫기"
          @click="goHome"
        >
          ✕
        </button>
        <div class="min-w-0 flex-1 text-center">
          <p class="font-serif text-[17px] font-black text-[#f5edd9]">일일 퀘스트</p>
          <p class="font-pen text-[13px] text-[rgba(245,237,217,0.55)]">오늘은 내가 금융왕</p>
        </div>
        <span
          class="rounded-[2px] border-[1.5px] border-[#c17f24] px-2 py-1 font-pen text-[12px] text-[#c17f24]"
        >
          챌린지
        </span>
      </div>
    </header>

    <div class="h-0.5 w-full shrink-0 bg-[#333347]">
      <div class="h-full w-[33%] bg-[#c17f24]" />
    </div>

    <div class="relative h-[130px] w-full shrink-0 overflow-hidden">
      <img :src="roomBg" alt="" class="absolute inset-0 size-full object-cover" />
      <div
        class="absolute inset-0 bg-gradient-to-b from-[rgba(15,20,40,0.3)] to-[rgba(15,20,40,0.7)]"
      />
      <div class="absolute inset-x-0 top-0 flex justify-center">
        <span
          class="rounded-full border-[0.8px] border-[rgba(255,214,0,0.3)] bg-[rgba(255,214,0,0.15)] px-2.5 py-1 text-[10px] font-bold text-[#ffd600]"
        >
          투자 상담실 · 실전 게임
        </span>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-3 pt-1 pb-3">
      <ScenarioClipboardBoard paper-title="대 시 보 드">
        <div class="flex flex-col gap-3 pt-1">
          <div
            class="flex items-center justify-between border-b border-[rgba(139,100,60,0.2)] pb-2 font-serif text-[10px] text-[rgba(61,31,8,0.55)]"
          >
            <span>제 2024-대시-001 호</span>
            <span>{{ docDateLabel }}</span>
          </div>

          <div class="flex items-center gap-2 py-1">
            <div class="h-px flex-1 bg-[rgba(61,31,8,0.25)]" />
            <span class="size-1 shrink-0 rounded-full bg-[rgba(61,31,8,0.35)]" />
            <h2 class="shrink-0 font-serif text-[18px] font-black tracking-wide text-[#3d1f08]">
              일일 퀘스트
            </h2>
            <span class="size-1 shrink-0 rounded-full bg-[rgba(61,31,8,0.35)]" />
            <div class="h-px flex-1 bg-[rgba(61,31,8,0.25)]" />
          </div>

          <p
            class="rounded-[8px] border border-[rgba(139,100,60,0.18)] bg-[rgba(255,255,255,0.35)] px-3 py-2.5 font-serif text-[11px] leading-[1.55] text-[rgba(61,31,8,0.75)]"
          >
            실전 고객 상담 게임으로 포트폴리오 추천 역량을 검증하고, 점수를 쌓아 명예 상담사 랭킹에
            도전하십시오.
          </p>

          <div
            v-if="isLoading"
            class="py-6 text-center font-serif text-[12px] text-[rgba(139,100,60,0.55)]"
          >
            순위를 불러오는 중…
          </div>

          <div
            v-else-if="isSnapshotMissing"
            class="rounded-[8px] border border-dashed border-[rgba(139,100,60,0.35)] px-3 py-4 text-center"
          >
            <p class="font-serif text-[12px] font-bold text-[#3d1f08]">집계 준비 중</p>
            <p class="mt-1 font-serif text-[11px] text-[rgba(139,100,60,0.65)]">{{ error }}</p>
          </div>

          <div
            v-else-if="error"
            class="rounded-[8px] border border-[rgba(213,42,45,0.35)] bg-[rgba(213,42,45,0.08)] px-3 py-3 text-center"
          >
            <p class="font-serif text-[11px] text-[#d52a2d]">{{ error }}</p>
            <button
              type="button"
              class="mt-2 font-serif text-[11px] font-bold text-[#c17f24]"
              @click="leaderboardStore.fetchLeaderboard({ size: 20 })"
            >
              다시 시도
            </button>
          </div>

          <template v-else>
            <div
              class="grid grid-cols-2 gap-2 rounded-[10px] border border-[rgba(139,100,60,0.22)] bg-[rgba(255,255,255,0.4)] px-3 py-3"
            >
              <div>
                <p class="font-serif text-[10px] text-[rgba(139,100,60,0.65)]">내 점수</p>
                <p class="mt-1 font-serif text-[18px] font-black text-[#3d1f08]">
                  {{ myScoreLabel }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-serif text-[10px] text-[rgba(139,100,60,0.65)]">전체 랭킹</p>
                <p class="mt-1 font-serif text-[18px] font-black text-[#3d1f08]">
                  {{ myRankLabel }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <div class="h-px flex-1 bg-[rgba(61,31,8,0.2)]" />
              <p class="shrink-0 font-serif text-[11px] font-bold text-[rgba(61,31,8,0.7)]">
                명예 상담사 랭킹
              </p>
              <div class="h-px flex-1 bg-[rgba(61,31,8,0.2)]" />
            </div>

            <ol v-if="topRanks.length" class="flex flex-col gap-2">
              <li
                v-for="item in topRanks"
                :key="`${item.rank}-${item.nickname}`"
                class="flex items-center gap-2 font-serif text-[13px]"
              >
                <span class="w-8 shrink-0" :class="rankScoreClass(item.rank)">
                  {{ item.rank }}위
                </span>
                <span class="min-w-0 flex-1 truncate text-center text-[#3d1f08]">
                  {{ item.nickname }}
                </span>
                <span class="shrink-0" :class="rankScoreClass(item.rank)">
                  {{ item.weeklyScore.toLocaleString('ko-KR') }} 점
                </span>
              </li>
            </ol>
            <p v-else class="py-3 text-center font-serif text-[11px] text-[rgba(139,100,60,0.55)]">
              아직 순위 데이터가 없어요.
            </p>
          </template>

          <button
            type="button"
            class="mt-1 flex h-12 w-full items-center justify-center rounded-[10px] bg-[#c17f24] font-serif text-[15px] font-bold text-[#fff8ec]"
            @click="onChallenge"
          >
            도전 하러가기 →
          </button>
        </div>
      </ScenarioClipboardBoard>
    </div>
  </div>
</template>
