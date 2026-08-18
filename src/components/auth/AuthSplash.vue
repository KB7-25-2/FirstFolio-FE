<script setup>
defineProps({
  brand: {
    type: String,
    default: 'Firstfolio',
  },
  tagline: {
    type: String,
    default: '배우며 완성하는 나의 첫 자산 포트폴리오',
  },
})
</script>

<template>
  <div
    class="auth-splash absolute inset-0 z-20 flex items-center justify-center"
    role="status"
    aria-live="polite"
    aria-label="Firstfolio 시작 화면"
  >
    <div class="auth-splash__glow" aria-hidden="true" />
    <div class="flex flex-col items-center px-6 text-center">
      <p
        class="auth-splash__eyebrow font-serif text-[10px] tracking-[0.22em] text-[var(--cork-ink-faint)]"
      >
        FIRSTFOLIO
      </p>
      <h1
        class="auth-splash__brand mt-3 font-serif text-[44px] leading-none font-bold text-[var(--cork-ink)]"
      >
        {{ brand }}
      </h1>
      <p
        class="auth-splash__tagline mt-4 max-w-[16rem] font-serif text-[13px] leading-relaxed text-[var(--cork-ink-muted)]"
      >
        {{ tagline }}
      </p>
      <span
        class="auth-splash__stamp mt-8 rotate-[-8deg] rounded border border-[var(--cork-stamp-border)] px-3 py-1.5 font-serif text-[11px] tracking-wide text-[var(--cork-stamp)]"
        aria-hidden="true"
      >
        OPEN
      </span>
    </div>
  </div>
</template>
