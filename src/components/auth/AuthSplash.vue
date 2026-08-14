<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import splashWebp from '@/assets/auth/splash.webp'
import splashGif from '@/assets/auth/splash.gif'
import brandLogo from '@/assets/auth/brand-logo.png'

defineProps({
  brand: {
    type: String,
    default: 'FirstFolio',
  },
})

const emit = defineEmits(['finished'])

/** splash.webp 1회 재생 길이 */
const SPLASH_DURATION_MS = 3920
const SPLASH_TAIL_MS = 200
/** 로고 홀드 (페이드인 포함) */
const LOGO_HOLD_MS = 1600
const SPLASH_FAILSAFE_MS = 10000

/** @type {import('vue').Ref<'anim' | 'logo'>} */
const phase = ref('anim')
const mediaRef = ref(null)
const mediaSrc = ref(splashWebp)

let finishTimer = 0
let logoTimer = 0
let failsafeTimer = 0
let finished = false
let animScheduled = false

const finish = () => {
  if (finished) return
  finished = true
  if (finishTimer) window.clearTimeout(finishTimer)
  if (logoTimer) window.clearTimeout(logoTimer)
  if (failsafeTimer) window.clearTimeout(failsafeTimer)
  emit('finished')
}

const showLogoThenFinish = () => {
  phase.value = 'logo'
  if (logoTimer) window.clearTimeout(logoTimer)
  logoTimer = window.setTimeout(finish, LOGO_HOLD_MS)
}

const scheduleAnimEnd = (ms = SPLASH_DURATION_MS + SPLASH_TAIL_MS) => {
  if (animScheduled) return
  animScheduled = true
  if (finishTimer) window.clearTimeout(finishTimer)
  finishTimer = window.setTimeout(showLogoThenFinish, ms)
}

const onLoad = () => {
  const el = mediaRef.value
  if (el && el.naturalWidth > 0) scheduleAnimEnd()
}

const onError = () => {
  if (mediaSrc.value !== splashGif) {
    animScheduled = false
    mediaSrc.value = splashGif
    return
  }
  showLogoThenFinish()
}

onMounted(() => {
  failsafeTimer = window.setTimeout(() => {
    if (phase.value === 'anim') showLogoThenFinish()
    else finish()
  }, SPLASH_FAILSAFE_MS)

  const el = mediaRef.value
  if (el?.complete && el.naturalWidth > 0) scheduleAnimEnd()
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
          v-if="phase === 'anim'"
          ref="mediaRef"
          key="anim"
          class="auth-splash__media absolute max-h-[42dvh] w-[min(58vw,220px)] select-none object-contain"
          :src="mediaSrc"
          :alt="brand"
          width="220"
          height="476"
          decoding="async"
          draggable="false"
          @load="onLoad"
          @error="onError"
        />
      </Transition>

      <Transition name="auth-splash-cross">
        <img
          v-if="phase === 'logo'"
          key="logo"
          class="auth-splash__logo absolute h-auto w-[min(72vw,280px)] select-none object-contain"
          :src="brandLogo"
          :alt="brand"
          width="280"
          height="280"
          decoding="async"
          draggable="false"
        />
      </Transition>
    </div>
  </div>
</template>
