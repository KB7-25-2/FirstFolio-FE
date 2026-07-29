<script setup>
import AppNavbar from '@/components/AppNavbar.vue'
</script>

<template>
  <div class="relative mx-auto flex mobile-frame flex-col overflow-hidden">
    <main class="flex-1 overflow-y-auto">
      <slot />
    </main>
    <AppNavbar />
  </div>
</template>
