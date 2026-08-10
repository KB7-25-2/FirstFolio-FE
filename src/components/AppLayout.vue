<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'

const route = useRoute()
const hideNavbar = computed(() => route.matched.some((record) => record.meta.hideNavbar === true))
</script>

<template>
  <div class="relative mx-auto flex mobile-frame flex-col overflow-hidden">
    <main class="relative z-0 min-h-0 flex-1 overflow-y-auto hide-scrollbar">
      <RouterView />
    </main>
    <div v-if="!hideNavbar" class="nav-dock pointer-events-none absolute inset-x-0 bottom-0 z-20">
      <div class="nav-content-blur" aria-hidden="true" />
      <div class="pointer-events-auto">
        <AppNavbar />
      </div>
    </div>
  </div>
</template>
