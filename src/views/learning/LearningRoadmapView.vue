<script setup>
import LearningLayout from '@/components/learning/LearningLayout.vue'
import LearningPageHeader from '@/components/learning/LearningPageHeader.vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'
import BaseLoading from '@/components/BaseLoading.vue'
import { useLearningRoadmap } from '@/composables/useLearningRoadmap.js'

const { isLoading, error, foundationCard, coreCards, statusLabel, accentClass, openMainChapter } =
  useLearningRoadmap()
</script>

<template>
  <LearningLayout>
    <template #header>
      <LearningPageHeader title="학습 로드맵" />
    </template>

    <BaseLoading v-if="isLoading" />
    <p v-else-if="error" class="font-serif text-sm text-red-300">{{ error }}</p>

    <template v-else>
      <!-- 필수 선행: 포트폴리오 기초 -->
      <section v-if="foundationCard" class="mb-6 px-2">
        <p class="mb-2 font-serif text-[11px] font-bold text-[var(--cork-ink)]">필수 선행 과정</p>
        <button
          type="button"
          class="memo-selectable w-full text-left"
          :disabled="foundationCard.status === 'LOCKED'"
          @click="openMainChapter(foundationCard)"
        >
          <LearningNotePaper :surface-class="accentClass(foundationCard.accent)">
            <div class="px-4 py-4">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-serif text-[10px] text-[rgba(139,100,60,0.6)]">FOUNDATION</p>
                  <h2 class="mt-1 font-pen text-[24px] leading-none text-[#212b5c]">
                    {{ foundationCard.title }}
                  </h2>
                  <p class="mt-2 font-serif text-[12px] text-[rgba(61,31,8,0.7)]">
                    {{ foundationCard.description }}
                  </p>
                </div>
                <span
                  class="shrink-0 rounded border border-[rgba(139,100,60,0.35)] px-2 py-0.5 font-serif text-[10px] text-[rgba(61,31,8,0.75)]"
                >
                  {{ statusLabel(foundationCard.status) }}
                </span>
              </div>
              <p class="mt-3 font-serif text-[11px] text-[rgba(139,100,60,0.55)]">
                진행률 {{ foundationCard.progressPercent }}%
              </p>
            </div>
          </LearningNotePaper>
        </button>
      </section>

      <!-- 선택형 대단원 -->
      <section>
        <div class="mb-2 flex items-baseline justify-between px-2">
          <p class="font-serif text-[11px] font-bold text-[var(--cork-ink)]">금융 카테고리</p>
          <p class="font-serif text-[10px] text-[var(--cork-ink-faint)]">
            {{ coreCards.length }}개 영역
          </p>
        </div>

        <LearningNotePaper surface-class="bg-[#f6e7a8]" class="mb-4 px-2">
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

        <div class="grid grid-cols-2 gap-3 px-2">
          <button
            v-for="item in coreCards"
            :key="item.curriculumItemId"
            type="button"
            class="memo-selectable text-left disabled:cursor-not-allowed disabled:opacity-55"
            :disabled="item.status === 'LOCKED'"
            @click="openMainChapter(item)"
          >
            <LearningNotePaper :surface-class="accentClass(item.accent)" :show-tape="true">
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
                    진행률 {{ item.progressPercent }}%
                  </span>
                  <span class="font-serif text-sm text-[rgba(61,31,8,0.45)]">›</span>
                </div>
              </div>
            </LearningNotePaper>
          </button>
        </div>

        <p class="mt-5 text-center font-pen text-[16px] text-[var(--cork-ink-muted)]">
          카테고리를 골라 학습 지도를 펼쳐보자!
        </p>
      </section>
    </template>
  </LearningLayout>
</template>
