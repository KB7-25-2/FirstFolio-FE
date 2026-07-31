<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LearningLayout from '@/components/learning/LearningLayout.vue'
import LearningPageHeader from '@/components/learning/LearningPageHeader.vue'

const route = useRoute()
const router = useRouter()

const mainChapterId = computed(() => Number(route.params.mainChapterId))

const goBack = () => {
  router.push({ name: 'learning' })
}
</script>

<template>
  <LearningLayout>
    <template #header>
      <LearningPageHeader title="학습 시간표" :eyebrow="`대단원 #${mainChapterId}`" />
    </template>

    <p class="font-serif text-sm text-[rgba(245,237,217,0.65)]">소단원 선택 화면 준비 중</p>
    <button
      type="button"
      class="mt-4 self-start font-serif text-sm text-[var(--nav-active-primary)] underline"
      @click="goBack"
    >
      ← 로드맵으로
    </button>
  </LearningLayout>
</template>
