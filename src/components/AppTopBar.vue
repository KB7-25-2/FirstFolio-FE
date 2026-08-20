<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { BRAND_WORDMARK_SRC } from '@/constants/brandAssets.js'
import { useUserStore } from '@/store/userStore.js'

defineProps({
  /** 중앙 타이틀 */
  title: {
    type: String,
    default: 'firstfolio',
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
      <img :src="BRAND_WORDMARK_SRC" :alt="title" class="h-6 w-auto max-w-[132px] object-contain" />
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
