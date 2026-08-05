<script setup>
/**
 * 커리큘럼 설정 — 추가/제거/순서 변경 통합
 */
defineProps({
  requiredItem: { type: Object, default: null },
  recommendations: { type: Array, default: () => [] },
  cartCandidates: { type: Array, default: () => [] },
  /** @type {import('vue').PropType<import('@/types/curriculum.js').CurriculumConfirmItem[]>} */
  orderedItems: { type: Array, default: () => [] },
  courseCount: { type: Number, default: 0 },
  isSelected: { type: Function, required: true },
  loading: { type: Boolean, default: false },
})

defineEmits(['toggle', 'move-up', 'move-down'])

const sourceLabel = (sourceType) => {
  if (sourceType === 'REQUIRED') return '필수'
  if (sourceType === 'LEVEL_TEST_WRONG') return '추천'
  if (sourceType === 'CART') return '장바구니'
  return sourceType
}
</script>

<template>
  <div
    class="relative overflow-hidden rounded-[2px] border border-[rgba(212,184,150,0.55)] bg-[#fffaed] shadow-[0_4px_14px_rgba(0,0,0,0.28)]"
  >
    <div
      class="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style="
        background-image: repeating-linear-gradient(
          to bottom,
          transparent,
          transparent 21px,
          rgba(139, 100, 60, 0.1) 21px,
          rgba(139, 100, 60, 0.1) 22px
        );
        background-position: 0 8px;
      "
    />

    <div class="relative z-10 px-4 pt-5 pb-5">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="font-pen text-[26px] leading-none text-[#212b5c]">개인 커리큘럼</p>
          <p class="mt-1.5 font-serif text-[11px] font-bold text-[rgba(139,100,60,0.7)]">
            필수 · 추천 · 장바구니
          </p>
          <p class="mt-1 font-serif text-[11px] text-[rgba(61,31,8,0.65)]">
            담기와 순서를 이 화면에서 한 번에 정해요
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

      <p class="mt-3 font-serif text-[11px] text-[rgba(139,100,60,0.55)]">
        추천은 강제가 아니에요 · 자유롭게 빼거나 담기
      </p>

      <p v-if="loading" class="mt-6 font-serif text-[13px] text-[rgba(139,100,60,0.65)]">
        불러오는 중…
      </p>

      <template v-else>
        <section class="mt-5">
          <p class="font-serif text-[10px] font-black text-[rgba(139,100,60,0.45)]">
            필수 선행 과정
          </p>
          <div
            v-if="requiredItem"
            class="mt-2 flex items-center gap-3 rounded-[4px] border border-[rgba(193,127,36,0.35)] bg-[#faf2db] px-3 py-3"
          >
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#c17f24] bg-[#fff8ec] font-serif text-[13px] font-black text-[#c17f24]"
            >
              필
            </span>
            <div class="min-w-0 flex-1">
              <p class="font-serif text-[14px] font-bold text-[#29211a]">
                {{ requiredItem.title }}
              </p>
              <p class="mt-0.5 font-serif text-[10px] text-[rgba(139,100,60,0.55)]">
                필수 선행 · 제거할 수 없음
              </p>
            </div>
            <span
              class="shrink-0 rounded border border-[rgba(193,127,36,0.65)] bg-[#fff8ec] px-2 py-0.5 font-serif text-[10px] font-bold text-[#c17f24]"
            >
              필수
            </span>
          </div>
        </section>

        <section v-if="recommendations.length" class="mt-5">
          <p class="font-serif text-[10px] font-black text-[rgba(139,100,60,0.45)]">
            추천 포함 · 오답 대단원 (제거 가능)
          </p>
          <ul class="mt-2 flex flex-col gap-2">
            <li v-for="item in recommendations" :key="item.mainChapterId">
              <button
                type="button"
                class="btn-hover flex w-full items-center gap-3 rounded-[4px] border px-3 py-3 text-left"
                :class="
                  isSelected(item.mainChapterId)
                    ? 'border-[rgba(61,122,74,0.4)] bg-[#e5f2e0]'
                    : 'border-[rgba(184,173,148,0.4)] bg-[#fffdf8] opacity-65'
                "
                @click="$emit('toggle', item.mainChapterId)"
              >
                <span
                  class="flex size-6 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] font-serif text-[12px] font-black"
                  :class="
                    isSelected(item.mainChapterId)
                      ? 'border-[#3d7a4a] bg-[#3d7a4a] text-[#f5edd9]'
                      : 'border-[rgba(139,100,60,0.35)] bg-white text-transparent'
                  "
                >
                  ✓
                </span>
                <div class="min-w-0 flex-1">
                  <p class="font-serif text-[14px] font-bold text-[#29211a]">{{ item.title }}</p>
                  <p class="mt-0.5 font-serif text-[10px] text-[rgba(139,100,60,0.55)]">
                    진단 오답 · 추천에 자동 포함
                  </p>
                </div>
                <span
                  class="shrink-0 rounded border px-2 py-0.5 font-serif text-[10px] font-bold"
                  :class="
                    isSelected(item.mainChapterId)
                      ? 'border-[rgba(61,122,74,0.55)] bg-[#f3faf4] text-[#3d7a4a]'
                      : 'border-[rgba(184,173,148,0.55)] bg-white text-[rgba(139,100,60,0.45)]'
                  "
                >
                  {{ isSelected(item.mainChapterId) ? '추천' : '제외' }}
                </span>
              </button>
            </li>
          </ul>
        </section>

        <section v-if="cartCandidates.length" class="mt-5">
          <p class="font-serif text-[10px] font-black text-[rgba(139,100,60,0.45)]">
            장바구니 · 정답 대단원 (직접 추가)
          </p>
          <ul class="mt-2 flex flex-col gap-2">
            <li v-for="candidate in cartCandidates" :key="candidate.mainChapterId">
              <button
                type="button"
                class="btn-hover flex w-full items-center gap-3 rounded-[4px] border border-[rgba(184,173,148,0.4)] bg-white px-3 py-3 text-left"
                @click="$emit('toggle', candidate.mainChapterId)"
              >
                <span
                  class="flex size-6 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] font-serif text-[12px] font-black"
                  :class="
                    isSelected(candidate.mainChapterId)
                      ? 'border-[#3d7a4a] bg-[#3d7a4a] text-[#f5edd9]'
                      : 'border-[rgba(139,100,60,0.35)] bg-[#fffdf8] text-transparent'
                  "
                >
                  ✓
                </span>
                <div class="min-w-0 flex-1">
                  <p class="font-serif text-[14px] font-bold text-[#29211a]">
                    {{ candidate.title }}
                  </p>
                  <p class="mt-0.5 font-serif text-[10px] text-[rgba(139,100,60,0.55)]">
                    진단 정답 · 장바구니에서 추가
                  </p>
                </div>
                <span
                  class="shrink-0 rounded border px-2 py-0.5 font-serif text-[10px] font-bold"
                  :class="
                    isSelected(candidate.mainChapterId)
                      ? 'border-[rgba(61,122,74,0.55)] bg-[#f3faf4] text-[#3d7a4a]'
                      : 'border-[rgba(184,173,148,0.55)] bg-[#f5f0e6] text-[rgba(139,100,60,0.55)]'
                  "
                >
                  {{ isSelected(candidate.mainChapterId) ? '담김' : '담기' }}
                </span>
              </button>
            </li>
          </ul>
        </section>

        <!-- 선택 순서 -->
        <section class="mt-5">
          <p class="font-serif text-[10px] font-black text-[rgba(139,100,60,0.45)]">
            학습 순서 · 위아래로 변경
          </p>
          <ul class="mt-2 flex flex-col gap-2">
            <li
              v-for="(item, index) in orderedItems"
              :key="`order-${item.mainChapterId}`"
              class="flex items-center gap-2 rounded-[4px] border border-[rgba(184,173,148,0.4)] bg-white px-3 py-2.5"
            >
              <span
                class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#212b5c] font-serif text-[11px] font-black text-[#f5edd9]"
              >
                {{ item.displayOrder }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="font-serif text-[13px] font-bold text-[#29211a]">{{ item.title }}</p>
                <p class="mt-0.5 font-serif text-[10px] text-[rgba(139,100,60,0.55)]">
                  {{ sourceLabel(item.sourceType) }}
                  <span v-if="item.sourceType === 'REQUIRED'"> · 고정</span>
                </p>
              </div>
              <div v-if="item.sourceType !== 'REQUIRED'" class="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  class="btn-hover flex h-6 w-7 items-center justify-center rounded border border-[rgba(184,173,148,0.55)] font-serif text-[10px] font-bold text-[#29211a] disabled:opacity-30"
                  :disabled="index <= 1"
                  aria-label="위로"
                  @click="$emit('move-up', index)"
                >
                  ↑
                </button>
                <button
                  type="button"
                  class="btn-hover flex h-6 w-7 items-center justify-center rounded border border-[rgba(184,173,148,0.55)] font-serif text-[10px] font-bold text-[#29211a] disabled:opacity-30"
                  :disabled="index >= orderedItems.length - 1"
                  aria-label="아래로"
                  @click="$emit('move-down', index)"
                >
                  ↓
                </button>
              </div>
            </li>
          </ul>
        </section>

        <div
          class="mt-5 rounded-[4px] border border-[rgba(242,199,89,0.65)] bg-[#fff8e0] px-3 py-3"
        >
          <p class="font-serif text-[11px] font-bold text-[#8b643c]">
            규칙 · 포트폴리오 기초는 필수
          </p>
          <p class="mt-1 font-serif text-[11px] leading-relaxed text-[rgba(61,31,8,0.65)]">
            빈 커리큘럼 불가 · 기초 과정은 항상 포함돼요
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
