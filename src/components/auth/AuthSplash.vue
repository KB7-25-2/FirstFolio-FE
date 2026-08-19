<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  brand: {
    type: String,
    default: 'firstfolio',
  },
})

const emit = defineEmits(['finished'])
const SPLASH_DURATION_MS = 3920
const SPLASH_TAIL_MS = 200
const LOGO_HOLD_MS = 1600
const SPLASH_FAILSAFE_MS = 10000

const phase = ref('splash')
const splashRef = ref(null)

let finishTimer = 0
let logoTimer = 0
let failsafeTimer = 0
let finished = false
let splashEndScheduled = false

const finish = () => {
  if (finished) return
  finished = true
  if (finishTimer) window.clearTimeout(finishTimer)
  if (logoTimer) window.clearTimeout(logoTimer)
  if (failsafeTimer) window.clearTimeout(failsafeTimer)
  emit('finished')
}

const showLogoThenFinish = () => {
  if (phase.value === 'logo') return
  phase.value = 'logo'
  if (logoTimer) window.clearTimeout(logoTimer)
  logoTimer = window.setTimeout(finish, LOGO_HOLD_MS)
}

const scheduleSplashEnd = () => {
  if (splashEndScheduled) return
  splashEndScheduled = true
  finishTimer = window.setTimeout(showLogoThenFinish, SPLASH_DURATION_MS + SPLASH_TAIL_MS)
}

const onSplashLoad = () => {
  if (splashRef.value?.naturalWidth) scheduleSplashEnd()
}

const onSplashError = () => {
  showLogoThenFinish()
}

onMounted(() => {
  failsafeTimer = window.setTimeout(showLogoThenFinish, SPLASH_FAILSAFE_MS)
  if (splashRef.value?.complete && splashRef.value.naturalWidth) onSplashLoad()
})

onBeforeUnmount(() => {
  if (finishTimer) window.clearTimeout(finishTimer)
  if (logoTimer) window.clearTimeout(logoTimer)
  if (failsafeTimer) window.clearTimeout(failsafeTimer)
})
</script>

<template>
  <div
    class="auth-splash fixed inset-0 z-100 flex items-center justify-center overflow-hidden bg-[var(--cork-base)]"
    role="status"
    aria-live="polite"
    :aria-label="`${brand} 시작 화면`"
  >
    <div
      class="auth-splash__stage relative flex h-full w-full max-w-[var(--mobile-width)] items-center justify-center"
    >
      <Transition name="auth-splash-cross">
        <img
          v-if="phase === 'splash'"
          ref="splashRef"
          key="splash"
          src="/splash.webp"
          :alt="brand"
          class="auth-splash__media absolute max-h-[42dvh] w-[min(58vw,220px)] select-none object-contain"
          width="220"
          height="476"
          decoding="async"
          draggable="false"
          @load="onSplashLoad"
          @error="onSplashError"
        />
      </Transition>

      <Transition name="auth-splash-cross">
        <img
          v-if="phase === 'logo'"
          key="logo"
          src="/logo.png"
          :alt="brand"
          class="auth-splash__logo absolute h-auto w-[min(72vw,280px)] select-none object-contain"
          width="280"
          height="280"
          decoding="async"
          draggable="false"
        />
      </Transition>
    </div>
  </div>
</template>
