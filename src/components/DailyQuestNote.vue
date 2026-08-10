<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getDashboard } from '@/services/dashboardService.js'
import checkboxInProgress from '@/assets/study/checkbox-in-progress.svg'
import BaseLoading from '@/components/BaseLoading.vue'
import MemoPin from '@/components/MemoPin.vue'

const router = useRouter()

/** @type {import('vue').Ref<import('@/types/portfolio.js').DashboardDailyQuest | null>} */
const dailyQuest = ref(null)
const dailyQuestError = ref('')
const isLoading = ref(false)

const fetchDailyQuestProgress = async () => {
  if (isLoading.value) return
  isLoading.value = true
  dailyQuestError.value = ''
  try {
    const { data } = await getDashboard()
    dailyQuest.value = data.dailyQuest
  } catch (err) {
    dailyQuest.value = null
    dailyQuestError.value = err?.message || '일일 퀘스트 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDailyQuestProgress()
})

/** @returns {{ index: number, label: string, done: boolean, current: boolean }[]} */
const questSteps = computed(() => {
  const total = dailyQuest.value?.totalCount ?? 5
  const answered = dailyQuest.value?.answeredCount ?? 0
  const status = dailyQuest.value?.status

  return Array.from({ length: total }, (_, i) => {
    const index = i + 1
    const done = status === 'COMPLETED' || index <= answered
    const current = status !== 'COMPLETED' && index === answered + 1
    return { index, label: `#${index}`, done, current }
  })
})

const questStatusLabel = computed(() => {
  if (isLoading.value && !dailyQuest.value) return '불러오는 중'
  const status = dailyQuest.value?.status
  if (status === 'COMPLETED') return '오늘 퀘스트 완료'
  if (status === 'IN_PROGRESS') return '진행 중'
  if (status === 'ASSIGNED' || status === 'NOT_STARTED') return '아직 시작 전'
  return '불러오는 중'
})

const questCtaLabel = computed(() => {
  const status = dailyQuest.value?.status
  if (status === 'COMPLETED') return '결과 보기 →'
  if (status === 'IN_PROGRESS') return '이어하기 →'
  return '시작하기 →'
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
      class="relative overflow-hidden rounded-[3px] border-[0.8px] border-[var(--study-quest-border)] bg-[var(--study-quest-surface)] shadow-[0_4px_10px_rgba(0,0,0,0.28)]"
      aria-label="오늘의 일일 퀘스트"
    >
      <div class="relative flex flex-col gap-1.5 px-3.5 py-3 pt-4">
        <p class="font-serif text-[14px] font-bold text-black/55">오늘의 일일 퀘스트</p>

        <BaseLoading
          v-if="isLoading && !dailyQuest"
          class="py-4 text-center"
          tone="onLight"
          size="xs"
          message="불러오는 중…"
        />

        <p
          v-else-if="dailyQuestError"
          class="font-serif text-[11px] text-[var(--study-total)]"
          role="alert"
        >
          {{ dailyQuestError }}
        </p>

        <template v-else>
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <p class="font-serif text-[10px] text-[rgba(139,100,60,0.8)]">
                  {{ questStatusLabel }}
                </p>
                <button
                  type="button"
                  class="shrink-0 rounded px-1.5 py-0.5 font-serif text-[14px] font-bold whitespace-nowrap text-[var(--study-quest-continue)]"
                  @click.stop="goDailyQuest"
                >
                  {{ questCtaLabel }}
                </button>
              </div>
              <ul
                class="mt-1.5 flex items-start justify-between gap-1"
                aria-label="일일 퀘스트 진행"
              >
                <li
                  v-for="step in questSteps"
                  :key="step.index"
                  class="flex items-center justify-center gap-2"
                >
                  <span
                    class="font-serif text-[9px] leading-none"
                    :class="
                      step.done || step.current
                        ? 'font-bold text-[var(--study-quest-continue)]'
                        : 'text-[rgba(139,100,60,0.5)]'
                    "
                  >
                    {{ step.label }}
                  </span>
                  <span
                    v-if="step.done"
                    class="flex size-[14px] items-center justify-center rounded-[2px] bg-[var(--study-quest-continue)]"
                    aria-hidden="true"
                  >
                    <span class="font-pen text-[11px] leading-none text-white">✓</span>
                  </span>
                  <img
                    v-else-if="step.current"
                    :src="checkboxInProgress"
                    alt=""
                    class="size-[14px]"
                  />
                  <span
                    v-else
                    class="size-[14px] rounded-[2px] border-[1.5px] border-[rgba(196,92,42,0.55)]"
                    aria-hidden="true"
                  />
                </li>
              </ul>
            </div>
          </div>
          <p class="mt-1 font-serif text-[8px] text-[var(--study-score-label)]">
            매일 5문제 · 정답 수만큼 포인트
          </p>
        </template>
      </div>
    </section>
  </div>
</template>
