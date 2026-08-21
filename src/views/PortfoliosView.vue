<script setup>
defineOptions({ name: 'PortfoliosView' })

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import PortfolioTabs from '@/components/portfolio/PortfolioTabs.vue'
import BankruptcyConfirmModal from '@/components/portfolio/BankruptcyConfirmModal.vue'
import { usePortfolioStore } from '@/store/portfolioStore.js'

const route = useRoute()
const store = usePortfolioStore()

const title = computed(() => route.meta.title ?? '포트폴리오')
const subtitle = computed(() => route.meta.subtitle ?? '')
const showBankruptcyAction = computed(() => Boolean(route.meta.showBankruptcyAction))
const marketSession = computed(() => store.marketSession)

const isBankruptcyModalOpen = ref(false)
const isResetting = ref(false)
const resetError = ref(null)

onMounted(() => {
  store.startProductPricePolling()
})

onUnmounted(() => {
  store.stopProductPricePolling()
})

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
  <div class="cork-board flex h-full flex-col overflow-hidden">
    <header class="chalk-header shrink-0 px-5 pt-4">
      <div class="flex w-full items-center justify-between gap-2">
        <div class="min-w-0">
          <p class="font-serif text-[10px] tracking-wide text-[var(--chalk-text-muted)]">
            {{ subtitle }}
          </p>
          <div class="mt-1 flex min-w-0 items-center gap-2">
            <h1
              class="chalk-header__title truncate font-pen text-[26px] leading-none font-normal text-[var(--chalk-text)]"
            >
              {{ title }}
            </h1>
            <span
              class="shrink-0 rounded-full px-1.5 py-0.5 font-serif text-[9px] font-bold"
              :class="
                marketSession.isOpen
                  ? 'bg-[rgba(89,140,82,0.28)] text-[#d7f0cf]'
                  : 'bg-[rgba(240,217,160,0.2)] text-[var(--chalk-text-muted)]'
              "
              :title="marketSession.scheduleLabel"
            >
              {{ marketSession.label }}
            </span>
          </div>
        </div>

        <button
          v-if="showBankruptcyAction"
          type="button"
          class="chalk-header__stamp flex shrink-0 rotate-[-4deg] items-center justify-center rounded px-2.5 py-1"
          style="background: rgba(240, 217, 160, 0.22)"
          @click="openBankruptcyModal"
        >
          <span class="font-pen text-[13px] leading-none whitespace-nowrap">파산 신청</span>
        </button>
      </div>
    </header>

    <div class="flex min-h-0 flex-1 flex-col gap-4 px-5 pt-5">
      <div class="shrink-0">
        <PortfolioTabs />
      </div>
      <div class="relative min-h-0 flex-1">
        <RouterView />
      </div>
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
