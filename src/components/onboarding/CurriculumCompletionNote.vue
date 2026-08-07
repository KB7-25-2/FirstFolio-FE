<script setup>
/**
 * Figma 10 Memo/CompletionNote — 커리큘럼 완성 안내
 */
</script>

<template>
  <div class="relative w-full">
    <div
      class="pointer-events-none absolute top-[-6px] right-6 z-20 h-3.5 w-[70px] -rotate-[2deg] border-[0.5px] border-white/25 bg-[var(--study-tape)]"
      aria-hidden="true"
    />
    <section
      class="overflow-hidden rounded-[3px] border border-[rgba(212,184,150,0.55)] bg-[#fffaed] px-4 pt-4 pb-3.5 shadow-[0_3px_10px_rgba(0,0,0,0.28)]"
    >
      <h2 class="font-serif text-[16px] leading-snug font-black text-[#29211a]">
        나만의 금융 커리큘럼을 만들었어요
      </h2>
      <p class="mt-2 font-pen text-[17px] leading-snug text-[#8b643c]">
        포트폴리오 기초는 필수예요. 오답 추천과 장바구니 추가분으로 순서를 정해 학습해요.
      </p>
    </section>
  </div>
</template>
