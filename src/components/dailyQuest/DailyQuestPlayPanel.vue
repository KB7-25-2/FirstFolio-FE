<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import QuizExamPaper from '@/components/learning/QuizExamPaper.vue'
import QuizChoiceOption from '@/components/learning/QuizChoiceOption.vue'
import ScenarioClipboardQuestion from '@/components/learning/ScenarioClipboardQuestion.vue'
import ScenarioChoiceOption from '@/components/learning/ScenarioChoiceOption.vue'
import { useDailyQuestStore } from '@/store/dailyQuestStore.js'

const OPTION_TONES = ['green', 'blue', 'pink', 'yellow']

const emit = defineEmits(['back', 'saved'])

const store = useDailyQuestStore()
const {
  currentItem,
  currentSnapshot,
  currentQuestionTypeLabel,
  isCurrentScenario,
  isCurrentObjective,
  questionNumber,
  totalCount,
  currentSelectedKey,
  isSaving,
  error,
} = storeToRefs(store)

const localSelectedKey = ref(null)

watch(
  currentItem,
  (item) => {
    localSelectedKey.value = item?.userAnswer?.selectedKey ?? null
  },
  { immediate: true },
)

const scenarioNarrative = computed(() => currentSnapshot.value?.scenarioJson?.narrative || '')

const optionsWithTone = computed(() => {
  const options = currentSnapshot.value?.optionsJson ?? []
  return options.map((opt, i) => ({
    ...opt,
    tone: OPTION_TONES[i % OPTION_TONES.length],
  }))
})

const scenarioOptions = computed(() =>
  (currentSnapshot.value?.optionsJson ?? []).map((opt) => ({
    key: opt.key,
    label: opt.label,
    description: opt.description || '',
  })),
)

/**
 * @param {string} key
 */
const optionVariant = (key) => {
  if (localSelectedKey.value === key) return 'selected'
  return 'default'
}

/**
 * @param {string} key
 */
const onSelect = (key) => {
  localSelectedKey.value = key
}

const canSave = computed(() => Boolean(localSelectedKey.value) && !isSaving.value)

const primaryLabel = computed(() => {
  if (isSaving.value) return '저장 중…'
  if (isCurrentScenario.value) {
    return currentSelectedKey.value ? '답안 수정' : '답안 저장'
  }
  return currentSelectedKey.value ? '답안 수정·목록으로' : '답안 저장·목록으로'
})

const onSave = async () => {
  if (!localSelectedKey.value) return
  await store.saveAndReturnToHub(localSelectedKey.value)
  emit('saved')
}
</script>

<template>
  <div v-if="currentSnapshot" class="flex min-h-0 flex-1 flex-col pt-1">
    <!-- 소단원형: 목록 복귀 헤더 -->
    <div v-if="isCurrentObjective" class="mb-2 flex shrink-0 items-center justify-between gap-2">
      <button
        type="button"
        class="font-serif text-[12px] font-bold text-[rgba(61,31,8,0.6)]"
        @click="emit('back')"
      >
        ← 목록
      </button>
      <span
        class="rounded border-[0.5px] border-[rgba(193,127,36,0.45)] px-2 py-0.5 font-serif text-[10px] font-bold text-[#8b5014]"
      >
        {{ currentQuestionTypeLabel }} · {{ questionNumber }}/{{ totalCount }}
      </span>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
      <!-- 소단원형 객관식 -->
      <QuizExamPaper
        v-if="isCurrentObjective"
        exam-title="일일 퀘스트"
        :subject="currentQuestionTypeLabel"
        :question-index="questionNumber"
        :question-total="totalCount"
        :score-per-question="1"
      >
        <div class="flex gap-2">
          <p class="shrink-0 font-serif text-[13px] font-black text-[#29211a]">
            문 {{ questionNumber }}.
          </p>
          <p
            class="font-serif text-[14px] leading-[22px] font-bold whitespace-pre-line text-[#29211a]"
          >
            {{ currentSnapshot.prompt }}
          </p>
        </div>

        <div class="mt-5 flex flex-col gap-3">
          <QuizChoiceOption
            v-for="opt in optionsWithTone"
            :key="opt.key"
            :option-key="opt.key"
            :label="opt.label"
            :tone="opt.tone"
            :variant="optionVariant(opt.key)"
            :disabled="isSaving"
            @select="onSelect"
          />
        </div>
      </QuizExamPaper>

      <!-- 대단원형 시나리오 (Figma 1328) -->
      <ScenarioClipboardQuestion
        v-else-if="isCurrentScenario"
        :prompt="scenarioNarrative || currentSnapshot.prompt"
        scenario-label=""
      >
        <ScenarioChoiceOption
          v-for="opt in scenarioOptions"
          :key="opt.key"
          :option-key="opt.key"
          :label="opt.label"
          :description="opt.description"
          :variant="optionVariant(opt.key)"
          :disabled="isSaving"
          @select="onSelect"
        />

        <template #footer>
          <div class="mt-1 flex flex-col gap-2">
            <p v-if="error" class="font-serif text-[11px] text-[#d52a2d]">{{ error }}</p>
            <button
              type="button"
              class="flex h-11 w-full items-center justify-center gap-1 rounded-[10px] font-serif text-[14px] font-bold tracking-wide disabled:cursor-not-allowed disabled:opacity-70"
              :class="
                canSave
                  ? 'bg-[#c17f24] text-[#fff8ec]'
                  : 'bg-[rgba(232,214,180,0.75)] text-[rgba(61,31,8,0.45)]'
              "
              :disabled="!canSave"
              @click="onSave"
            >
              {{ primaryLabel }}
              <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              class="font-serif text-[12px] font-bold text-[rgba(61,31,8,0.55)]"
              @click="emit('back')"
            >
              ← 목록으로
            </button>
          </div>
        </template>
      </ScenarioClipboardQuestion>
    </div>

    <template v-if="isCurrentObjective">
      <p v-if="error" class="mb-1 font-serif text-[11px] text-[#d52a2d]">{{ error }}</p>
      <button
        type="button"
        class="flex h-12 w-full shrink-0 items-center justify-center rounded-[10px] bg-[#c17f24] font-serif text-[15px] font-bold text-[#fff8ec] disabled:opacity-40"
        :disabled="!canSave"
        @click="onSave"
      >
        {{ primaryLabel }}
      </button>
    </template>
  </div>
</template>
