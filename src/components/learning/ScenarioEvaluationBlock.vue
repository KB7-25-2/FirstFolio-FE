<script setup>
import { computed, onMounted, ref } from 'vue'

const props = defineProps({
  quizScore: { type: Number, default: 90 },
  stampLabel: { type: String, default: '최적' },
  summary: { type: String, default: '' },
  /** pass | fail */
  tone: { type: String, default: 'pass' },
  /** 마운트 시 애니메이션 재생 */
  animate: { type: Boolean, default: true },
})

const ready = ref(false)
const isFail = computed(() => props.tone === 'fail')

onMounted(() => {
  if (!props.animate) {
    ready.value = true
    return
  }
  requestAnimationFrame(() => {
    ready.value = true
  })
})

const meters = computed(() => {
  if (isFail.value) {
    const base = Math.max(12, Math.min(38, props.quizScore || 28))
    return [
      { label: '목표 부합도', value: base + 4, bar: 'bg-[#c45c4a]' },
      { label: '리스크 적합도', value: Math.max(10, base - 4), bar: 'bg-[#b07060]' },
      { label: '수익성 균형', value: base, bar: 'bg-[#8a6a5a]' },
    ]
  }
  const base = Math.max(60, Math.min(98, props.quizScore || 80))
  return [
    { label: '목표 부합도', value: Math.min(99, base + 5), bar: 'bg-[#c17f24]' },
    { label: '리스크 적합도', value: Math.min(99, base), bar: 'bg-[#478552]' },
    { label: '수익성 균형', value: Math.min(99, base - 2), bar: 'bg-[#3d6ea8]' },
  ]
})

const filledStars = computed(() => {
  if (isFail.value) return props.quizScore >= 35 ? 2 : 1
  if (props.quizScore >= 80) return 5
  if (props.quizScore >= 60) return 4
  if (props.quizScore >= 40) return 3
  return 2
})

const starActiveClass = computed(() => (isFail.value ? 'text-[#c45c4a]' : 'text-[#c17f24]'))
</script>

<template>
  <div
    class="scenario-eval mt-2 overflow-hidden rounded-[10px] border-[0.5px] border-dashed px-3 py-2"
    :class="[
      ready ? 'scenario-eval--ready' : '',
      isFail
        ? 'border-[rgba(196,92,74,0.45)] bg-[rgba(250,235,229,0.35)]'
        : 'border-[rgba(139,100,60,0.35)]',
    ]"
  >
    <div class="flex items-center gap-2 py-1.5">
      <div
        class="h-px flex-1"
        :class="isFail ? 'bg-[rgba(196,92,74,0.3)]' : 'bg-[rgba(139,100,60,0.25)]'"
      />
      <p
        class="font-serif text-[10px] font-bold tracking-[1.2px]"
        :class="isFail ? 'text-[#a04838]' : 'text-[#7a5230]'"
      >
        추천서 평가
      </p>
      <div
        class="h-px flex-1"
        :class="isFail ? 'bg-[rgba(196,92,74,0.3)]' : 'bg-[rgba(139,100,60,0.25)]'"
      />
    </div>

    <div class="relative mt-1 flex items-center justify-center gap-1 py-2">
      <span
        v-for="n in 5"
        :key="n"
        class="scenario-eval__star text-[18px]"
        :class="n <= filledStars ? starActiveClass : 'text-[rgba(139,100,60,0.25)]'"
        :style="{ animationDelay: `${0.12 + n * 0.07}s` }"
      >
        ★
      </span>
      <span
        class="scenario-eval__stamp absolute -right-0.5 top-0 rounded border-[0.5px] px-2.5 py-1 font-serif text-[13px] font-black tracking-wide"
        :class="
          isFail
            ? 'border-[rgba(196,92,74,0.7)] bg-[rgba(250,235,229,0.55)] text-[rgba(168,56,42,0.85)]'
            : 'border-[rgba(139,69,19,0.6)] bg-[rgba(245,237,217,0.35)] text-[rgba(139,69,19,0.75)]'
        "
        aria-hidden="true"
      >
        {{ stampLabel }}
      </span>
    </div>

    <div class="mt-1 flex flex-col gap-2 px-0.5">
      <div v-for="(meter, index) in meters" :key="meter.label">
        <div class="mb-1 flex items-center justify-between text-[11px]">
          <span class="font-serif text-[#3d1f08]">{{ meter.label }}</span>
          <span class="font-bold text-[#3d1f08]">{{ meter.value }}%</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-[rgba(139,100,60,0.15)]">
          <div
            class="scenario-eval__bar h-full rounded-full"
            :class="meter.bar"
            :style="{
              '--bar-width': `${meter.value}%`,
              animationDelay: `${0.35 + index * 0.12}s`,
            }"
          />
        </div>
      </div>
    </div>

    <p
      v-if="summary"
      class="scenario-eval__summary mt-3 text-center font-serif text-[11px] leading-[17px]"
      :class="isFail ? 'text-[#a04838]' : 'text-[#7a5230]'"
    >
      {{ summary }}
    </p>
  </div>
</template>

<style scoped>
.scenario-eval__star {
  opacity: 0;
  transform: scale(0.4) translateY(6px);
}

.scenario-eval--ready .scenario-eval__star {
  animation: scenario-star-pop 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.scenario-eval__stamp {
  opacity: 0;
  transform: rotate(-28deg) scale(1.55) translateY(-18px);
  filter: blur(0.5px);
}

.scenario-eval--ready .scenario-eval__stamp {
  animation: scenario-stamp-slam 0.55s cubic-bezier(0.2, 0.9, 0.25, 1.15) 0.45s forwards;
}

.scenario-eval__bar {
  width: 0;
}

.scenario-eval--ready .scenario-eval__bar {
  animation: scenario-bar-fill 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.scenario-eval__summary {
  opacity: 0;
}

.scenario-eval--ready .scenario-eval__summary {
  animation: scenario-fade-up 0.4s ease 0.75s forwards;
}

@keyframes scenario-star-pop {
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes scenario-stamp-slam {
  0% {
    opacity: 0;
    transform: rotate(-28deg) scale(1.55) translateY(-18px);
    filter: blur(0.5px);
  }
  55% {
    opacity: 1;
    transform: rotate(-10deg) scale(0.94) translateY(1px);
    filter: blur(0);
  }
  75% {
    transform: rotate(-14deg) scale(1.04) translateY(-1px);
  }
  100% {
    opacity: 1;
    transform: rotate(-12deg) scale(1) translateY(0);
    filter: blur(0);
  }
}

@keyframes scenario-bar-fill {
  to {
    width: var(--bar-width);
  }
}

@keyframes scenario-fade-up {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
