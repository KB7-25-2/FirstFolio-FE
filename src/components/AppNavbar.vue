<script setup>
import { useNavTabs } from '@/composables/useNavTabs.js'

const { leftTabs, rightTabs, centerTab, isActive, navigate } = useNavTabs()
</script>
<template>
  <nav
    class="nav-bar relative z-30 flex w-full shrink-0 items-end overflow-visible border-t border-[var(--nav-border)] bg-[var(--nav-bg)] px-1 pt-[0.8dvh] pb-[1dvh]"
    aria-label="주요 메뉴"
  >
    <button
      v-for="tab in leftTabs"
      :key="tab.name"
      type="button"
      class="relative flex min-w-0 flex-1 flex-col items-center justify-end pb-[0.2dvh]"
      :aria-current="isActive(tab.name) ? 'page' : undefined"
      @click="navigate(tab.path)"
    >
      <span
        class="nav-icon-wrap flex items-center justify-center transition-all"
        :class="isActive(tab.name) ? '-translate-y-[1px]' : ''"
      >
        <font-awesome-icon
          :icon="tab.icon"
          class="transition-all"
          :class="[
            isActive(tab.name) ? tab.activeClass : 'text-[var(--nav-text-muted)]',
            isActive(tab.name) ? 'nav-icon-active' : 'nav-icon',
          ]"
        />
      </span>
      <span
        class="nav-label mt-[0.25dvh] font-bold transition-colors"
        :class="isActive(tab.name) ? tab.activeClass : 'text-[var(--nav-text-muted)]'"
      >
        {{ tab.label }}
      </span>
    </button>

    <!-- 가운데 홈 자리 -->
    <div class="w-[20%] shrink-0" aria-hidden="true" />

    <button
      v-for="tab in rightTabs"
      :key="tab.name"
      type="button"
      class="relative flex min-w-0 flex-1 flex-col items-center justify-end pb-[0.2dvh]"
      :aria-current="isActive(tab.name) ? 'page' : undefined"
      @click="navigate(tab.path)"
    >
      <span
        class="nav-icon-wrap flex items-center justify-center transition-all"
        :class="isActive(tab.name) ? '-translate-y-[1px]' : ''"
      >
        <font-awesome-icon
          :icon="tab.icon"
          class="transition-all"
          :class="[
            isActive(tab.name) ? tab.activeClass : 'text-[var(--nav-text-muted)]',
            isActive(tab.name) ? 'nav-icon-active' : 'nav-icon',
          ]"
        />
      </span>
      <span
        class="nav-label mt-[0.25dvh] font-bold transition-colors"
        :class="isActive(tab.name) ? tab.activeClass : 'text-[var(--nav-text-muted)]'"
      >
        {{ tab.label }}
      </span>
    </button>

    <button
      v-if="centerTab"
      type="button"
      class="nav-home-fab absolute bottom-[0.9dvh] left-1/2 z-40 flex flex-col items-center"
      :aria-current="isActive(centerTab.name) ? 'page' : undefined"
      :aria-label="centerTab.label"
      @click="navigate(centerTab.path)"
    >
      <span
        class="nav-home-fab__btn flex items-center justify-center rounded-full border-[3px] border-[var(--nav-bg)] shadow-[0_4px_14px_rgba(0,0,0,0.35)] transition-transform active:scale-95"
        :class="
          isActive(centerTab.name)
            ? 'bg-[var(--nav-active-primary)] text-[#fff8ec]'
            : 'bg-[#2a2a2a] text-[var(--nav-text-muted)]'
        "
      >
        <font-awesome-icon :icon="centerTab.icon" class="nav-home-fab__icon" />
      </span>
      <span
        class="nav-label mt-[0.35dvh] font-bold transition-colors"
        :class="
          isActive(centerTab.name)
            ? 'text-[var(--nav-active-primary)]'
            : 'text-[var(--nav-text-muted)]'
        "
      >
        {{ centerTab.label }}
      </span>
    </button>
  </nav>
</template>
