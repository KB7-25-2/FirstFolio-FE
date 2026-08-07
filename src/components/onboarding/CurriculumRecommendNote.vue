<script setup>
import { computed, ref } from 'vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'

/**
 * Figma 09 커리큘럼 편집 — 포함(드래그) / 장바구니 미선택
 */
const props = defineProps({
  /** @type {import('vue').PropType<import('@/types/curriculum.js').CurriculumConfirmItem[]>} */
  orderedItems: { type: Array, default: () => [] },
  /** @type {import('vue').PropType<Array<{ mainChapterId: number, title: string, sourceType?: string }>>} */
  availableItems: { type: Array, default: () => [] },
  courseCount: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'reorder'])

const selectedCount = computed(
  () => props.orderedItems.filter((i) => i.sourceType !== 'REQUIRED').length,
)

const summaryLine = computed(() => `필수 1 + 선택 ${selectedCount.value} · 순서는 내가 정해요`)

const canDrag = (item) => item?.sourceType !== 'REQUIRED'

const rankHint = (item, index) => {
  if (item.sourceType === 'REQUIRED') return '1순위 고정 · 필수 선행'
  return `${index + 1}순위 · 드래그로 이동`
}

const availableHint = (item) => {
  if (item.sourceType === 'LEVEL_TEST_WRONG') return '추천 · 탭해서 다시 담기'
  return '장바구니 · 아직 추가 안 함'
}

const draggingIndex = ref(null)
const dragOverIndex = ref(null)
/** @type {number | null} */
let pointerFromIndex = null

const onHandlePointerDown = (index, item, event) => {
  if (!canDrag(item)) return
  pointerFromIndex = index
  draggingIndex.value = index
  dragOverIndex.value = index
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

const onHandlePointerMove = (event) => {
  if (pointerFromIndex == null) return
  const el = document.elementFromPoint(event.clientX, event.clientY)
  const row = el?.closest?.('[data-order-index]')
  if (!row) return
  const toIndex = Number(row.getAttribute('data-order-index'))
  if (Number.isNaN(toIndex) || toIndex <= 0) return
  dragOverIndex.value = toIndex
  if (toIndex !== pointerFromIndex) {
    emit('reorder', pointerFromIndex, toIndex)
    pointerFromIndex = toIndex
    draggingIndex.value = toIndex
  }
}

const onHandlePointerUp = (event) => {
  if (pointerFromIndex == null) return
  event.currentTarget.releasePointerCapture?.(event.pointerId)
  pointerFromIndex = null
  draggingIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <LearningNotePaper ruled :show-tape="false" surface-class="bg-[#fffaed]">
    <div class="px-4 pt-5 pb-4">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="font-serif text-[10px] tracking-wide text-[rgba(139,100,60,0.55)]">
            학습 순서 편집
          </p>
          <h2 class="mt-1 font-pen text-[28px] leading-none text-[#212b5c]">나의 커리큘럼</h2>
          <p class="mt-2 font-serif text-[11px] text-[rgba(139,100,60,0.7)]">
            {{ summaryLine }}
          </p>
        </div>
        <div
          class="shrink-0 -rotate-3 rounded border-[1.5px] border-[rgba(209,46,41,0.75)] px-2 py-1"
        >
          <p class="font-serif text-[11px] font-black whitespace-nowrap text-[#c12e24]">
            {{ courseCount }}과정
          </p>
        </div>
      </div>

      <div class="mt-3 h-0.5 w-full bg-[rgba(184,173,148,0.45)]" />

      <p class="mt-2.5 font-serif text-[11px] text-[rgba(139,100,60,0.55)]">
        드래그로 순서 변경 · 필수 과정은 고정
      </p>

      <p v-if="loading" class="mt-6 font-serif text-[13px] text-[rgba(139,100,60,0.65)]">
        불러오는 중…
      </p>

      <template v-else>
        <section class="mt-4">
          <p class="font-serif text-[10px] font-black text-[rgba(139,100,60,0.45)]">
            포함된 과정 · 순서 조정
          </p>
          <ul class="mt-2 flex flex-col gap-2">
            <li
              v-for="(item, index) in orderedItems"
              :key="`cart-${item.mainChapterId}`"
              :data-order-index="index"
              class="flex items-center gap-2.5 rounded-[4px] border px-2.5 py-2.5 transition-[opacity,box-shadow,border-color,background-color]"
              :class="[
                item.sourceType === 'REQUIRED'
                  ? 'border-[rgba(193,127,36,0.4)] bg-[#faf2db]'
                  : 'border-[rgba(61,122,74,0.28)] bg-[#e5f2e0]',
                draggingIndex === index ? 'opacity-90 shadow-md' : '',
                dragOverIndex === index && draggingIndex !== null && draggingIndex !== index
                  ? 'border-[#c17f24] bg-[#fff4e0]'
                  : '',
              ]"
            >
              <!-- 필수: 필 / 선택: 드래그 핸들 -->
              <span
                v-if="!canDrag(item)"
                class="flex size-7 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] border-[#c17f24] bg-[#fff8ec] font-serif text-[12px] font-black text-[#c17f24]"
              >
                필
              </span>
              <button
                v-else
                type="button"
                class="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-[3px] border border-[rgba(61,122,74,0.35)] bg-[#f3faf4] font-serif text-[14px] leading-none text-[#3d7a4a] active:cursor-grabbing"
                aria-label="끌어서 순서 변경"
                @pointerdown="onHandlePointerDown(index, item, $event)"
                @pointermove="onHandlePointerMove"
                @pointerup="onHandlePointerUp"
                @pointercancel="onHandlePointerUp"
              >
                ⠿
              </button>

              <div class="min-w-0 flex-1">
                <p class="font-serif text-[14px] font-bold text-[#29211a]">{{ item.title }}</p>
                <p class="mt-0.5 font-serif text-[10px] text-[rgba(139,100,60,0.55)]">
                  {{ rankHint(item, index) }}
                </p>
              </div>

              <span
                v-if="!canDrag(item)"
                class="shrink-0 rounded border border-[rgba(193,127,36,0.65)] bg-[#fff8ec] px-2 py-0.5 font-serif text-[10px] font-bold text-[#c17f24]"
              >
                고정
              </span>
              <button
                v-else
                type="button"
                class="btn-hover shrink-0 rounded border border-[rgba(61,122,74,0.55)] bg-[#f3faf4] px-2 py-0.5 font-serif text-[10px] font-bold text-[#3d7a4a]"
                @click="$emit('toggle', item.mainChapterId)"
              >
                담김
              </button>
            </li>
          </ul>
        </section>

        <section class="mt-5">
          <p class="font-serif text-[10px] font-black text-[rgba(139,100,60,0.45)]">
            장바구니 · 미선택 (탭해서 추가)
          </p>
          <p
            v-if="!availableItems.length"
            class="mt-2 font-serif text-[12px] text-[rgba(139,100,60,0.55)]"
          >
            담을 수 있는 과정이 없어요
          </p>
          <ul v-else class="mt-2 flex flex-col gap-2">
            <li v-for="item in availableItems" :key="`avail-${item.mainChapterId}`">
              <button
                type="button"
                class="btn-hover flex w-full items-center gap-2.5 rounded-[4px] border border-[rgba(184,173,148,0.45)] bg-[#fffdf8] px-2.5 py-2.5 text-left"
                @click="$emit('toggle', item.mainChapterId)"
              >
                <span
                  class="flex size-7 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] border-[rgba(139,100,60,0.35)] bg-white font-serif text-[14px] font-black text-[rgba(139,100,60,0.55)]"
                >
                  +
                </span>
                <div class="min-w-0 flex-1">
                  <p class="font-serif text-[14px] font-bold text-[#29211a]">{{ item.title }}</p>
                  <p class="mt-0.5 font-serif text-[10px] text-[rgba(139,100,60,0.55)]">
                    {{ availableHint(item) }}
                  </p>
                </div>
                <span
                  class="shrink-0 rounded border border-[rgba(184,173,148,0.55)] bg-[#f5f0e6] px-2 py-0.5 font-serif text-[10px] font-bold text-[rgba(139,100,60,0.55)]"
                >
                  미선택
                </span>
              </button>
            </li>
          </ul>
        </section>

        <p class="mt-5 text-center font-serif text-[11px] text-[rgba(139,100,60,0.5)]">
          빈 커리큘럼은 불가 · 기초 과정은 항상 남아 있어요
        </p>
      </template>
    </div>
  </LearningNotePaper>
</template>
