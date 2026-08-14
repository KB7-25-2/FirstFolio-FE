<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { INITIAL_SIMULATION_CASH, formatWon } from '@/utils/foundationGrant.js'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  amount: {
    type: Number,
    default: INITIAL_SIMULATION_CASH,
  },
})

const emit = defineEmits(['confirm', 'close'])

const displayAmount = ref(0)
const unlocked = ref(false)
/** @type {number | null} */
let rafId = null

const amountLabel = computed(() => formatWon(displayAmount.value))

const runCountUp = () => {
  if (rafId != null) cancelAnimationFrame(rafId)
  displayAmount.value = 0
  unlocked.value = false

  const duration = 1600
  const start = performance.now()

  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration)
    // easeOutCubic
    const eased = 1 - (1 - t) ** 3
    displayAmount.value = props.amount * eased
    if (t < 1) {
      rafId = requestAnimationFrame(tick)
      return
    }
    displayAmount.value = props.amount
    unlocked.value = true
    rafId = null
  }

  rafId = requestAnimationFrame(tick)
}

watch(
  () => props.open,
  (open) => {
    if (open) runCountUp()
  },
)

onMounted(() => {
  if (props.open) runCountUp()
})

onBeforeUnmount(() => {
  if (rafId != null) cancelAnimationFrame(rafId)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="foundation-unlock-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[95] flex items-center justify-center px-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="foundation-unlock-title"
        data-testid="foundation-unlock-ceremony"
      >
        <div class="absolute inset-0 bg-[rgba(18,14,10,0.78)]" aria-hidden="true" />

        <Transition name="foundation-unlock-pop" appear>
          <div
            v-if="open"
            class="relative z-10 w-full max-w-[340px] overflow-hidden rounded-[6px] border-[0.5px] border-[rgba(212,184,150,0.6)] bg-[#fffaed] px-5 pt-7 pb-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
          >
            <p
              class="text-center font-serif text-[10px] font-bold tracking-[0.35em] text-[#c17f24]"
            >
              PORTFOLIO UNLOCKED
            </p>
            <h2
              id="foundation-unlock-title"
              class="mt-2 text-center font-serif text-[20px] leading-snug font-black text-[#29211a]"
            >
              포트폴리오 기초 수료!
            </h2>
            <p
              class="mt-2 text-center font-serif text-[13px] leading-relaxed font-bold text-[#8b643c]"
            >
              모의투자금이 지급되고<br />포트폴리오가 해금됐어요
            </p>

            <div class="mt-5 flex justify-center">
              <div
                class="flex size-16 items-center justify-center rounded-full border-[0.5px] transition-all duration-500"
                :class="
                  unlocked
                    ? 'border-[#c17f24] bg-[#c17f24] text-[#fff8ec] shadow-[0_0_0_6px_rgba(193,127,36,0.22)]'
                    : 'border-[rgba(139,100,60,0.35)] bg-[#f3ead7] text-[rgba(139,100,60,0.55)]'
                "
                aria-hidden="true"
              >
                <font-awesome-icon
                  :icon="unlocked ? 'fa-solid fa-chart-pie' : 'fa-solid fa-lock'"
                  class="text-[22px]"
                />
              </div>
            </div>

            <div
              class="mt-5 rounded-[4px] border-[0.5px] border-[rgba(193,127,36,0.4)] bg-[#fff7eb] px-3 py-4 text-center"
            >
              <p
                class="font-serif text-[10px] font-bold tracking-wide text-[rgba(139,100,60,0.75)]"
              >
                모의투자금
              </p>
              <p
                class="foundation-unlock-amount mt-1 font-serif text-[28px] leading-none font-black text-[#212b5c]"
                data-testid="foundation-unlock-amount"
              >
                {{ amountLabel }}
              </p>
            </div>

            <button
              type="button"
              class="cork-btn cork-btn--primary mt-5 w-full"
              data-testid="foundation-unlock-cta"
              @click="emit('confirm')"
            >
              포트폴리오 구성하기 →
            </button>
            <button
              type="button"
              class="mt-2 w-full py-2 font-serif text-[12px] text-[rgba(41,33,26,0.45)]"
              @click="emit('close')"
            >
              나중에 하기
            </button>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.foundation-unlock-fade-enter-active,
.foundation-unlock-fade-leave-active {
  transition: opacity 0.25s ease;
}
.foundation-unlock-fade-enter-from,
.foundation-unlock-fade-leave-to {
  opacity: 0;
}

.foundation-unlock-pop-enter-active {
  transition:
    opacity 0.32s ease,
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}
.foundation-unlock-pop-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.foundation-unlock-pop-enter-from,
.foundation-unlock-pop-leave-to {
  opacity: 0;
  transform: translateY(14px) scale(0.96);
}

.foundation-unlock-amount {
  font-variant-numeric: tabular-nums;
}
</style>
