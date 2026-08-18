<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * 홈 — 포트폴리오 기초 과정 유도
 * 딤은 StudyNote 영역 컷아웃(box-shadow)으로 처리해 stacking 이슈를 피한다.
 */
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['dismiss', 'start'])

const rootRef = ref(null)
/** @type {import('vue').Ref<{ top: number, left: number, width: number, height: number } | null>} */
const hole = ref(null)

/** @type {number} */
let rafId = 0

const measureHole = () => {
  const el = rootRef.value
  if (!el) {
    hole.value = null
    return
  }
  const rect = el.getBoundingClientRect()
  hole.value = {
    top: rect.top - 6,
    left: rect.left - 6,
    width: rect.width + 12,
    height: rect.height + 12,
  }
}

const scheduleMeasure = () => {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    rafId = 0
    measureHole()
  })
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      hole.value = null
      return
    }
    await nextTick()
    scheduleMeasure()
  },
)

onMounted(() => {
  window.addEventListener('resize', scheduleMeasure, { passive: true })
  window.addEventListener('scroll', scheduleMeasure, { passive: true, capture: true })
  if (props.open) scheduleMeasure()
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', scheduleMeasure)
  window.removeEventListener('scroll', scheduleMeasure, true)
})
</script>

<template>
  <div ref="rootRef" class="relative w-full max-w-[346px]" data-testid="foundation-guide-spotlight">
    <div
      class="relative transition-[box-shadow] duration-300"
      :class="
        open
          ? 'rounded-[4px] shadow-[0_0_0_3px_rgba(193,127,36,0.9),0_10px_24px_rgba(0,0,0,0.35)]'
          : ''
      "
    >
      <slot />
    </div>

    <Teleport to="body">
      <div
        v-if="open"
        class="foundation-guide-layer fixed inset-0 z-[80]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="foundation-guide-title"
        data-testid="foundation-guide-overlay"
      >
        <!-- StudyNote 위 투명 구멍 + 바깥 딤 -->
        <div
          v-if="hole"
          class="pointer-events-none absolute rounded-[6px]"
          :style="{
            top: `${hole.top}px`,
            left: `${hole.left}px`,
            width: `${hole.width}px`,
            height: `${hole.height}px`,
            boxShadow: '0 0 0 9999px rgba(20, 16, 12, 0.62)',
          }"
          aria-hidden="true"
        />
        <button
          v-else
          type="button"
          class="absolute inset-0 bg-[rgba(20,16,12,0.62)]"
          aria-label="가이드 닫기"
          @click="emit('dismiss')"
        />

        <button
          type="button"
          class="absolute inset-0 z-[1] cursor-default"
          aria-label="가이드 닫기"
          data-testid="foundation-guide-backdrop"
          @click="emit('dismiss')"
        />

        <div
          class="foundation-guide-sheet pointer-events-none absolute inset-x-0 bottom-0 z-[2] mx-auto w-full max-w-[var(--mobile-width)] px-4 pb-[max(5.5rem,env(safe-area-inset-bottom))]"
        >
          <section
            class="pointer-events-auto overflow-hidden rounded-[4px] border-[0.5px] border-[rgba(212,184,150,0.55)] bg-[#fffaed] px-4 pt-4 pb-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-serif text-[10px] font-bold tracking-wide text-[#c17f24]">
                  필수 선행 · 포트폴리오 기초
                </p>
                <h2
                  id="foundation-guide-title"
                  class="mt-1 font-serif text-[17px] leading-snug font-black text-[#29211a]"
                >
                  먼저 포트폴리오 기초부터
                </h2>
                <p class="mt-2 font-serif text-[13px] leading-relaxed font-bold text-[#8b643c]">
                  모의투자 전에 꼭 듣는 필수 과정이에요. 학습 로드맵에서 바로 시작할 수 있어요.
                </p>
              </div>
              <button
                type="button"
                class="shrink-0 rounded px-1.5 py-0.5 font-serif text-[12px] text-[rgba(41,33,26,0.45)]"
                aria-label="닫기"
                data-testid="foundation-guide-close"
                @click="emit('dismiss')"
              >
                닫기
              </button>
            </div>

            <button
              type="button"
              class="cork-btn cork-btn--primary mt-4 w-full"
              data-testid="foundation-guide-cta"
              @click="emit('start')"
            >
              기초 과정 시작 →
            </button>
          </section>
        </div>
      </div>
    </Teleport>
  </div>
</template>
