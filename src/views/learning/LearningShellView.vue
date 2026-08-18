<script setup>
defineOptions({ name: 'LearningShellView' })

import { RouterView } from 'vue-router'
</script>

<template>
  <div class="cork-board flex h-full min-h-0 flex-col overflow-hidden">
    <RouterView v-slot="{ Component }">
      <KeepAlive :include="['LearningRoadmapView']">
        <component :is="Component" class="h-full min-h-0" />
      </KeepAlive>
    </RouterView>
  </div>
</template>
