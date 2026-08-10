<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/store/authStore.js'
import { useUserStore } from '@/store/userStore.js'
import { formatKoreanDate } from '@/utils/date.js'
import PortfolioSummary from '@/components/PortfolioSummary.vue'
import StudyNote from '@/components/StudyNote.vue'
import NewsScrap from '@/components/NewsScrap.vue'
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
  <div class="flex h-full flex-col overflow-hidden bg-[#0d1117]">
    <header class="relative shrink-0 px-5 pt-6 pb-3 pr-[50px]">
      <p class="font-serif text-[10px] text-[rgba(245,237,217,0.55)]">
        {{ todayLabel }}
      </p>
      <div class="mt-1 flex items-center gap-1">
        <h1 class="min-w-0 font-serif text-[21px] font-black text-[#f5edd9]">
          {{ greeting }}
        </h1>
        <button
          type="button"
          class="btn-hover flex size-8 shrink-0 items-center justify-center rounded-md text-[rgba(245,237,217,0.55)] hover:bg-white/5 hover:text-[#f5edd9]"
          aria-label="내 프로필"
          @click="openProfile"
        >
          <font-awesome-icon icon="fa-solid fa-user" class="text-[14px]" />
        </button>
        <button
          type="button"
          class="btn-hover flex size-8 shrink-0 items-center justify-center rounded-md text-[rgba(245,237,217,0.55)] hover:bg-white/5 hover:text-[#f5edd9]"
          aria-label="로그아웃"
          @click="openLogoutConfirm"
        >
          <font-awesome-icon icon="fa-solid fa-arrow-right-from-bracket" class="text-[14px]" />
        </button>
      </div>
      <div
        class="absolute top-5 right-5 flex rotate-5 items-center justify-center rounded border-[1.5px] border-[rgba(193,127,36,0.8)] px-2 py-[3px]"
        aria-hidden="true"
      >
        <span
          class="font-serif text-[10px] leading-none font-black whitespace-nowrap text-[rgba(193,127,36,0.9)]"
        >
          오늘 출석 완료
        </span>
      </div>
    </header>

    <div class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-5 pb-8">
      <div class="flex justify-center">
        <PortfolioSummary />
      </div>

      <div>
        <h2 class="mb-3 font-serif text-[12px] font-bold text-[rgba(245,237,217,0.9)]">
          현재 학습 현황
        </h2>
        <div class="flex justify-center pt-1">
          <StudyNote />
        </div>
      </div>

      <NewsScrap />
    </div>

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
