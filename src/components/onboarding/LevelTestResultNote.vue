<script setup>
/**
 * Figma 07 진단 결과 — 영역/결과/처리 표 (+ NOTE)
 */
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'

defineProps({
  /** @type {import('vue').PropType<Array<{ mainChapterId: number, assetLabel: string, resultLabel: string, actionLabel: string, isAutoInclude: boolean }>>} */
  rows: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <LearningNotePaper ruled surface-class="bg-[#faf5eb]">
    <div class="px-4 pt-5 pb-5">
      <p class="font-serif text-[10px] tracking-wide text-[rgba(139,100,60,0.55)]">
        RESULT &nbsp;·&nbsp; 커리큘럼 규칙
      </p>
      <h2 class="mt-1.5 font-pen text-[28px] leading-none text-[#212b5c]">금융 기초 진단 결과</h2>

      <div class="mt-5 overflow-hidden rounded border border-[rgba(184,173,148,0.45)] bg-[#fffdf8]">
        <div class="grid grid-cols-[1.1fr_0.9fr_1.1fr] gap-1 bg-[rgba(139,100,60,0.08)] px-3 py-2">
          <p class="font-serif text-[11px] font-bold text-[rgba(61,31,8,0.55)]">영역</p>
          <p class="text-center font-serif text-[11px] font-bold text-[rgba(61,31,8,0.55)]">결과</p>
          <p class="text-right font-serif text-[11px] font-bold text-[rgba(61,31,8,0.55)]">처리</p>
        </div>

        <ul v-if="rows.length" class="flex flex-col gap-2 p-2.5">
          <li
            v-for="row in rows"
            :key="row.mainChapterId"
            class="grid grid-cols-[1.1fr_0.9fr_1.1fr] items-center gap-1 rounded border border-[rgba(184,173,148,0.35)] bg-white px-3 py-2.5"
          >
            <p class="font-serif text-[13px] font-bold text-[#8b643c]">{{ row.assetLabel }}</p>
            <p
              class="text-center font-serif text-[13px] font-bold"
              :class="
                row.resultLabel === '보완'
                  ? 'text-[#c12e24]'
                  : row.resultLabel === '보통'
                    ? 'text-[#c17f24]'
                    : 'text-[#3d7a4a]'
              "
            >
              {{ row.resultLabel }}
            </p>
            <p
              class="text-right font-serif text-[12px] font-bold"
              :class="row.isAutoInclude ? 'text-[#c12e24]' : 'text-[#3d7a4a]'"
            >
              {{ row.actionLabel }}
            </p>
          </li>
        </ul>
        <p v-else class="px-3 py-4 font-serif text-[12px] text-[rgba(139,100,60,0.55)]">
          표시할 진단 영역이 없습니다
        </p>
      </div>

      <div
        class="relative mt-4 overflow-hidden rounded border border-[rgba(242,199,89,0.55)] bg-[#fff8e6] px-3.5 py-3"
      >
        <span
          class="absolute top-2.5 left-3 rounded bg-[#212b5c] px-1.5 py-0.5 font-serif text-[9px] font-black tracking-wide text-[#f5edd9]"
        >
          NOTE
        </span>
        <p class="mt-5 font-serif text-[12px] leading-relaxed text-[rgba(61,31,8,0.8)]">
          오답 대단원은 추천에 자동 포함돼요. 정답은 장바구니에서 추가하고, 구성·순서는 직접 정할 수
          있어요. 포트폴리오 기초는 필수예요.
        </p>
      </div>
    </div>
  </LearningNotePaper>
</template>
