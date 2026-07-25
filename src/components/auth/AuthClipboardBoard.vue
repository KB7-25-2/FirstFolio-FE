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
    class="auth-clip-board relative w-[365px] overflow-hidden rounded-[14px] border-[0.8px] border-[var(--auth-clip-border)] p-[0.8px] shadow-[0_6px_28px_rgba(0,0,0,0.45)]"
  >
    <div class="absolute top-[-2px] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
      <div
        class="relative h-[18px] w-[52px] rounded-t-[3px] rounded-b-[2px] shadow-[0_2px_3px_rgba(0,0,0,0.5)]"
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
        <div class="absolute top-[3px] left-[5px] h-[3px] w-[42px] rounded-[2px] bg-white/25" />
        <div
          class="absolute top-[14px] left-[8px] h-2 w-9 rounded-b bg-gradient-to-b from-[#999] to-[#777] shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
        />
        <div
          class="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
        />
      </div>
      <div class="mt-0.5 h-[5px] w-5 rounded-b bg-black/18" />
    </div>

    <div class="relative px-2 pt-[22px] pb-2">
      <div
        class="auth-paper relative overflow-hidden rounded-t-[4px] rounded-b-[10px] border-[0.8px] border-[var(--auth-paper-border)] shadow-[0_1px_0_rgba(255,255,255,0.5)]"
      >
        <img
          :src="paperTexture"
          alt=""
          class="pointer-events-none absolute top-0 left-0 h-[33%] w-[57%] max-w-none opacity-80"
        />

        <div
          class="relative flex items-center justify-center border-b-[0.8px] border-[rgba(139,100,60,0.2)] px-4 pt-2.5 pb-[11px]"
        >
          <span
            class="absolute top-4 left-3 size-2 rounded bg-black/12 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
          />
          <span
            class="absolute top-4 right-3 size-2 rounded bg-black/12 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
          />
          <p
            class="font-serif text-[14px] leading-5 font-bold tracking-[0.7px] text-[var(--auth-doc-ink)]"
          >
            {{ headerTitle }}
          </p>
        </div>

        <div class="relative px-4 pt-5 pb-4">
          <slot />
        </div>

        <div
          class="pointer-events-none absolute inset-0 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)]"
        />
      </div>
    </div>

    <div
      class="pointer-events-none absolute inset-0 rounded-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"
    />
  </div>
</template>
