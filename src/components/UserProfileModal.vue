<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/userStore.js'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const userStore = useUserStore()
const { profile, email, pointBalanceDisplay, isSaving } = storeToRefs(userStore)

const nicknameInput = ref('')
const newsletterOptIn = ref(false)
const formError = ref('')
const saveSuccess = ref(false)

const syncFromProfile = () => {
  nicknameInput.value = profile.value?.nickname ?? ''
  newsletterOptIn.value = Boolean(profile.value?.newsletterOptIn)
  formError.value = ''
  saveSuccess.value = false
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) syncFromProfile()
  },
)

const isDirty = computed(() => {
  if (!profile.value) return false
  const nicknameChanged = nicknameInput.value.trim().replace(/\s+/g, '') !== profile.value.nickname
  const newsletterChanged = newsletterOptIn.value !== Boolean(profile.value.newsletterOptIn)
  return nicknameChanged || newsletterChanged
})

const close = () => {
  if (isSaving.value) return
  emit('close')
}

const onSave = async () => {
  if (!isDirty.value || isSaving.value) return

  formError.value = ''
  saveSuccess.value = false

  /** @type {{ nickname?: string, newsletterOptIn?: boolean }} */
  const payload = {}
  const nextNickname = nicknameInput.value.trim().replace(/\s+/g, '')

  if (nextNickname !== profile.value?.nickname) {
    payload.nickname = nextNickname
  }
  if (newsletterOptIn.value !== Boolean(profile.value?.newsletterOptIn)) {
    payload.newsletterOptIn = newsletterOptIn.value
  }

  try {
    await userStore.updateProfile(payload)
    syncFromProfile()
    saveSuccess.value = true
  } catch (err) {
    formError.value = err?.message || '프로필을 저장하지 못했습니다.'
  }
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-5"
    role="dialog"
    aria-modal="true"
    aria-label="내 프로필"
    @click.self="close"
  >
    <div
      class="w-full max-w-[var(--mobile-width)] rounded-2xl border border-[rgba(245,237,217,0.12)] bg-[#161b22] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="font-serif text-[17px] font-bold text-[#f5edd9]">내 프로필</h2>
          <p class="mt-1 font-serif text-[11px] text-[rgba(245,237,217,0.5)]">
            공개 닉네임과 뉴스레터 수신을 관리해요
          </p>
        </div>
        <button
          type="button"
          class="btn-hover flex size-8 items-center justify-center rounded-md text-[rgba(245,237,217,0.55)] hover:bg-white/5 hover:text-[#f5edd9]"
          aria-label="닫기"
          :disabled="isSaving"
          @click="close"
        >
          <span class="text-[16px] leading-none" aria-hidden="true">×</span>
        </button>
      </div>

      <dl class="mt-5 space-y-2 rounded-xl bg-white/[0.03] px-3.5 py-3">
        <div class="flex items-center justify-between gap-3">
          <dt class="font-serif text-[11px] text-[rgba(245,237,217,0.45)]">이메일</dt>
          <dd class="truncate font-serif text-[12px] text-[rgba(245,237,217,0.85)]">
            {{ email || '—' }}
          </dd>
        </div>
        <div class="flex items-center justify-between gap-3">
          <dt class="font-serif text-[11px] text-[rgba(245,237,217,0.45)]">보유 포인트</dt>
          <dd class="font-serif text-[12px] font-bold text-[rgba(193,127,36,0.95)]">
            {{ pointBalanceDisplay }} P
          </dd>
        </div>
      </dl>

      <label class="mt-5 flex flex-col gap-1.5" for="profile-nickname">
        <span class="font-serif text-[11px] font-bold text-[rgba(245,237,217,0.7)]">닉네임</span>
        <input
          id="profile-nickname"
          v-model="nicknameInput"
          type="text"
          maxlength="10"
          autocomplete="nickname"
          :disabled="isSaving"
          class="rounded-xl border border-[rgba(245,237,217,0.14)] bg-[#0d1117] px-3 py-2.5 font-serif text-[13px] text-[#f5edd9] outline-none placeholder:text-[rgba(245,237,217,0.28)] focus:border-[rgba(193,127,36,0.55)] disabled:opacity-50"
          placeholder="2~10자"
        />
        <span class="font-serif text-[10px] text-[rgba(245,237,217,0.4)]">
          공백 없이 2자 이상 10자 이하
        </span>
      </label>

      <label
        class="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[rgba(245,237,217,0.1)] bg-white/[0.02] px-3.5 py-3"
        :class="isSaving ? 'pointer-events-none opacity-50' : ''"
      >
        <span class="min-w-0">
          <span class="block font-serif text-[13px] font-bold text-[#f5edd9]">뉴스레터 수신</span>
          <span class="mt-0.5 block font-serif text-[10px] text-[rgba(245,237,217,0.45)]">
            학습·뉴스 소식을 이메일로 받아요
          </span>
        </span>
        <input
          v-model="newsletterOptIn"
          type="checkbox"
          class="peer sr-only"
          :disabled="isSaving"
        />
        <span
          class="relative h-6 w-11 shrink-0 rounded-full bg-[rgba(245,237,217,0.18)] transition-colors peer-checked:bg-[rgba(193,127,36,0.85)] peer-focus-visible:ring-2 peer-focus-visible:ring-[rgba(193,127,36,0.45)]"
          aria-hidden="true"
        >
          <span
            class="absolute top-0.5 left-0.5 size-5 rounded-full bg-[#f5edd9] transition-transform"
            :class="newsletterOptIn ? 'translate-x-5' : 'translate-x-0'"
          />
        </span>
      </label>

      <p v-if="formError" class="mt-3 font-serif text-[12px] text-[#e8a0a0]" role="alert">
        {{ formError }}
      </p>
      <p v-else-if="saveSuccess" class="mt-3 font-serif text-[12px] text-[rgba(140,200,140,0.9)]">
        프로필이 저장되었습니다.
      </p>

      <button
        type="button"
        class="btn-hover mt-5 w-full rounded-xl bg-[rgba(193,127,36,0.92)] py-3 font-serif text-[14px] font-bold text-[#1a1208] disabled:opacity-40"
        :disabled="!isDirty || isSaving"
        @click="onSave"
      >
        {{ isSaving ? '저장 중…' : '저장하기' }}
      </button>
    </div>
  </div>
</template>
