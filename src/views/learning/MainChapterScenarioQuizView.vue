<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LearningLayout from '@/components/learning/LearningLayout.vue'
import LearningPageHeader from '@/components/learning/LearningPageHeader.vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'

const route = useRoute()
const router = useRouter()

const mainChapterId = computed(() => Number(route.params.mainChapterId))

const close = () => {
  router.push({
    name: 'learning-main-chapter',
    params: { mainChapterId: mainChapterId.value },
  })
}
</script>

<template>
  <LearningLayout immersive>
    <template #header>
      <LearningPageHeader title="시나리오 퀴즈" :eyebrow="`대단원 #${mainChapterId}`">
        <template #actions>
          <button
            type="button"
            class="font-serif text-lg text-[#f5edd9]"
            aria-label="닫기"
            @click="close"
          >
            ✕
          </button>
        </template>
      </LearningPageHeader>
    </template>

    <LearningNotePaper surface-class="bg-[#f0e6d4]">
      <div class="px-5 py-8 text-center">
        <p class="font-serif text-lg font-bold tracking-[0.2em] text-[#2c1810]">공 문 서</p>
        <p class="mt-4 font-serif text-sm text-[rgba(61,31,8,0.7)]">
          대단원 시나리오 퀴즈 화면 준비 중
        </p>
        <button
          type="button"
          class="mt-8 w-full rounded bg-[var(--nav-active-primary)] py-3 font-serif text-sm font-bold text-[#fff8ec]"
          disabled
        >
          게임 시작 →
        </button>
      </div>
    </LearningNotePaper>
  </LearningLayout>
</template>
