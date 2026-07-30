<script setup>
import { RouterView } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
</script>

<template>
  <div class="relative mx-auto flex mobile-frame flex-col overflow-hidden">
    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
    <AppNavbar />
  </div>
</template>
