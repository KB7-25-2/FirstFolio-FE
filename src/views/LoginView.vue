<script setup>
import { computed, ref, watch } from 'vue'
import AuthPageHeader from '@/components/auth/AuthPageHeader.vue'
import AuthDocTabs from '@/components/auth/AuthDocTabs.vue'
import AuthClipboardBoard from '@/components/auth/AuthClipboardBoard.vue'
import AuthDocDivider from '@/components/auth/AuthDocDivider.vue'
import AuthDocField from '@/components/auth/AuthDocField.vue'
import AuthRememberCheck from '@/components/auth/AuthRememberCheck.vue'
import AuthSignature from '@/components/auth/AuthSignature.vue'
import AuthEnterCta from '@/components/auth/AuthEnterCta.vue'
import AuthMethodCard from '@/components/auth/AuthMethodCard.vue'
import AuthSplash from '@/components/auth/AuthSplash.vue'
import { useLoginView } from '@/composables/useLoginView.js'

/** 로그인 화면 진입(마운트)마다 스플래시 표시 */
const showSplash = ref(true)
const loginReady = ref(false)

const dismissSplash = () => {
  showSplash.value = false
  loginReady.value = true
}

const {
  activeTab,
  signupStep,
  signupMethod,
  nickname,
  email,
  password,
  passwordConfirm,
  rememberMe,
  error,
  isLoading,
  loginSuccess,
  isLogin,
  clipboardHeader,
  signatureName,
  switchTab,
  handleSubmit,
  handleGoogleContinue,
  handleForgotPassword,
  setSignupMethod,
} = useLoginView()

const stageClass = computed(() => {
  const classes = []
  if (loginReady.value) classes.push('auth-stage--ready')
  if (loginSuccess.value) classes.push('auth-stage--success')
  return classes.join(' ')
})

/** 서류 교체 방향: next = 앞으로(로그인→가입), prev = 뒤로(가입→로그인) */
const docDir = ref('next')
const docPaneKey = computed(() =>
  activeTab.value === 'login' ? 'login' : `signup-${signupStep.value}`,
)
const docTransition = computed(() =>
  docDir.value === 'next' ? 'auth-paper-next' : 'auth-paper-prev',
)

const handleDocTab = (tab) => {
  if (tab === activeTab.value || isLoading.value || showSplash.value || loginSuccess.value) return
  docDir.value = tab === 'signup' ? 'next' : 'prev'
  switchTab(tab)
}

watch(signupStep, (step, prev) => {
  if (activeTab.value !== 'signup' || !prev || step === prev) return
  docDir.value = step === 'form' ? 'next' : 'prev'
})
</script>

<template>
  <div
    class="cork-board relative flex min-h-screen items-start justify-center"
    :aria-busy="isLoading"
  >
    <div
      class="mobile-frame relative flex flex-col items-center overflow-hidden px-3 pt-10 pb-6"
      :class="stageClass"
    >
      <!-- 구글 팝업 등 인증 진행 중: 화면 전체 입력 차단 -->
      <div
        v-if="isLoading && !loginSuccess"
        class="absolute inset-0 z-30 cursor-wait bg-[rgba(44,24,16,0.06)]"
        aria-hidden="true"
      />

      <AuthPageHeader class="auth-enter shrink-0" style="--auth-i: 0" />

      <div class="auth-enter mt-3 shrink-0" style="--auth-i: 1">
        <AuthDocTabs
          :model-value="activeTab"
          :disabled="isLoading || showSplash || loginSuccess"
          @update:model-value="handleDocTab"
        />
      </div>

      <div class="auth-enter mt-5 min-h-0 w-full flex-1 overflow-y-auto" style="--auth-i: 2">
        <form
          class="flex flex-col items-center"
          :aria-disabled="isLoading || showSplash || loginSuccess"
          @submit.prevent="handleSubmit"
        >
          <AuthClipboardBoard
            :paper-key="docPaneKey"
            :paper-transition="docTransition"
            :header-title="clipboardHeader"
          >
            <!-- 로그인 -->
            <template v-if="isLogin">
              <div class="relative flex flex-col gap-1.5">
                <AuthDocDivider />

                <h2
                  class="text-center font-serif text-[17px] font-black text-[var(--auth-doc-ink)]"
                >
                  회원 확인 신청서
                </h2>

                <AuthDocDivider />
                <AuthDocField
                  id="login-email"
                  v-model="email"
                  label="일. 전자우편 주소 (이메일)"
                  type="email"
                  placeholder="email@example.com"
                  autocomplete="email"
                  :disabled="isLoading || showSplash || loginSuccess"
                />

                <AuthDocField
                  id="login-password"
                  v-model="password"
                  label="이. 비밀번호"
                  type="password"
                  placeholder="※ ※ ※ ※ ※ ※ ※ ※"
                  autocomplete="current-password"
                  mask-password
                  :disabled="isLoading || showSplash || loginSuccess"
                />

                <div class="flex items-center justify-between pb-2">
                  <AuthRememberCheck
                    v-model="rememberMe"
                    :disabled="isLoading || showSplash || loginSuccess"
                  />
                  <button
                    type="button"
                    class="cursor-pointer font-serif text-[9px] text-[var(--auth-doc-link)] underline hover:bg-white/70 focus:bg-white/70 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="isLoading || showSplash || loginSuccess"
                    @click="handleForgotPassword"
                  >
                    비밀번호를 잊으셨습니까?
                  </button>
                </div>

                <AuthSignature :name="signatureName" />

                <AuthMethodCard
                  title="Google로 로그인하기"
                  description="Google 계정으로 간편하게 입장합니다."
                  :disabled="isLoading || showSplash || loginSuccess"
                  @select="handleGoogleContinue"
                />

                <AuthEnterCta
                  type="submit"
                  label="입장하기  →"
                  :disabled="isLoading || showSplash || loginSuccess"
                />

                <p class="text-center font-serif text-[8px] text-[var(--auth-doc-faint)]">
                  본 문서는 Firstfolio 입장 절차에 따라 발급되었습니다.
                </p>

                <div
                  v-if="loginSuccess"
                  class="auth-login-stamp pointer-events-none absolute top-[38%] right-[6%] z-10"
                  aria-hidden="true"
                >
                  <span
                    class="block rounded border-[2.5px] border-[var(--cork-stamp-border)] px-3.5 py-1.5 font-serif text-[22px] font-black tracking-[4px] text-[var(--cork-stamp)]"
                  >
                    승인
                  </span>
                </div>
              </div>
            </template>

            <!-- 회원가입 · 방식 선택 -->
            <template v-else-if="signupStep === 'method'">
              <div class="flex flex-col gap-1 pb-2">
                <AuthDocDivider />

                <h2
                  class="text-center font-serif text-[17px] font-black text-[var(--auth-doc-ink)]"
                >
                  등록 방식 선택
                </h2>

                <AuthDocDivider />
              </div>
              <div class="flex flex-col gap-3">
                <p class="text-center font-serif text-[10px] text-[var(--auth-doc-guide)]">
                  하나를 선택하여 표기(v)하시오.
                </p>

                <AuthMethodCard
                  title="갑. 외부 계정 연동 (Google)"
                  description="Google 계정으로 간편하게 등록합니다."
                  :selected="signupMethod === 'google'"
                  :disabled="isLoading || showSplash"
                  @select="setSignupMethod('google')"
                />

                <AuthMethodCard
                  title="을. 이메일로 계속하기"
                  description="전자우편 주소와 비밀번호로 직접 등록합니다."
                  :selected="signupMethod === 'email'"
                  :disabled="isLoading || showSplash"
                  @select="setSignupMethod('email')"
                />

                <AuthEnterCta
                  type="submit"
                  label="다음 장으로  →"
                  :disabled="isLoading || showSplash"
                />

                <p class="text-center font-serif text-[8px] text-[var(--auth-doc-faint)]">
                  ※ 선택한 방식으로 다음 장의 등록 절차가 진행됩니다.
                </p>
              </div>
            </template>

            <!-- 회원가입 · 이메일 폼 -->
            <template v-else>
              <div class="flex flex-col gap-1 pb-2">
                <AuthDocDivider />

                <h2
                  class="text-center font-serif text-[17px] font-black text-[var(--auth-doc-ink)]"
                >
                  회원 등록 신청서
                </h2>

                <AuthDocDivider />
              </div>
              <div class="flex flex-col gap-3">
                <p class="text-center font-serif text-[10px] text-[var(--auth-doc-guide)]">
                  신규 등록을 위해 아래 항목을 빠짐없이 기재하시오.
                </p>

                <AuthDocField
                  id="signup-nickname"
                  v-model="nickname"
                  label="일. 성명 (닉네임)"
                  placeholder="김투자"
                  autocomplete="nickname"
                  :disabled="isLoading || showSplash"
                />

                <AuthDocField
                  id="signup-email"
                  v-model="email"
                  label="이. 전자우편 주소 (이메일)"
                  type="email"
                  placeholder="email@example.com"
                  autocomplete="email"
                  :disabled="isLoading || showSplash"
                />

                <AuthDocField
                  id="signup-password"
                  v-model="password"
                  label="삼. 비밀번호"
                  type="password"
                  placeholder="※ ※ ※ ※ ※ ※ ※ ※"
                  autocomplete="new-password"
                  mask-password
                  :disabled="isLoading || showSplash"
                />

                <AuthDocField
                  id="signup-password-confirm"
                  v-model="passwordConfirm"
                  label="사. 비밀번호 재확인"
                  type="password"
                  placeholder="※ ※ ※ ※ ※ ※ ※ ※"
                  autocomplete="new-password"
                  mask-password
                  :disabled="isLoading || showSplash"
                />

                <AuthSignature :name="signatureName" seal-label="서명" />

                <AuthEnterCta
                  type="submit"
                  label="등록 신청하기  →"
                  :disabled="isLoading || showSplash"
                />
              </div>
            </template>
          </AuthClipboardBoard>

          <p v-if="error" class="mt-3 text-center text-sm text-red-400">{{ error }}</p>
        </form>
      </div>

      <p
        class="auth-enter mt-4 shrink-0 pt-2 text-center text-[9px] text-[var(--auth-footer)]"
        style="--auth-i: 3"
      >
        계속 진행하면 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.
      </p>
    </div>

    <Transition name="auth-splash">
      <AuthSplash v-if="showSplash" @finished="dismissSplash" />
    </Transition>
  </div>
</template>
