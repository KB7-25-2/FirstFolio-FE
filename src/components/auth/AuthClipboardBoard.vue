<script setup>
import paperTexture from '@/assets/auth/paper-texture.png'

defineProps({
  headerTitle: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div
    class="auth-clip-board relative w-[340px] overflow-hidden rounded-[12px] border-[0.8px] border-[var(--auth-clip-border)] p-[0.8px] shadow-[0_6px_28px_rgba(0,0,0,0.45)]"
  >
    <div class="absolute top-[-2px] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
      <div
        class="relative h-[16px] w-[48px] rounded-t-[3px] rounded-b-[2px] shadow-[0_2px_3px_rgba(0,0,0,0.5)]"
        style="
          background-image: linear-gradient(
            180deg,
            rgb(176, 176, 176) 0%,
            rgb(136, 136, 136) 40%,
            rgb(170, 170, 170) 60%,
            rgb(153, 153, 153) 100%
          );
        "
      >
        <div class="absolute top-[3px] left-[5px] h-[3px] w-[38px] rounded-[2px] bg-white/25" />
        <div
          class="absolute top-[12px] left-[7px] h-1.5 w-8 rounded-b bg-gradient-to-b from-[#999] to-[#777] shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
        />
        <div
          class="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
        />
      </div>
      <div class="mt-0.5 h-[4px] w-4 rounded-b bg-black/18" />
    </div>

    <div class="relative px-1.5 pt-[20px] pb-1.5">
      <div
        class="auth-paper relative overflow-hidden rounded-t-[4px] rounded-b-[10px] border-[0.8px] border-[var(--auth-paper-border)] shadow-[0_1px_0_rgba(255,255,255,0.5)]"
      >
        <img
          :src="paperTexture"
          alt=""
          class="pointer-events-none absolute top-0 left-0 h-[33%] w-[57%] max-w-none opacity-80"
        />

        <div
          class="relative flex items-center justify-center border-b-[0.8px] border-[rgba(139,100,60,0.2)] px-3 pt-2 pb-2.5"
        >
          <span
            class="absolute top-3.5 left-2.5 size-1.5 rounded bg-black/12 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
          />
          <span
            class="absolute top-3.5 right-2.5 size-1.5 rounded bg-black/12 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
          />
          <p
            class="font-serif text-[13px] leading-5 font-bold tracking-[0.7px] text-[var(--auth-doc-ink)]"
          >
            {{ headerTitle }}
          </p>
        </div>

        <div class="relative px-3.5 pt-4 pb-3.5">
          <slot />
        </div>

        <div
          class="pointer-events-none absolute inset-0 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)]"
        />
      </div>
    </div>

    <div
      class="pointer-events-none absolute inset-0 rounded-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"
    />
  </div>
</template>
