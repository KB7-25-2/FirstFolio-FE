<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/store/authStore.js'
import { useUserStore } from '@/store/userStore.js'

const NAV_ITEMS = [
  { name: 'admin-dashboard', label: '대시보드', path: '/admin' },
  { name: 'admin-curriculum', label: '커리큘럼', path: '/admin/curriculum', disabled: true },
  { name: 'admin-quiz', label: '퀴즈', path: '/admin/quiz', disabled: true },
  { name: 'admin-products', label: '모의 상품', path: '/admin/products', disabled: true },
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
  <div class="admin-shell flex min-h-dvh bg-[#f4f5f7] text-[#1a1d23]">
    <aside
      class="flex w-[220px] shrink-0 flex-col border-r border-[#e2e5eb] bg-[#111827] text-[#e5e7eb]"
    >
      <div class="border-b border-white/10 px-4 py-5">
        <p class="text-[10px] tracking-[0.18em] text-white/45">FIRSTFOLIO</p>
        <p class="mt-1 text-[15px] font-semibold tracking-tight">Admin</p>
      </div>

      <nav class="flex flex-1 flex-col gap-0.5 px-2 py-3" aria-label="관리자 메뉴">
        <button
          v-for="item in NAV_ITEMS"
          :key="item.name"
          type="button"
          class="rounded-md px-3 py-2.5 text-left text-[13px] transition-colors"
          :class="[
            activeName === item.name
              ? 'bg-white/10 font-semibold text-white'
              : 'text-white/70 hover:bg-white/5 hover:text-white',
            item.disabled ? 'cursor-not-allowed opacity-40 hover:bg-transparent' : '',
          ]"
          :disabled="item.disabled"
          :aria-current="activeName === item.name ? 'page' : undefined"
          @click="goTo(item)"
        >
          {{ item.label }}
          <span v-if="item.disabled" class="ml-1 text-[10px] text-white/40">soon</span>
        </button>
      </nav>

      <div class="border-t border-white/10 px-4 py-4">
        <p class="truncate text-[12px] font-medium text-white/90">
          {{ nickname || '관리자' }}
        </p>
        <p class="mt-0.5 truncate text-[11px] text-white/45">{{ email }}</p>
        <button
          type="button"
          class="mt-3 text-[12px] text-white/55 underline-offset-2 hover:text-white hover:underline"
          @click="handleLogout"
        >
          로그아웃
        </button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-14 shrink-0 items-center border-b border-[#e2e5eb] bg-white px-6">
        <h1 class="text-[15px] font-semibold tracking-tight text-[#111827]">
          {{ route.meta.title || '관리자' }}
        </h1>
      </header>
      <main class="min-h-0 flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
