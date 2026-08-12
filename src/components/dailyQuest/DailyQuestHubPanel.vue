<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDailyQuestStore } from '@/store/dailyQuestStore.js'
import { DAILY_QUEST_QUESTION_TYPE_LABELS } from '@/services/dailyQuestService.js'

defineEmits(['select', 'submit', 'back'])

const store = useDailyQuestStore()
const {
  items,
  questionTypeSummary,
  progressLabel,
  answeredCount,
  totalCount,
  canSubmit,
  isSubmitting,
  isCompleted,
  error,
} = storeToRefs(store)

/**
 * @param {import('@/types/dailyQuest.js').DailyQuestItem} item
 */
const typeLabel = (item) => {
  const type = item.questionSnapshot?.questionType
  return type ? (DAILY_QUEST_QUESTION_TYPE_LABELS[type] ?? type) : '문항'
}

/**
 * @param {import('@/types/dailyQuest.js').DailyQuestItem} item
 */
const sourceLabel = (item) => {
  const map = {
    GENERAL: '일반',
    WRONG_RETRY: '오답 복습',
    NEWS: '뉴스',
  }
  return map[item.sourceType] ?? item.sourceType
}

/**
 * @param {import('@/types/dailyQuest.js').DailyQuestItem} item
 */
const previewText = (item) => {
  const snap = item.questionSnapshot
  if (!snap) return ''
  if (snap.questionType === 'SCENARIO' && snap.scenarioJson?.narrative) {
    return snap.scenarioJson.narrative
  }
  return snap.prompt
}

const submitLabel = computed(() => {
  if (isCompleted.value) return '결과 보기'
  if (canSubmit.value) return '최종 제출하기'
  return `답안 저장 ${answeredCount.value}/${totalCount.value || 5}`
})
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col pt-1">
    <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain pb-1">
      <div
        class="flex items-center justify-between border-b border-[rgba(139,100,60,0.2)] pb-2 font-serif text-[10px] text-[rgba(61,31,8,0.55)]"
      >
        <span>오늘의 5문제</span>
        <span>{{ progressLabel }}</span>
      </div>

      <div class="flex items-center gap-2 py-0.5">
        <div class="h-px flex-1 bg-[rgba(61,31,8,0.25)]" />
        <h2 class="shrink-0 font-serif text-[16px] font-black tracking-wide text-[#3d1f08]">
          문제 유형 확인
        </h2>
        <div class="h-px flex-1 bg-[rgba(61,31,8,0.25)]" />
      </div>

      <p class="font-serif text-[11px] leading-[1.55] text-[rgba(61,31,8,0.75)]">
        객관식·시나리오가 섞여 배정됩니다. 풀고 싶은 문제를 골라 진행하세요.
      </p>

      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="row in questionTypeSummary"
          :key="row.questionType"
          class="rounded-[4px] border-[0.5px] border-[rgba(193,127,36,0.45)] bg-[rgba(193,127,36,0.12)] px-2 py-1 font-serif text-[11px] font-bold text-[#8b5014]"
        >
          {{ row.label }} {{ row.count }}
        </span>
      </div>

      <ul class="flex flex-col gap-2">
        <li v-for="(item, index) in items" :key="item.dailyQuestItemId">
          <button
            type="button"
            class="flex w-full flex-col gap-1.5 rounded-[10px] border-[0.5px] px-3 py-2.5 text-left transition-colors"
            :class="
              item.userAnswer
                ? 'border-[rgba(61,122,74,0.45)] bg-[rgba(61,122,74,0.08)]'
                : 'border-[rgba(139,100,60,0.22)] bg-[rgba(255,255,255,0.4)]'
            "
            @click="$emit('select', index)"
          >
            <div class="flex items-center gap-2">
              <span class="font-serif text-[13px] font-black text-[#3d1f08]">
                {{ item.displayOrder }}번
              </span>
              <span
                class="rounded border-[0.5px] border-[rgba(139,100,60,0.3)] px-1.5 py-0.5 font-serif text-[10px] font-bold text-[#8b5014]"
              >
                {{ typeLabel(item) }}
              </span>
              <span class="font-serif text-[10px] text-[rgba(139,100,60,0.65)]">
                {{ sourceLabel(item) }}
              </span>
              <span
                class="ml-auto font-serif text-[10px] font-bold"
                :class="item.userAnswer ? 'text-[#3d7a4a]' : 'text-[rgba(139,100,60,0.55)]'"
              >
                {{ item.userAnswer ? '저장됨' : '미응답' }}
              </span>
            </div>
            <p class="line-clamp-2 font-serif text-[12px] leading-[1.45] text-[rgba(61,31,8,0.8)]">
              {{ previewText(item) }}
            </p>
          </button>
        </li>
      </ul>

      <p v-if="error" class="font-serif text-[11px] text-[#d52a2d]">{{ error }}</p>
    </div>

    <div class="mt-2 flex shrink-0 flex-col gap-2">
      <button
        type="button"
        class="flex h-12 w-full items-center justify-center rounded-[10px] font-serif text-[15px] font-bold disabled:opacity-40"
        :class="
          canSubmit || isCompleted
            ? 'bg-[#c17f24] text-[#fff8ec]'
            : 'bg-[rgba(139,100,60,0.2)] text-[rgba(61,31,8,0.45)]'
        "
        :disabled="(!canSubmit && !isCompleted) || isSubmitting"
        @click="$emit('submit')"
      >
        {{ isSubmitting ? '제출 중…' : submitLabel }}
      </button>
      <button
        type="button"
        class="font-serif text-[12px] font-bold text-[rgba(61,31,8,0.55)]"
        @click="$emit('back')"
      >
        ← 대시보드로
      </button>
    </div>
  </div>
</template>
