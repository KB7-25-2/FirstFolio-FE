<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/userStore.js'
import { useAuthStore } from '@/store/authStore.js'
import { useNavTabs } from '@/composables/useNavTabs.js'
import BaseConfirmModal from '@/components/BaseConfirmModal.vue'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'profile-click'])

const userStore = useUserStore()
const { nickname, greeting, pointBalanceDisplay } = storeToRefs(userStore)
const authStore = useAuthStore()
const { tabs, isActive, isTabLocked, portfolioLockedMessage, navigate } = useNavTabs()

const avatarInitial = computed(() => nickname.value?.trim()?.charAt(0)?.toUpperCase() || '')

const close = () => emit('close')

const goTo = async (path) => {
  await navigate(path)
  close()
}

const openProfile = () => {
  emit('profile-click')
  close()
}

const isLogoutConfirmOpen = ref(false)
const isLoggingOut = ref(false)

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
  <div
    class="fixed inset-0 z-40 transition-opacity duration-300"
    :class="open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'"
    :aria-hidden="!open"
  >
    <div class="absolute inset-0 bg-black/45" @click="close" />

    <aside
      class="app-drawer absolute top-0 left-0 flex h-full w-[78%] max-w-[300px] flex-col transition-transform duration-300"
      :class="open ? 'translate-x-0' : '-translate-x-full'"
      role="dialog"
      aria-modal="true"
      aria-label="메뉴"
    >
      <div class="flex items-center justify-between px-4 pt-5">
        <img src="/logo.png" alt="firstfolio" class="h-5 w-auto" />
        <button type="button" class="app-drawer__close" aria-label="메뉴 닫기" @click="close">
          <font-awesome-icon icon="fa-solid fa-xmark" class="text-[14px]" />
        </button>
      </div>

      <button type="button" class="app-drawer__profile mx-4 mt-4" @click="openProfile">
        <span class="app-drawer__profile-avatar">
          <span v-if="avatarInitial">{{ avatarInitial }}</span>
          <font-awesome-icon v-else icon="fa-solid fa-user" class="text-[14px]" />
        </span>
        <span class="min-w-0 flex-1 text-left">
          <span class="block truncate font-serif text-[13px] font-bold text-[var(--cork-ink)]">
            {{ greeting }}
          </span>
          <span class="mt-0.5 block font-serif text-[11px] text-[var(--cork-ink-muted)]">
            {{ pointBalanceDisplay }} P 보유
          </span>
        </span>
      </button>

      <div class="app-drawer__divider mx-4 mt-4" />

      <nav class="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto px-3" aria-label="전체 메뉴">
        <button
          v-for="tab in tabs"
          :key="tab.name"
          type="button"
          class="app-drawer__nav-item"
          :class="{
            'app-drawer__nav-item--active': isActive(tab.name),
            'opacity-50': isTabLocked(tab.name),
          }"
          :aria-disabled="isTabLocked(tab.name) ? 'true' : undefined"
          :title="isTabLocked(tab.name) ? portfolioLockedMessage : undefined"
          @click="goTo(tab.path)"
        >
          <font-awesome-icon
            :icon="isTabLocked(tab.name) ? 'fa-solid fa-lock' : tab.icon"
            class="w-4 text-[14px]"
          />
          <span class="font-serif text-[13px] font-bold">{{ tab.label }}</span>
        </button>
      </nav>

      <div class="app-drawer__divider mx-4" />

      <button type="button" class="app-drawer__logout mx-4 my-4" @click="openLogoutConfirm">
        <font-awesome-icon icon="fa-solid fa-arrow-right-from-bracket" class="text-[13px]" />
        <span class="font-serif text-[13px] font-bold">로그아웃</span>
      </button>
    </aside>
  </div>

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
</template>
