<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PortfolioTabs from '@/components/portfolio/PortfolioTabs.vue'
import portfolioBg from '@/assets/portfolio/portfolio-bg.png'

const route = useRoute()
const router = useRouter()

const title = computed(() => route.meta.title ?? '포트폴리오')
const subtitle = computed(() => route.meta.subtitle ?? '')
const showBankruptcyAction = computed(() => Boolean(route.meta.showBankruptcyAction))

// TODO: 파산 신청 확인 모달/페이지 연결 (오조작 방지 확인 절차 필요 — FR-PF-08)
const handleBankruptcyClick = () => {
  router.push({ name: 'portfolio-holdings', query: { bankruptcy: 'confirm' } })
}
</script>

<template>
  <div class="relative flex min-h-full flex-col gap-4 px-5 py-6 text-[var(--pf-text)]">
    <img
      :src="portfolioBg"
      alt=""
      class="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover"
    />
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[var(--pf-page-bg)]/75" />

    <header class="flex items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-[var(--pf-text)]">{{ title }}</h1>
        <p class="mt-1 text-xs text-[var(--pf-text-muted)]">{{ subtitle }}</p>
      </div>

      <button
        v-if="showBankruptcyAction"
        type="button"
        class="shrink-0 rounded-full border border-[var(--pf-danger-border)] bg-[var(--pf-danger-bg)] px-3 py-1.5 text-xs font-bold whitespace-nowrap text-[var(--pf-danger-text)]"
        @click="handleBankruptcyClick"
      >
        파산 신청
      </button>
    </header>

    <PortfolioTabs />

    <RouterView />
  </div>
</template>
