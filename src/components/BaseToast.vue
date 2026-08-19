<script setup>
import { computed, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    required: true,
  },
  /** ms — 0이면 자동 닫기 없음 */
  duration: {
    type: Number,
    default: 2600,
  },
  /** 'default' | 'success' | 'error' — 색상만 다르고 레이아웃/동작은 동일하다. */
  variant: {
    type: String,
    default: 'default',
  },
})

const VARIANT_CLASS = {
  default: 'border-[rgba(212,184,150,0.55)] bg-[#fffaed] text-[#8b643c]',
  success: 'border-[rgba(29,158,117,0.4)] bg-[#f0faf6] text-[#1D9E75]',
  error: 'border-[rgba(192,67,63,0.4)] bg-[#fdf2f1] text-[#c0433f]',
}

const variantClass = computed(() => VARIANT_CLASS[props.variant] ?? VARIANT_CLASS.default)

const emit = defineEmits(['close'])

/** @type {ReturnType<typeof setTimeout> | null} */
let timer = null

const clearTimer = () => {
  if (timer != null) {
    clearTimeout(timer)
    timer = null
  }
}

watch(
  () => [props.open, props.message, props.duration],
  ([open]) => {
    clearTimer()
    if (!open || props.duration <= 0) return
    timer = setTimeout(() => emit('close'), props.duration)
  },
  { immediate: true },
)

onBeforeUnmount(clearTimer)
</script>

<template>
  <Teleport to="body">
    <Transition name="base-toast">
      <div
        v-if="open"
        class="base-toast pointer-events-none fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[90] flex justify-center px-4"
        role="status"
        aria-live="polite"
        data-testid="base-toast"
      >
        <div
          class="pointer-events-auto max-w-[min(340px,var(--mobile-width))] rounded-[4px] border-[0.5px] px-3.5 py-2.5 shadow-[0_8px_22px_rgba(0,0,0,0.35)]"
          :class="variantClass"
        >
          <p class="text-center font-serif text-[12px] leading-snug font-bold">
            {{ message }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.base-toast-enter-active,
.base-toast-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}
.base-toast-enter-from,
.base-toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
