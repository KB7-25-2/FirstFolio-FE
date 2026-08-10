<script setup>
import ParagraphBlock from '@/components/learning/ParagraphBlock.vue'
import ConclusionCard from '@/components/learning/ConclusionCard.vue'
import DefinitionBlock from '@/components/learning/DefinitionBlock.vue'
import LearnMoreEntry from '@/components/learning/LearnMoreEntry.vue'

defineProps({
  title: {
    type: String,
    required: true,
  },
  /** @type {import('@/types/study.js').LessonBlock[]} */
  blocks: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['open-learn-more'])
</script>

<template>
  <div class="relative flex flex-col gap-3 px-[18px] py-4">
    <div>
      <p class="font-serif text-[9px] font-black tracking-wide text-[rgba(139,100,60,0.5)]">
        TEXTBOOK · 핵심 개념
      </p>
      <p class="mt-1 font-serif font-bold text-[28px] leading-tight text-[#212b5c]">
        {{ title }}
      </p>
    </div>

    <template v-for="(block, index) in blocks" :key="`${block.type}-${index}`">
      <ParagraphBlock v-if="block.type === 'text'" :text="block.content" />
      <ConclusionCard
        v-else-if="block.type === 'conclusion'"
        :formula="block.formula"
        :note="block.note || ''"
      />
      <DefinitionBlock
        v-else-if="block.type === 'definition'"
        :term="block.term"
        :body="block.body"
      />
      <div v-else-if="block.type === 'learn_more'" class="flex justify-end pt-1">
        <LearnMoreEntry
          :label="block.chipLabel || '더 알아보기'"
          :subtitle="block.chipSubtitle || ''"
          @open="$emit('open-learn-more', block)"
        />
      </div>
    </template>
  </div>
</template>
