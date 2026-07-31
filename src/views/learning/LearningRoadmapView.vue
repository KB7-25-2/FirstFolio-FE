<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useStudyStore } from '@/store/studyStore.js'
import LearningLayout from '@/components/learning/LearningLayout.vue'
import LearningPageHeader from '@/components/learning/LearningPageHeader.vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'

const studyStore = useStudyStore()
const router = useRouter()
const { curriculumItems } = storeToRefs(studyStore)

const isLoading = ref(false)
const error = ref(null)

onMounted(async () => {
  if (curriculumItems.value.length) return

  isLoading.value = true
  error.value = null
  try {
    await studyStore.fetchCurriculum()
  } catch (err) {
    error.value = err?.message || '학습 로드맵을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
})

const foundationItem = computed(() =>
  curriculumItems.value.find((item) => item.chapterType === 'FOUNDATION'),
)

const coreItems = computed(() =>
  curriculumItems.value
    .filter((item) => item.chapterType === 'CORE')
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder),
)

const statusLabel = (status) => {
  if (status === 'COMPLETED') return '완료'
  if (status === 'ACTIVE') return '진행 중'
  if (status === 'LOCKED') return '잠김'
  return status
}

const accentClass = (item) => {
  const map = {
    yellow: 'bg-[#f6e7a8]',
    blue: 'bg-[#cfe4f5]',
    mint: 'bg-[#d4f0e4]',
    purple: 'bg-[#e4d7f5]',
    cream: 'bg-[#f5edd9]',
  }
  return map[item.accent] ?? map.cream
}

const openMainChapter = (item) => {
  if (item.status === 'LOCKED') return
  router.push({
    name: 'learning-main-chapter',
    params: { mainChapterId: item.mainChapterId },
  })
}
</script>

<template>
  <LearningLayout>
    <template #header>
      <LearningPageHeader title="학습 로드맵" />
    </template>

    <p v-if="isLoading" class="font-serif text-sm text-[rgba(245,237,217,0.55)]">불러오는 중…</p>
    <p v-else-if="error" class="font-serif text-sm text-red-300">{{ error }}</p>

    <template v-else>
      <!-- 필수 선행: 포트폴리오 기초 -->
      <section v-if="foundationItem" class="mb-6">
        <p class="mb-2 font-serif text-[11px] font-bold text-[rgba(245,237,217,0.7)]">
          필수 선행 과정
        </p>
        <button
          type="button"
          class="w-full text-left memo-selectable"
          :disabled="foundationItem.status === 'LOCKED'"
          @click="openMainChapter(foundationItem)"
        >
          <LearningNotePaper :surface-class="accentClass(foundationItem)">
            <div class="px-4 py-4">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-serif text-[10px] text-[rgba(139,100,60,0.6)]">FOUNDATION</p>
                  <h2 class="mt-1 font-pen text-[24px] leading-none text-[#212b5c]">
                    {{ foundationItem.title }}
                  </h2>
                  <p class="mt-2 font-serif text-[12px] text-[rgba(61,31,8,0.7)]">
                    {{ foundationItem.description }}
                  </p>
                </div>
                <span
                  class="shrink-0 rounded border border-[rgba(139,100,60,0.35)] px-2 py-0.5 font-serif text-[10px] text-[rgba(61,31,8,0.75)]"
                >
                  {{ statusLabel(foundationItem.status) }}
                </span>
              </div>
              <p class="mt-3 font-serif text-[11px] text-[rgba(139,100,60,0.55)]">
                {{ foundationItem.subChapterCount }}개 과정 · {{ foundationItem.progressPercent }}%
              </p>
            </div>
          </LearningNotePaper>
        </button>
      </section>

      <!-- 선택형 대단원 -->
      <section>
        <div class="mb-2 flex items-baseline justify-between">
          <p class="font-serif text-[11px] font-bold text-[rgba(245,237,217,0.7)]">금융 카테고리</p>
          <p class="font-serif text-[10px] text-[rgba(245,237,217,0.45)]">
            {{ coreItems.length }}개 영역
          </p>
        </div>

        <LearningNotePaper surface-class="bg-[#f6e7a8]" class="mb-4">
          <div class="px-4 py-3">
            <p class="font-serif text-[10px] text-[rgba(139,100,60,0.6)]">
              나에게 필요한 금융 공부
            </p>
            <p class="mt-1 font-pen text-[20px] leading-tight text-[#212b5c]">
              어떤 영역부터 학습해볼까요?
            </p>
            <p class="mt-1 font-serif text-[11px] text-[rgba(61,31,8,0.55)]">
              관심 있는 카테고리를 골라 주세요
            </p>
          </div>
        </LearningNotePaper>

        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="item in coreItems"
            :key="item.curriculumItemId"
            type="button"
            class="text-left disabled:cursor-not-allowed disabled:opacity-55 memo-selectable"
            :disabled="item.status === 'LOCKED'"
            @click="openMainChapter(item)"
          >
            <LearningNotePaper :surface-class="accentClass(item)" :show-tape="true">
              <div class="flex min-h-[150px] flex-col px-3 py-3">
                <div class="flex items-start justify-between">
                  <span class="text-lg" aria-hidden="true">{{ item.icon }}</span>
                  <span class="font-serif text-[10px] text-[rgba(61,31,8,0.55)]">
                    {{ statusLabel(item.status) }}
                  </span>
                </div>
                <h3 class="mt-2 font-pen text-[22px] leading-none text-[#212b5c]">
                  {{ item.title }}
                </h3>
                <p
                  class="mt-2 flex-1 font-serif text-[11px] leading-snug text-[rgba(61,31,8,0.65)]"
                >
                  {{ item.description }}
                </p>
                <div class="mt-3 flex items-center justify-between">
                  <span
                    class="rounded bg-black/5 px-1.5 py-0.5 font-serif text-[10px] text-[rgba(61,31,8,0.65)]"
                  >
                    {{ item.subChapterCount }}개 과정
                  </span>
                  <span class="font-serif text-sm text-[rgba(61,31,8,0.45)]">›</span>
                </div>
              </div>
            </LearningNotePaper>
          </button>
        </div>

        <p class="mt-5 text-center font-pen text-[16px] text-[rgba(245,237,217,0.55)]">
          카테고리를 골라 학습 지도를 펼쳐보자!
        </p>
      </section>
    </template>
  </LearningLayout>
</template>
