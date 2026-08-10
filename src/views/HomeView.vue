<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/store/authStore.js'
import { useUserStore } from '@/store/userStore.js'
import { formatKoreanDate } from '@/utils/date.js'
import PortfolioSummary from '@/components/PortfolioSummary.vue'
import StudyNote from '@/components/StudyNote.vue'
import UserProfileModal from '@/components/UserProfileModal.vue'
import BaseConfirmModal from '@/components/BaseConfirmModal.vue'

const authStore = useAuthStore()
const userStore = useUserStore()
const { greeting } = storeToRefs(userStore)

const isProfileOpen = ref(false)
const isLogoutConfirmOpen = ref(false)
const isLoggingOut = ref(false)

const todayLabel = computed(() => formatKoreanDate())

onMounted(() => {
  if (!userStore.profile) {
    userStore.fetchProfile()
  }
})

const openProfile = () => {
  isProfileOpen.value = true
}

const closeProfile = () => {
  isProfileOpen.value = false
}

const openLogoutConfirm = () => {
  isLogoutConfirmOpen.value = true
}

const closeLogoutConfirm = () => {
  if (isLoggingOut.value) return
  isLogoutConfirmOpen.value = false
}

const confirmLogout = async () => {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  try {
    await authStore.logout()
  } finally {
    isLoggingOut.value = false
    isLogoutConfirmOpen.value = false
  }
}
</script>

<template>
  <div class="cork-board flex h-full flex-col overflow-hidden">
    <header class="chalk-header shrink-0 px-5 pr-[50px]">
      <p class="font-serif text-[10px] tracking-wide text-[var(--chalk-text-muted)]">
        {{ todayLabel }}
      </p>
      <div class="mt-1 flex items-center gap-1">
        <h1
          class="chalk-header__title min-w-0 font-pen text-[28px] leading-none font-normal text-[var(--chalk-text)]"
        >
          {{ greeting }}
        </h1>
        <button
          type="button"
          class="btn-hover flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--chalk-text-muted)] hover:bg-white/5 hover:text-[var(--chalk-text)]"
          aria-label="내 프로필"
          @click="openProfile"
        >
          <font-awesome-icon icon="fa-solid fa-user" class="text-[14px]" />
        </button>
        <button
          type="button"
          class="btn-hover flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--chalk-text-muted)] hover:bg-white/5 hover:text-[var(--chalk-text)]"
          aria-label="로그아웃"
          @click="openLogoutConfirm"
        >
          <font-awesome-icon icon="fa-solid fa-arrow-right-from-bracket" class="text-[14px]" />
        </button>
      </div>
      <div
        class="chalk-header__stamp absolute top-1/2 right-5 flex -translate-y-1/2 rotate-5 items-center justify-center rounded px-2 py-[3px]"
        aria-hidden="true"
      >
        <span class="font-pen text-[13px] leading-none whitespace-nowrap">오늘 출석 완료</span>
      </div>
    </header>

    <div class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-5 pb-4">
      <div class="flex justify-center">
        <PortfolioSummary />
      </div>

      <div>
        <h2 class="mb-3 font-serif text-[12px] font-bold text-[var(--cork-ink)]">현재 학습 현황</h2>
        <div class="flex justify-center pt-1">
          <StudyNote />
        </div>
      </div>
    </div>

    <p
      class="shrink-0 px-5 pb-4 text-center font-pen text-[15px] leading-snug text-[var(--cork-ink-muted)]"
    >
      배우며 완성하는 나의 첫 자산 포트폴리오
    </p>

    <UserProfileModal :open="isProfileOpen" @close="closeProfile" />

    <BaseConfirmModal
      v-if="isLogoutConfirmOpen"
      title="로그아웃"
      message="정말 로그아웃 하시겠습니까?"
      confirm-label="로그아웃"
      cancel-label="취소"
      confirm-variant="danger"
      :is-submitting="isLoggingOut"
      @close="closeLogoutConfirm"
      @confirm="confirmLogout"
    />
  </div>
</template>
