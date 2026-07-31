<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useStudyStore } from '@/store/studyStore.js'
import LearningLayout from '@/components/learning/LearningLayout.vue'
import LearningPageHeader from '@/components/learning/LearningPageHeader.vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'

const route = useRoute()
const router = useRouter()
const studyStore = useStudyStore()
const { currentContent } = storeToRefs(studyStore)

const isLoading = ref(false)
const error = ref(null)

const subChapterId = computed(() => Number(route.params.subChapterId))

const loadContent = async () => {
  if (currentContent.value?.subChapterId === subChapterId.value) return

  isLoading.value = true
  error.value = null
  try {
    await studyStore.fetchSubChapterContent(subChapterId.value)
  } catch (err) {
    if (err?.code === 'PREREQUISITE_REQUIRED') {
      error.value = '선행 학습이 필요합니다.'
    } else if (err?.code === 'SUB_CHAPTER_NOT_FOUND') {
      error.value = '공개 소단원을 찾을 수 없습니다.'
    } else {
      error.value = err?.message || '학습 콘텐츠를 불러오지 못했습니다.'
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(loadContent)

const goQuiz = () => {
  router.push({
    name: 'learning-quiz',
    params: { subChapterId: subChapterId.value },
  })
}

const stopLearning = () => {
  router.back()
}
</script>

<template>
  <LearningLayout immersive>
    <template #header>
      <LearningPageHeader
        title="개념 정리"
        :eyebrow="currentContent?.title || `소단원 #${subChapterId}`"
      />
    </template>

    <p v-if="isLoading" class="font-serif text-sm text-[rgba(245,237,217,0.55)]">불러오는 중…</p>
    <p v-else-if="error" class="font-serif text-sm text-red-300">{{ error }}</p>

    <LearningNotePaper v-else ruled surface-class="bg-[#f7f1e4]">
      <div class="px-5 py-6">
        <p class="font-serif text-[11px] tracking-wide text-[rgba(139,100,60,0.55)]">
          TEXTBOOK · 핵심 개념
        </p>
        <p class="mt-3 font-pen text-[22px] text-[#212b5c]">
          {{ currentContent?.title || '학습 진행' }}
        </p>
        <p class="mt-2 font-serif text-sm leading-relaxed text-[rgba(61,31,8,0.75)]">
          콘텐츠 URL은 백엔드가 발급한 접근 정보를 사용합니다. 강좌 페이지 JSON 렌더는 이후 이슈에서
          연결합니다.
        </p>
        <p
          v-if="currentContent?.contentUrl"
          class="mt-4 break-all font-serif text-[10px] text-[rgba(139,100,60,0.45)]"
        >
          {{ currentContent.contentUrl }}
        </p>
        <p class="mt-2 font-serif text-[10px] text-[rgba(139,100,60,0.45)]">
          progress: {{ currentContent?.progress?.status }}
          <template v-if="currentContent?.progress?.lastPageId">
            · {{ currentContent.progress.lastPageId }}
          </template>
        </p>
      </div>
    </LearningNotePaper>

    <template #footer>
      <div class="mt-6 flex gap-3">
        <button
          type="button"
          class="flex-1 rounded bg-[#b33a3a] py-3 font-serif text-sm font-bold text-white"
          @click="stopLearning"
        >
          학습 중단
        </button>
        <button
          type="button"
          class="flex-1 rounded bg-[var(--nav-active-primary)] py-3 font-serif text-sm font-bold text-[#fff8ec] disabled:opacity-50"
          :disabled="!!error"
          @click="goQuiz"
        >
          퀴즈 풀기 →
        </button>
      </div>
    </template>
  </LearningLayout>
</template>
