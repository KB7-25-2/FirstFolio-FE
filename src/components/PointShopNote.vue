<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/userStore.js'
import MemoPin from '@/components/MemoPin.vue'

const userStore = useUserStore()
const router = useRouter()
const { pointBalanceDisplay } = storeToRefs(userStore)

onMounted(() => {
  userStore.fetchProfile()
})

const goPointMarket = () => {
  router.push({ name: 'point-market' })
}
</script>

<template>
  <div class="relative w-full max-w-[346px]">
    <button
      type="button"
      class="memo-selectable relative z-10 w-full text-left"
      aria-label="포인트 상점으로 이동"
      @click="goPointMarket"
    >
      <MemoPin side="right" tone="gold" />

      <section
        class="relative w-full rotate-[1.2deg] overflow-hidden rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.55)] bg-[var(--portfolio-shop-paper)] shadow-[0_4px_12px_rgba(0,0,0,0.28)]"
      >
        <div
          class="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[var(--portfolio-shop)]"
          aria-hidden="true"
        />

        <div class="relative flex items-center gap-3 px-4 pt-4 pb-3.5">
          <div
            class="flex size-11 shrink-0 items-center justify-center rounded-full border-[0.5px] border-[rgba(193,127,36,0.45)] bg-[#fff8ec]"
            aria-hidden="true"
          >
            <font-awesome-icon
              icon="fa-solid fa-shop"
              class="text-[16px] text-[var(--portfolio-shop)]"
            />
          </div>

          <div class="min-w-0 flex-1">
            <p class="font-serif text-[10px] font-bold tracking-wide text-[rgba(193,127,36,0.85)]">
              포인트 상점
            </p>
            <p
              class="mt-1 font-serif font-bold text-[22px] leading-none text-[var(--portfolio-shop)]"
            >
              {{ pointBalanceDisplay }}
              <span class="font-serif text-[12px] font-bold">P</span>
            </p>
            <p class="mt-1.5 font-serif text-[11px] text-[rgba(41,33,26,0.55)]">
              모은 포인트로 혜택을 바꿔보세요
            </p>
          </div>

          <span
            class="shrink-0 rounded bg-[var(--portfolio-shop)] px-2.5 py-1.5 font-serif text-[11px] font-bold text-[#fff8ec]"
          >
            상점 →
          </span>
        </div>
      </section>
    </button>
  </div>
</template>
