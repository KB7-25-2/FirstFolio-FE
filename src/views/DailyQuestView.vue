<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import roomBg from '@/assets/learning/scenario/room-bg.jpg'
import penguin from '@/assets/learning/scenario/penguin.png'
import ScenarioClipboardBoard from '@/components/learning/ScenarioClipboardBoard.vue'
import ScenarioPersonaCard from '@/components/learning/ScenarioPersonaCard.vue'
import ScenarioMarketBar from '@/components/learning/ScenarioMarketBar.vue'
import DailyQuestHubPanel from '@/components/dailyQuest/DailyQuestHubPanel.vue'
import DailyQuestPlayPanel from '@/components/dailyQuest/DailyQuestPlayPanel.vue'
import DailyQuestResultPanel from '@/components/dailyQuest/DailyQuestResultPanel.vue'
import { useDailyQuestStore } from '@/store/dailyQuestStore.js'
import { useLeaderboardStore } from '@/store/leaderboardStore.js'

const PAGE_SIZE = 20
const COLLAPSED_COUNT = 20

const router = useRouter()
const leaderboardStore = useLeaderboardStore()
const questStore = useDailyQuestStore()

const {
  items: rankItems,
  myRank,
  isLoading,
  error,
  questDate: leaderboardDate,
  nextCursor,
} = storeToRefs(leaderboardStore)

const {
  isIntro,
  isPlay,
  isResult,
  isLoading: questLoading,
  currentSnapshot,
  isCurrentScenario,
  questionNumber,
  totalCount,
  questDate,
  error: questError,
} = storeToRefs(questStore)

/** dashboard | quest */
const shell = ref('dashboard')
const isRankingExpanded = ref(false)
const currentPage = ref(1)

onMounted(() => {
  leaderboardStore.fetchLeaderboard()
})

watch(isRankingExpanded, (expanded) => {
  if (!expanded) currentPage.value = 1
})

const goHome = () => {
  router.push({ name: 'home' })
}

const headerSubtitle = computed(() =>
  shell.value === 'quest' ? '회사의 주인이 되다' : '오늘은 내가 금융왕',
)

const headerStamp = computed(() => {
  if (shell.value !== 'quest') return '챌린지'
  if (isResult.value) return '결과'
  if (isPlay.value) return `${questionNumber.value}/${totalCount.value || 5}`
  return '챌린지'
})

const clipboardTitle = computed(() => {
  if (shell.value === 'dashboard') {
    return isRankingExpanded.value ? '명예 상담사 랭킹' : '대 시 보 드'
  }
  if (isResult.value) return ''
  if (isPlay.value) {
    if (isCurrentScenario.value) {
      return currentSnapshot.value?.scenarioJson?.paperTitle || '포트폴리오 추천서'
    }
    return '시험지'
  }
  return '오늘의 퀘스트'
})

const scenarioJson = computed(() => currentSnapshot.value?.scenarioJson ?? null)
const scenarioPersona = computed(() => scenarioJson.value?.persona ?? null)

const showClientScene = computed(
  () => shell.value === 'quest' && isPlay.value && isCurrentScenario.value && scenarioPersona.value,
)

/** 시나리오 풀이만 프로필 카드용 풀 높이, 그 외(대시보드·결과)는 짧은 룸 */
const showRoomScene = computed(() => {
  if (shell.value === 'dashboard') return !isRankingExpanded.value
  if (showClientScene.value) return true
  if (isResult.value) return true
  return false
})

const roomSceneHeightClass = computed(() => (showClientScene.value ? 'h-[152px]' : 'h-[90px]'))

const roomSceneMaxClass = computed(() => (showClientScene.value ? 'max-h-[160px]' : 'max-h-[30%]'))

const showMarketBar = computed(() => shell.value === 'quest' && showClientScene.value)

const marketTitle = computed(() => scenarioJson.value?.market?.title || '오늘의 금융 시황')

const marketBullets = computed(() => scenarioJson.value?.market?.bullets ?? [])

const marketConstraints = computed(() => scenarioJson.value?.constraints ?? [])

const marketDateLabel = computed(() => {
  if (questDate.value) {
    const [y, m, d] = questDate.value.split('-')
    if (y && m && d) return `${y}.${m}.${d}`
  }
  return formatDotDate()
})

const progressWidth = computed(() => {
  if (shell.value !== 'quest') return '33%'
  if (isResult.value) return '100%'
  if (isPlay.value) {
    const total = totalCount.value || 5
    return `${Math.round((questionNumber.value / total) * 100)}%`
  }
  return '50%'
})

const totalPages = computed(() => Math.max(1, Math.ceil(rankItems.value.length / PAGE_SIZE)))

const collapsedRanks = computed(() => rankItems.value.slice(0, COLLAPSED_COUNT))

const pagedRanks = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return rankItems.value.slice(start, start + PAGE_SIZE)
})

const pageLabel = computed(() => `${currentPage.value} / ${totalPages.value}`)

const canGoPrev = computed(() => currentPage.value > 1)
const canGoNext = computed(() => currentPage.value < totalPages.value || nextCursor.value != null)

const myScoreLabel = computed(() => {
  if (!myRank.value) return '—'
  return `${myRank.value.score.toLocaleString('ko-KR')} 점`
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
  if (leaderboardDate.value) {
    const [y, m, d] = leaderboardDate.value.split('-')
    if (y && m && d) return `${y}. ${m}. ${d}`
  }
  return formatDotDate()
})

/**
 * @param {number} rank
 */
const rankScoreClass = (rank) =>
  rank === 1 ? 'font-bold text-[#c17f24]' : 'font-bold text-[#3d1f08]'

const toggleRanking = () => {
  isRankingExpanded.value = !isRankingExpanded.value
}

const goPrevPage = () => {
  if (!canGoPrev.value) return
  currentPage.value -= 1
}

const goNextPage = async () => {
  if (!canGoNext.value) return
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1
    return
  }
  await leaderboardStore.loadMore(PAGE_SIZE)
  currentPage.value += 1
}

const onChallenge = async () => {
  isRankingExpanded.value = false
  shell.value = 'quest'
  try {
    await questStore.fetchToday()
  } catch {
    // 스토어 error에 표시
  }
}

const backToDashboard = () => {
  shell.value = 'dashboard'
  leaderboardStore.fetchLeaderboard()
}

const onSelectItem = (index) => {
  questStore.openItem(index)
}

const onHubSubmit = async () => {
  try {
    await questStore.submitToday()
  } catch {
    // 스토어 error에 표시
  }
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden bg-[#1a1a2e]">
    <header class="shrink-0 bg-[#1a1a2e] px-4 pt-3 pb-2.5">
      <div class="flex items-center">
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded border-[0.5px] border-[rgba(245,237,217,0.45)] text-[#f5edd9]"
          aria-label="닫기"
          @click="goHome"
        >
          ✕
        </button>
        <div class="min-w-0 flex-1 text-center">
          <p class="font-serif text-[17px] font-black text-[#f5edd9]">일일 퀘스트</p>
          <p class="font-serif text-[13px] text-[rgba(245,237,217,0.55)]">{{ headerSubtitle }}</p>
        </div>
        <span
          class="rounded-[2px] border-[0.5px] border-[#c17f24] px-2 py-1 font-serif text-[12px] text-[#c17f24]"
        >
          {{ headerStamp }}
        </span>
      </div>
    </header>

    <div class="h-0.5 w-full shrink-0 bg-[#333347]">
      <div
        class="h-full bg-[#c17f24] transition-[width] duration-300"
        :style="{ width: progressWidth }"
      />
    </div>

    <div
      class="relative w-full shrink-0 overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
      :class="showRoomScene ? `${roomSceneMaxClass} opacity-100` : 'max-h-0 opacity-0'"
    >
      <div class="relative w-full" :class="roomSceneHeightClass">
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

        <template v-if="showClientScene && scenarioPersona">
          <div class="absolute bottom-1.5 left-1.5 z-[1]">
            <ScenarioPersonaCard
              :name="scenarioPersona.name"
              :age="scenarioPersona.age || ''"
              :job="scenarioPersona.job || ''"
              :monthly-income="scenarioPersona.monthlyIncome || ''"
              :monthly-saving="scenarioPersona.monthlySaving || ''"
            />
          </div>
          <div class="pointer-events-none absolute right-2 bottom-0 z-[2]">
            <div class="dq-penguin">
              <img
                :src="penguin"
                alt=""
                class="h-[112px] w-[150px] object-contain"
                width="150"
                height="112"
              />
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pt-1 pb-3">
        <ScenarioClipboardBoard :paper-title="clipboardTitle" fill>
          <Transition name="dq-panel" mode="out-in">
            <!-- 퀘스트: 로딩 -->
            <div
              v-if="shell === 'quest' && questLoading"
              key="quest-loading"
              class="flex min-h-0 flex-1 items-center justify-center py-8"
            >
              <p class="font-serif text-[12px] text-[rgba(139,100,60,0.55)]">
                오늘의 퀘스트를 불러오는 중…
              </p>
            </div>

            <!-- 퀘스트: 허브 (유형 확인·문항 선택) -->
            <DailyQuestHubPanel
              v-else-if="shell === 'quest' && isIntro"
              key="quest-hub"
              @select="onSelectItem"
              @submit="onHubSubmit"
              @back="backToDashboard"
            />

            <!-- 퀘스트: 풀이 -->
            <DailyQuestPlayPanel
              v-else-if="shell === 'quest' && isPlay"
              key="quest-play"
              @back="questStore.backToHub()"
            />

            <!-- 퀘스트: 결과 -->
            <DailyQuestResultPanel
              v-else-if="shell === 'quest' && isResult"
              key="quest-result"
              @dashboard="backToDashboard"
            />

            <!-- 대시보드: 펼침 랭킹 -->
            <div
              v-else-if="isRankingExpanded"
              key="ranking"
              class="flex min-h-0 flex-1 flex-col gap-2 pt-1"
            >
              <button
                type="button"
                class="flex w-full shrink-0 items-center gap-2"
                :aria-expanded="true"
                @click="toggleRanking"
              >
                <div class="h-px flex-1 bg-[rgba(61,31,8,0.2)]" />
                <p class="shrink-0 font-serif text-[11px] font-bold text-[rgba(61,31,8,0.7)]">
                  명예 상담사 랭킹
                  <span class="ml-1 text-[10px] font-bold text-[#c17f24]">접기 ⌃</span>
                </p>
                <div class="h-px flex-1 bg-[rgba(61,31,8,0.2)]" />
              </button>

              <div
                class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border-[0.5px] border-[rgba(139,100,60,0.18)] bg-[rgba(255,255,255,0.28)]"
              >
                <div class="min-h-0 flex-1 overflow-y-auto px-2.5 py-2">
                  <ol v-if="pagedRanks.length" class="flex flex-col gap-2.5">
                    <li
                      v-for="item in pagedRanks"
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
                        {{ item.score.toLocaleString('ko-KR') }} 점
                      </span>
                    </li>
                  </ol>
                  <p
                    v-else
                    class="py-3 text-center font-serif text-[11px] text-[rgba(139,100,60,0.55)]"
                  >
                    아직 순위 데이터가 없어요.
                  </p>
                </div>

                <div
                  v-if="rankItems.length > PAGE_SIZE"
                  class="flex shrink-0 items-center justify-between gap-2 border-t border-[rgba(139,100,60,0.18)] px-2.5 py-2"
                >
                  <button
                    type="button"
                    class="rounded px-2 py-1 font-serif text-[11px] font-bold text-[#3d1f08] disabled:opacity-35"
                    :disabled="!canGoPrev"
                    @click.stop="goPrevPage"
                  >
                    ← 이전
                  </button>
                  <p class="font-serif text-[11px] text-[rgba(61,31,8,0.65)]">{{ pageLabel }}</p>
                  <button
                    type="button"
                    class="rounded px-2 py-1 font-serif text-[11px] font-bold text-[#3d1f08] disabled:opacity-35"
                    :disabled="!canGoNext"
                    @click.stop="goNextPage"
                  >
                    다음 →
                  </button>
                </div>
              </div>
            </div>

            <!-- 대시보드: 요약 + CTA -->
            <div v-else key="dashboard" class="flex min-h-0 flex-1 flex-col pt-1">
              <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain">
                <div
                  class="flex items-center justify-between border-b border-[rgba(139,100,60,0.2)] pb-2 font-serif text-[10px] text-[rgba(61,31,8,0.55)]"
                >
                  <span>제 2024-대시-001 호</span>
                  <span>{{ docDateLabel }}</span>
                </div>

                <div class="flex items-center gap-2 py-1">
                  <div class="h-px flex-1 bg-[rgba(61,31,8,0.25)]" />
                  <span class="size-1 shrink-0 rounded-full bg-[rgba(61,31,8,0.35)]" />
                  <h2
                    class="shrink-0 font-serif text-[18px] font-black tracking-wide text-[#3d1f08]"
                  >
                    일일 퀘스트
                  </h2>
                  <span class="size-1 shrink-0 rounded-full bg-[rgba(61,31,8,0.35)]" />
                  <div class="h-px flex-1 bg-[rgba(61,31,8,0.25)]" />
                </div>

                <p
                  class="rounded-[8px] border-[0.5px] border-[rgba(139,100,60,0.18)] bg-[rgba(255,255,255,0.35)] px-3 py-2.5 font-serif text-[11px] leading-[1.55] text-[rgba(61,31,8,0.75)]"
                >
                  실전 고객 상담 게임으로 포트폴리오 추천 역량을 검증하고, 점수를 쌓아 명예 상담사
                  랭킹에 도전하십시오.
                </p>

                <div
                  v-if="isLoading"
                  class="py-6 text-center font-serif text-[12px] text-[rgba(139,100,60,0.55)]"
                >
                  순위를 불러오는 중…
                </div>

                <div
                  v-else-if="error"
                  class="rounded-[8px] border-[0.5px] border-[rgba(213,42,45,0.35)] bg-[rgba(213,42,45,0.08)] px-3 py-3 text-center"
                >
                  <p class="font-serif text-[11px] text-[#d52a2d]">{{ error }}</p>
                  <button
                    type="button"
                    class="mt-2 font-serif text-[11px] font-bold text-[#c17f24]"
                    @click="leaderboardStore.fetchLeaderboard()"
                  >
                    다시 시도
                  </button>
                </div>

                <template v-else>
                  <div
                    class="grid grid-cols-2 gap-2 rounded-[10px] border-[0.5px] border-[rgba(139,100,60,0.22)] bg-[rgba(255,255,255,0.4)] px-3 py-3"
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

                  <button
                    type="button"
                    class="flex w-full items-center gap-2 pt-1"
                    :aria-expanded="false"
                    @click="toggleRanking"
                  >
                    <div class="h-px flex-1 bg-[rgba(61,31,8,0.2)]" />
                    <p class="shrink-0 font-serif text-[11px] font-bold text-[rgba(61,31,8,0.7)]">
                      명예 상담사 랭킹
                      <span class="ml-1 text-[10px] font-bold text-[#c17f24]">펼치기 ⌄</span>
                    </p>
                    <div class="h-px flex-1 bg-[rgba(61,31,8,0.2)]" />
                  </button>
                  <div
                    class="overflow-y-auto rounded-[10px] border-[0.5px] border-[rgba(139,100,60,0.18)] bg-[rgba(255,255,255,0.28)] p-2.5"
                  >
                    <ol v-if="collapsedRanks.length" class="flex flex-col gap-2">
                      <li
                        v-for="item in collapsedRanks"
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
                          {{ item.score.toLocaleString('ko-KR') }} 점
                        </span>
                      </li>
                    </ol>
                    <p
                      v-else
                      class="py-3 text-center font-serif text-[11px] text-[rgba(139,100,60,0.55)]"
                    >
                      아직 순위 데이터가 없어요.
                    </p>
                  </div>
                </template>

                <p
                  v-if="shell === 'dashboard' && questError"
                  class="font-serif text-[11px] text-[#d52a2d]"
                >
                  {{ questError }}
                </p>
              </div>

              <button
                type="button"
                class="mt-2 flex h-12 w-full shrink-0 items-center justify-center rounded-[10px] bg-[#c17f24] font-serif text-[15px] font-bold text-[#fff8ec]"
                @click="onChallenge"
              >
                도전 하러가기 →
              </button>
            </div>
          </Transition>
        </ScenarioClipboardBoard>
      </div>

      <ScenarioMarketBar
        v-if="showMarketBar"
        :title="marketTitle"
        :date="marketDateLabel"
        :bullets="marketBullets"
        :constraints="marketConstraints"
      />
    </div>
  </div>
</template>

<style scoped>
.dq-panel-enter-active,
.dq-panel-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.dq-panel-enter-from,
.dq-panel-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.dq-penguin {
  animation: dq-penguin-breath 2.8s ease-in-out infinite;
  transform-origin: center bottom;
  will-change: transform;
}

@keyframes dq-penguin-breath {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dq-penguin {
    animation: none;
  }
}
</style>
