<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import PortfolioTabs from '@/components/portfolio/PortfolioTabs.vue'
import BankruptcyConfirmModal from '@/components/portfolio/BankruptcyConfirmModal.vue'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import portfolioBg from '@/assets/portfolio/portfolio-bg.png'

const route = useRoute()
const store = usePortfolioStore()

const title = computed(() => route.meta.title ?? '포트폴리오')
const subtitle = computed(() => route.meta.subtitle ?? '')
const showBankruptcyAction = computed(() => Boolean(route.meta.showBankruptcyAction))

const isBankruptcyModalOpen = ref(false)
const isResetting = ref(false)
const resetError = ref(null)

const openBankruptcyModal = () => {
  resetError.value = null
  isBankruptcyModalOpen.value = true
}

const closeBankruptcyModal = () => {
  if (isResetting.value) return
  isBankruptcyModalOpen.value = false
}

const handleResetConfirm = async () => {
  isResetting.value = true
  resetError.value = null

  try {
    await store.resetPortfolio()
    isBankruptcyModalOpen.value = false
  } catch (err) {
    resetError.value = err.message || '초기화 처리 중 문제가 발생했어요.'
  } finally {
    isResetting.value = false
  }
}
</script>

<template>
  <div
    class="relative flex h-full min-h-0 flex-col gap-4 overflow-hidden px-5 pt-6 pb-3 text-[var(--pf-text)]"
  >
    <img
      :src="portfolioBg"
      alt=""
      class="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover"
    />
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[var(--pf-page-bg)]/75" />

    <header class="flex w-full shrink-0 justify-between gap-3">
      <div class="flex w-full flex-col">
        <div class="flex w-full justify-between">
          <h1 class="text-xl font-bold text-[var(--pf-text)]">{{ title }}</h1>
          <button
            v-if="showBankruptcyAction"
            type="button"
            class="shrink-0 rounded-full border border-[var(--pf-danger-border)] bg-[var(--pf-danger-bg)] px-3 py-1 text-xs font-bold whitespace-nowrap text-[var(--pf-danger-text)]"
            @click="openBankruptcyModal"
          >
            포트폴리오 초기화
          </button>
        </div>
        <p class="mt-2 text-xs text-[var(--pf-text-muted)]">{{ subtitle }}</p>
      </div>
    </header>

    <PortfolioTabs class="shrink-0" />

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <RouterView />
    </div>

    <BankruptcyConfirmModal
      v-if="isBankruptcyModalOpen"
      :is-submitting="isResetting"
      :error-message="resetError"
      @close="closeBankruptcyModal"
      @confirm="handleResetConfirm"
    />
  </div>
</template>
