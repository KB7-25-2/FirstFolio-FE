<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useStudyStore } from '@/store/studyStore.js'
import checkboxInProgress from '@/assets/study/checkbox-in-progress.svg'
import penguin from '@/assets/study/penguin.png'
import BaseLoading from '@/components/BaseLoading.vue'

const studyStore = useStudyStore()
const router = useRouter()
const { chapterTitle, learningItems, continueRoute, isLoading, error } = storeToRefs(studyStore)

onMounted(() => {
  studyStore.fetchStudyNote()
})

const checklistLabel = (item) => {
  const base = `${item.order}. ${item.title}`
  if (item.status === 'IN_PROGRESS') return `${base}  · 진행 중`
  return base
}

const ruledOffsets = computed(() => Array.from({ length: 12 }, (_, index) => 48 + index * 22))

/**
 * continue.route 문자열을 named route로 해석 (경로 변경에도 깨지지 않게)
 * @param {string} routePath
 */
const resolveContinueLocation = (routePath) => {
  const resolved = router.resolve(routePath)
  if (resolved.matched.length) {
    return {
      name: resolved.name,
      params: resolved.params,
      query: resolved.query,
    }
  }
  return { name: 'learning' }
}

const onContinue = (event) => {
  event.stopPropagation()
  if (!continueRoute.value) {
    router.push({ name: 'learning' })
    return
  }
  router.push(resolveContinueLocation(continueRoute.value))
}

const goLearning = () => {
  router.push({ name: 'learning' })
}
</script>

<template>
  <div class="relative w-full max-w-[346px]">
    <div
      class="memo-selectable relative z-10"
      role="button"
      tabindex="0"
      aria-label="현재 학습 현황으로 이동"
      @click="goLearning"
      @keydown.enter="goLearning"
    >
      <div
        class="pointer-events-none absolute top-[-8px] left-3 z-20 h-4 w-[70px] -rotate-[4deg] border-[0.5px] border-white/25 bg-[var(--study-tape)]"
        aria-hidden="true"
      />

      <div
        class="pointer-events-none absolute -top-5 -right-1 z-20 size-11 rotate-8 overflow-hidden rounded-[22px] border-[2.5px] border-white bg-[var(--study-sticker)] shadow-[0_3px_6px_rgba(0,0,0,0.3)]"
        aria-hidden="true"
      >
        <img
          :src="penguin"
          alt=""
          class="absolute top-[8px] left-[2px] h-[25px] w-[34px] object-cover"
        />
      </div>

      <section
        class="relative min-h-[220px] w-full -rotate-[0.9deg] overflow-hidden rounded-[3px] border-[0.8px] border-[var(--study-border)] bg-[var(--study-surface)] shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
        aria-label="현재 학습 현황"
      >
        <div class="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            v-for="top in ruledOffsets"
            :key="top"
            class="absolute left-0 h-px w-full bg-[var(--study-line)]"
            :style="{ top: `${top}px` }"
          />
        </div>
        <div class="relative flex min-h-[300px] flex-col gap-2 px-4 py-3">
          <BaseLoading
            v-if="isLoading"
            class="py-10 text-center"
            tone="onLight"
            size="xs"
            message="학습 현황을 불러오는 중…"
          />
          <div
            v-else-if="error"
            class="py-10 text-center font-serif text-xs text-[var(--study-total)]"
          >
            {{ error }}
          </div>

          <template v-else>
            <header class="flex h-9 items-end gap-2">
              <h2 class="min-w-0 flex-1 font-pen text-[26px] leading-none text-[#212b5c]">
                {{ chapterTitle || '학습 현황' }}
              </h2>
              <button
                v-if="continueRoute"
                type="button"
                class="study-continue-cta shrink-0 rounded px-1.5 py-0.5 font-serif text-[14px] font-bold whitespace-nowrap text-[var(--study-continue)]"
                @click.stop="onContinue"
              >
                이어서 →
              </button>
            </header>

            <p class="font-serif text-[9px] text-[var(--study-muted)]">학습 진행 체크리스트</p>

            <ul class="flex flex-col gap-1 py-0.5">
              <li
                v-for="item in learningItems"
                :key="item.subChapterId"
                class="flex items-center gap-2 py-0.5"
              >
                <span
                  v-if="item.status === 'COMPLETED'"
                  class="flex size-[14px] shrink-0 items-center justify-center rounded-[2px] bg-[var(--study-check)]"
                  aria-hidden="true"
                >
                  <span class="font-pen text-[12px] leading-none text-white">✓</span>
                </span>

                <img
                  v-else-if="item.status === 'IN_PROGRESS'"
                  :src="checkboxInProgress"
                  alt=""
                  class="size-[14px] shrink-0"
                />

                <span
                  v-else
                  class="size-[14px] shrink-0 rounded-[2px] border-[1.5px] border-[var(--study-check)]"
                  aria-hidden="true"
                />

                <span
                  class="min-w-0 flex-1 font-serif leading-normal"
                  :class="{
                    'text-[11px] text-[var(--study-faint)] line-through':
                      item.status === 'COMPLETED',
                    'text-[12px] font-bold whitespace-pre-wrap text-[var(--study-ink)]':
                      item.status === 'IN_PROGRESS',
                    'text-[11px] text-[var(--study-todo)]': item.status === 'NOT_STARTED',
                  }"
                >
                  {{ checklistLabel(item) }}
                </span>
              </li>
            </ul>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>
