<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/store/authStore.js'
import { useUserStore } from '@/store/userStore.js'
import '@/assets/styles/admin.css'

const NAV_ITEMS = [
  { name: 'admin-dashboard', label: '대시보드', path: '/admin' },
  { name: 'admin-curriculum', label: '커리큘럼', path: '/admin/curriculum' },
  { name: 'admin-quiz', label: '퀴즈', path: '/admin/quiz' },
  { name: 'admin-products', label: '모의 상품', path: '/admin/products' },
]

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const { nickname, email } = storeToRefs(userStore)

const activeName = computed(() => route.name)

const goTo = (item) => {
  if (item.disabled) return
  router.push(item.path)
}

const handleLogout = async () => {
  await authStore.logout()
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-sidebar__brand">
        <p class="admin-sidebar__brand-kicker">FirstFolio</p>
        <p class="admin-sidebar__brand-title">Admin Console</p>
      </div>

      <nav class="admin-sidebar__nav" aria-label="관리자 메뉴">
        <button
          v-for="item in NAV_ITEMS"
          :key="item.name"
          type="button"
          class="admin-nav-item"
          :class="{ 'is-active': activeName === item.name }"
          :disabled="item.disabled"
          :aria-current="activeName === item.name ? 'page' : undefined"
          @click="goTo(item)"
        >
          <span>{{ item.label }}</span>
          <span v-if="item.disabled" class="admin-nav-item__badge">Soon</span>
        </button>
      </nav>

      <div class="admin-sidebar__footer">
        <p class="admin-sidebar__user-name">{{ nickname || '관리자' }}</p>
        <p class="admin-sidebar__user-email">{{ email }}</p>
        <button type="button" class="admin-sidebar__logout" @click="handleLogout">로그아웃</button>
      </div>
    </aside>

    <div class="admin-main">
      <header class="admin-topbar">
        <h1 class="admin-topbar__title">{{ route.meta.title || '관리자' }}</h1>
      </header>
      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>
