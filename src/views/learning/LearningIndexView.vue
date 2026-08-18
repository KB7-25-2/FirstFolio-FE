<script setup>
import LearningLayout from '@/components/learning/LearningLayout.vue'
import LearningPageHeader from '@/components/learning/LearningPageHeader.vue'
</script>

<template>
  <LearningLayout>
    <template #header>
      <LearningPageHeader title="학습" subtitle="금융 커리큘럼으로 차근차근" />
    </template>
    <p class="font-serif text-sm text-[var(--cork-ink-muted)]">학습 화면입니다.</p>
  </LearningLayout>
</template>
