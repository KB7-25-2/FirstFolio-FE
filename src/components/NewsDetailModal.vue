<script setup>
import { computed, watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useNewsStore } from '@/store/newsStore.js'
import { formatRelativeTime } from '@/utils/date.js'

const newsStore = useNewsStore()
const { selectedNews } = storeToRefs(newsStore)

const isOpen = computed(() => Boolean(selectedNews.value))

const metaLabel = computed(() => {
  if (!selectedNews.value) return ''
  const time = formatRelativeTime(selectedNews.value.published_at)
  return time ? `${selectedNews.value.source_name} · ${time}` : selectedNews.value.source_name
})

const close = () => {
  newsStore.clearSelection()
}

const openSource = () => {
  const url = selectedNews.value?.source_url
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

watch(isOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="news-zoom">
      <div
        v-if="isOpen && selectedNews"
        class="news-zoom-modal fixed inset-0 z-[100] flex items-center justify-center px-4"
        role="dialog"
        aria-modal="true"
        :aria-label="selectedNews.title"
      >
        <div
          class="news-zoom-modal__dim absolute inset-0 bg-[var(--news-modal-dim)]"
          aria-hidden="true"
          @click="close"
        />

        <div
          class="news-zoom-modal__card relative z-10 flex max-h-[82dvh] w-full max-w-[min(360px,var(--mobile-width))] flex-col overflow-hidden rounded-[4px] border border-[rgba(139,100,60,0.35)] bg-[var(--news-modal-surface)] shadow-[0_12px_36px_rgba(0,0,0,0.45)]"
        >
          <div class="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-3">
            <div class="flex items-center gap-1.5">
              <span class="h-px flex-1 bg-[var(--news-line)]" />
              <span
                class="shrink-0 font-serif text-[10px] tracking-wide text-[var(--news-masthead)]"
              >
                {{ selectedNews.source_name }}
              </span>
              <span class="h-px flex-1 bg-[var(--news-line)]" />
            </div>

            <h2 class="mt-2.5 font-serif text-[18px] leading-snug font-bold text-[var(--news-ink)]">
              {{ selectedNews.title }}
            </h2>

            <p class="mt-1.5 font-serif text-[11px] text-[var(--news-muted)]">
              {{ metaLabel }}
            </p>

            <div
              class="mt-3 aspect-[16/10] w-full overflow-hidden rounded-[3px] border border-[var(--news-modal-image-border)] shadow-[2px_3px_8px_rgba(0,0,0,0.2)]"
            >
              <img
                :src="selectedNews.image_url"
                :alt="selectedNews.title"
                class="size-full object-cover"
              />
            </div>

            <div class="mt-4">
              <span
                class="rounded-[4px] bg-[var(--news-modal-badge)] px-1.5 py-0.5 font-serif text-[10px] font-bold text-[var(--news-modal-badge-text)]"
              >
                AI 요약
              </span>
              <p class="mt-2 font-serif text-[13px] leading-relaxed text-[var(--news-ink)]">
                {{ selectedNews.summary }}
              </p>
            </div>
          </div>

          <div class="shrink-0 border-t border-[rgba(139,100,60,0.18)] px-4 pt-3 pb-4">
            <button
              type="button"
              class="btn-hover flex h-11 w-full items-center justify-center gap-1.5 rounded-[10px] bg-[var(--news-modal-cta)] font-serif text-[14px] font-bold text-[var(--news-modal-cta-text)]"
              @click="openSource"
            >
              원문 보러가기
              <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              data-testid="news-modal-close"
              class="btn-hover mt-2 w-full py-2 text-center font-serif text-[13px] text-[var(--news-muted)]"
              @click="close"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
