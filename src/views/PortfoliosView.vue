<script setup>
defineOptions({ name: 'PortfoliosView' })

import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import PortfolioTabs from '@/components/portfolio/PortfolioTabs.vue'
import BankruptcyConfirmModal from '@/components/portfolio/BankruptcyConfirmModal.vue'
import { usePortfolioStore } from '@/store/portfolioStore.js'

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
  <div class="cork-board flex h-full flex-col overflow-hidden">
    <header class="chalk-header shrink-0 px-5 pt-5">
      <div class="flex w-full items-center justify-between gap-2">
        <div class="min-w-0">
          <h1
            class="chalk-header__title truncate font-pen text-[26px] leading-none font-normal text-[var(--chalk-text)]"
          >
            {{ title }}
          </h1>
          <p class="mt-1 font-serif text-[10px] tracking-wide text-[var(--chalk-text-muted)]">
            {{ subtitle }}
          </p>
        </div>

        <!-- 도장(rotate) 스타일 대신 PointMarketView의 "교환 내역" 버튼과 같은
             둥근 필(pill) 디자인으로 통일(#84). -->
        <button
          v-if="showBankruptcyAction"
          type="button"
          class="shrink-0 rounded-full border-[0.5px] border-[rgba(193,127,36,0.35)] bg-[#fff8ec] px-3 py-1.5 font-serif text-xs font-bold text-[#c17f24]"
          @click="openBankruptcyModal"
        >
          파산 신청
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
