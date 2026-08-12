<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const root = ref(null)

/** @type {HTMLElement | null} */
let scrollParent = null
/** @type {(() => void) | null} */
let onScroll = null
/** @type {number} */
let rafId = 0

/**
 * @param {HTMLElement} el
 * @returns {HTMLElement | null}
 */
const findScrollParent = (el) => {
  const marked = el.closest('[data-scroll-reveal-root]')
  if (marked instanceof HTMLElement) return marked

  let node = el.parentElement
  while (node && node !== document.body) {
    const y = getComputedStyle(node).overflowY
    if (y === 'auto' || y === 'scroll' || y === 'overlay') return node
    node = node.parentElement
  }
  return null
}

/**
 * 가장자리에서만 살짝 흐려짐 — 본문은 거의 항상 선명
 * @param {HTMLElement} el
 * @param {HTMLElement} parent
 */
const updateReveal = (el, parent) => {
  const parentRect = parent.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  if (parentRect.height <= 0) return

  const visibleTop = Math.max(elRect.top, parentRect.top)
  const visibleBottom = Math.min(elRect.bottom, parentRect.bottom)
  const visibleHeight = Math.max(0, visibleBottom - visibleTop)
  const visibility = visibleHeight / Math.max(1, Math.min(elRect.height, parentRect.height))

  // 70% 이상 보이면 완전 선명, 그 아래로만 살짝 페이드
  let t = 1
  if (visibility < 0.7) {
    t = Math.max(0, visibility / 0.7)
  }

  const eased = t * t * (3 - 2 * t)
  // 최소 가독성 유지
  const opacity = 0.72 + eased * 0.28
  const blur = (1 - eased) * 5
  const scale = 0.97 + eased * 0.03

  el.style.opacity = String(opacity)
  el.style.filter = blur > 0.15 ? `blur(${blur}px)` : 'none'
  el.style.transform = scale < 0.995 ? `scale(${scale})` : 'none'
}

const scheduleUpdate = (el, parent) => {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    rafId = 0
    updateReveal(el, parent)
  })
}

onMounted(() => {
  const el = root.value
  if (!el) return

  scrollParent = findScrollParent(el)
  if (!scrollParent) return

  el.classList.add('scroll-reveal--active')
  el.style.willChange = 'opacity, filter, transform'
  el.style.transformOrigin = 'center center'

  onScroll = () => scheduleUpdate(el, scrollParent)
  scrollParent.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })

  scheduleUpdate(el, scrollParent)
  window.setTimeout(() => scheduleUpdate(el, scrollParent), 400)
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (scrollParent && onScroll) {
    scrollParent.removeEventListener('scroll', onScroll)
  }
  if (onScroll) {
    window.removeEventListener('resize', onScroll)
  }
  scrollParent = null
  onScroll = null
})
</script>

<template>
  <div ref="root" class="scroll-reveal">
    <slot />
  </div>
</template>
