<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/userStore.js'
import brandLogo from '@/assets/auth/brand-logo.png'

defineProps({
  /** 중앙 타이틀 */
  title: {
    type: String,
    default: 'Firstfolio',
  },
})

defineEmits(['menu-click', 'profile-click'])

const userStore = useUserStore()
const { nickname } = storeToRefs(userStore)

const avatarInitial = computed(() => nickname.value?.trim()?.charAt(0)?.toUpperCase() || '')
</script>

<template>
  <header class="app-topbar relative flex h-14 w-full shrink-0 items-center justify-between px-2">
    <button
      type="button"
      class="app-topbar__icon-btn"
      aria-label="메뉴 열기"
      @click="$emit('menu-click')"
    >
      <font-awesome-icon icon="fa-solid fa-bars" class="text-[16px]" />
    </button>

    <div
      class="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5 px-12"
      aria-hidden="true"
    >
      <img :src="brandLogo" alt="" class="h-5 w-5 shrink-0 object-contain" />
      <span class="truncate font-serif text-[16px] leading-none font-bold text-[var(--cork-ink)]">
        {{ title }}
      </span>
    </div>

    <button
      type="button"
      class="app-topbar__avatar"
      aria-label="내 정보"
      @click="$emit('profile-click')"
    >
      <span v-if="avatarInitial">{{ avatarInitial }}</span>
      <font-awesome-icon v-else icon="fa-solid fa-user" class="text-[12px]" />
    </button>
  </header>
</template>
