<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'

const route = useRoute()
const hideNavbar = computed(() => route.matched.some((record) => record.meta.hideNavbar === true))
</script>

<template>
  <div class="relative mx-auto flex mobile-frame flex-col overflow-hidden">
    <main class="relative z-0 min-h-0 flex-1 overflow-y-auto">
      <RouterView />
    </main>
    <AppNavbar v-if="!hideNavbar" />
  </div>
</template>
