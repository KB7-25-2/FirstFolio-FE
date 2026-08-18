<script setup>
import officialSeal from '@/assets/learning/scenario/official-seal.svg'

defineProps({
  documentTitle: { type: String, default: '공 문 서' },
  docNo: { type: String, default: '' },
  docDate: { type: String, default: '' },
  orgName: { type: String, default: '' },
  title: { type: String, default: '' },
  mission: { type: String, default: '' },
  issuerLabel: { type: String, default: '발행처' },
  issuerName: { type: String, default: '' },
  startLabel: { type: String, default: '게임 시작' },
  disabled: { type: Boolean, default: false },
})

defineEmits(['start'])
</script>

<template>
  <div class="flex flex-col items-center px-1 pt-2 pb-1">
    <div
      class="relative mb-1 flex w-full items-center justify-center border-b border-[rgba(139,100,60,0.2)] pb-2.5"
    >
      <span
        class="absolute top-1 left-1 size-2 rounded bg-[rgba(0,0,0,0.12)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
      />
      <span
        class="absolute top-1 right-1 size-2 rounded bg-[rgba(0,0,0,0.12)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
      />
      <p class="font-serif text-[14px] font-bold tracking-[0.7px] text-[#3d1f08]">
        {{ documentTitle }}
      </p>
    </div>

    <div class="mt-3 flex w-full items-center justify-between">
      <p class="font-serif text-[9px] text-[rgba(139,100,60,0.45)]">{{ docNo }}</p>
      <p class="font-serif text-[9px] text-[rgba(139,100,60,0.45)]">{{ docDate }}</p>
    </div>
    <div class="mt-3 h-px w-full bg-[rgba(139,100,60,0.18)]" />

    <img :src="officialSeal" alt="" class="mt-4 size-14 object-contain" width="56" height="56" />
    <p
      v-if="orgName"
      class="mt-2 font-serif text-[10px] tracking-[1.8px] text-[rgba(139,100,60,0.5)]"
    >
      {{ orgName }}
    </p>

    <div class="mt-3 flex w-full items-center gap-3">
      <div class="h-px flex-1 bg-[rgba(139,100,60,0.28)]" />
      <div class="size-1 rounded-sm bg-[rgba(139,100,60,0.4)]" />
      <div class="h-px flex-1 bg-[rgba(139,100,60,0.28)]" />
    </div>

    <p
      v-if="title"
      class="mt-3 text-center font-serif text-[19px] leading-[26px] font-black tracking-[0.76px] text-[#3d1f08]"
    >
      {{ title }}
    </p>

    <div class="mt-3 flex w-full items-center gap-3">
      <div class="h-px flex-1 bg-[rgba(139,100,60,0.28)]" />
      <div class="size-1 rounded-sm bg-[rgba(139,100,60,0.4)]" />
      <div class="h-px flex-1 bg-[rgba(139,100,60,0.28)]" />
    </div>

    <div
      v-if="mission"
      class="mt-4 w-full rounded-[10px] border-[0.5px] border-dashed border-[rgba(139,100,60,0.22)] bg-[rgba(139,100,60,0.07)] px-3 py-2.5"
    >
      <p class="text-center font-serif text-[11px] leading-[18px] text-[#7a5230]">
        {{ mission }}
      </p>
    </div>

    <div class="mt-4 flex w-full items-end justify-end gap-3">
      <div class="text-right">
        <p class="font-serif text-[9px] text-[rgba(139,100,60,0.4)]">{{ issuerLabel }}</p>
        <p class="mt-0.5 font-serif text-[11px] font-bold text-[#3d1f08]">{{ issuerName }}</p>
      </div>
      <span
        class="-rotate-8 rounded border-[0.5px] border-[rgba(139,69,19,0.5)] px-2 py-1 font-serif text-[9px] font-black tracking-[1px] text-[rgba(139,69,19,0.55)]"
      >
        공인
      </span>
    </div>

    <button
      type="button"
      class="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border-[0.5px] border-[rgba(255,255,255,0.15)] bg-[#c17f24] font-serif text-[14px] font-bold tracking-[0.84px] text-[#fff8ec] shadow-[0_3px_6px_rgba(139,80,20,0.4)] disabled:opacity-60"
      :disabled="disabled"
      @click="$emit('start')"
    >
      {{ startLabel }}
      <span aria-hidden="true">→</span>
    </button>
  </div>
</template>
