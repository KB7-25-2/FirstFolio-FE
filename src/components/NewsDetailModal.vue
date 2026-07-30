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
    <div
      v-if="isOpen && selectedNews"
      class="fixed inset-0 z-[100] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      :aria-label="selectedNews.title"
    >
      <!-- Dim -->
      <div class="absolute inset-0 bg-[var(--news-modal-dim)]" aria-hidden="true" @click="close" />

      <!-- Bottom sheet -->
      <div
        class="relative z-10 flex max-h-[70dvh] w-full max-w-[var(--mobile-width)] flex-col overflow-hidden rounded-t-[20px] bg-[var(--news-modal-surface)] shadow-[0_-8px_32px_rgba(0,0,0,0.45)]"
      >
        <!-- Handle -->
        <div class="flex shrink-0 justify-center pt-3 pb-1" aria-hidden="true">
          <span class="h-1 w-10 rounded-full bg-[var(--news-modal-handle)]" />
        </div>

        <div class="flex-1 overflow-y-auto px-5 pt-2 pb-4">
          <!-- Title -->
          <h2 class="font-serif text-[20px] leading-snug font-bold text-[var(--news-ink)]">
            {{ selectedNews.title }}
          </h2>

          <!-- Meta -->
          <p class="mt-2 font-serif text-[11px] text-[var(--news-muted)]">
            {{ metaLabel }}
          </p>

          <!-- Banner image -->
          <div
            class="mt-4 aspect-[16/10] w-full overflow-hidden rounded-[4px] border border-[var(--news-modal-image-border)] shadow-[2px_3px_8px_rgba(0,0,0,0.2)]"
          >
            <img
              :src="selectedNews.image_url"
              :alt="selectedNews.title"
              class="size-full object-cover"
            />
          </div>

          <!-- AI 요약 -->
          <div class="mt-5">
            <div class="mb-2 flex items-center gap-2">
              <span
                class="rounded-[4px] bg-[var(--news-modal-badge)] px-1.5 py-0.5 font-serif text-[10px] font-bold text-[var(--news-modal-badge-text)]"
              >
                AI 요약
              </span>
            </div>
            <p class="line-clamp-3 font-serif text-[13px] leading-relaxed text-[var(--news-ink)]">
              {{ selectedNews.summary }}
            </p>
          </div>

          <!-- CTA -->
          <button
            type="button"
            class="mt-6 flex h-12 w-full items-center justify-center gap-1.5 rounded-[10px] bg-[var(--news-modal-cta)] font-serif text-[14px] font-bold text-[var(--news-modal-cta-text)]"
            @click="openSource"
          >
            원문 보러가기
            <span aria-hidden="true">→</span>
          </button>

          <!-- Close -->
          <button
            type="button"
            data-testid="news-modal-close"
            class="mt-3 mb-2 w-full py-2 text-center font-serif text-[13px] text-[var(--news-muted)]"
            @click="close"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
