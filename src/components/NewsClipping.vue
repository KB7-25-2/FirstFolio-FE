<script setup>
import { computed } from 'vue'
import { formatRelativeTime } from '@/utils/date.js'
import MemoPin from '@/components/MemoPin.vue'

const props = defineProps({
  /** @type {import('vue').PropType<import('@/types/news.js').FinancialNewsItem>} */
  item: {
    type: Object,
    required: true,
  },
  /** 압정 위치 */
  pinSide: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right', 'none'].includes(value),
  },
})

defineEmits(['select'])

const relativeTime = computed(() => formatRelativeTime(props.item.published_at))
</script>

<template>
  <button
    type="button"
    class="memo-selectable relative w-full max-w-[344px] text-left"
    @click="$emit('select', item.financial_news_id)"
  >
    <MemoPin v-if="pinSide !== 'none'" :side="pinSide" tone="news" />

    <article
      class="relative flex h-[111px] w-full overflow-hidden rounded-[2px] bg-[var(--news-surface)] shadow-[0_3px_8px_rgba(0,0,0,0.35)]"
      :class="pinSide === 'right' ? 'rotate-[0.6deg]' : '-rotate-[0.8deg]'"
    >
      <!-- 본문 -->
      <div class="flex min-w-0 flex-1 flex-col px-3 pt-2.5 pb-2">
        <!-- Masthead: ── 출처 ── -->
        <div class="flex items-center gap-1.5">
          <span class="h-px flex-1 bg-[var(--news-line)]" />
          <span class="shrink-0 font-serif text-[9px] tracking-wide text-[var(--news-masthead)]">
            {{ item.source_name }}
          </span>
          <span class="h-px flex-1 bg-[var(--news-line)]" />
        </div>

        <!-- 제목 -->
        <h3
          class="mt-1.5 line-clamp-2 font-serif text-[14px] leading-[1.35] font-bold text-[var(--news-ink)]"
        >
          {{ item.title }}
        </h3>

        <!-- 메타 -->
        <p class="mt-auto pt-1 font-serif text-[9px] text-[var(--news-muted)]">
          금융뉴스<span v-if="relativeTime"> · {{ relativeTime }}</span>
        </p>
      </div>

      <!-- 배너 이미지 -->
      <div
        class="relative mr-3 mt-3 size-[90px] shrink-0 overflow-hidden shadow-[1px_2px_4px_rgba(0,0,0,0.25)]"
      >
        <img :src="item.image_url" :alt="item.title" class="size-full object-cover" />
      </div>
    </article>
  </button>
</template>
