<script setup>
import AuthPageHeader from '@/components/auth/AuthPageHeader.vue'
import AuthDocTabs from '@/components/auth/AuthDocTabs.vue'
import AuthClipboardBoard from '@/components/auth/AuthClipboardBoard.vue'
import AuthDocDivider from '@/components/auth/AuthDocDivider.vue'
import AuthDocField from '@/components/auth/AuthDocField.vue'
import AuthRememberCheck from '@/components/auth/AuthRememberCheck.vue'
import AuthSignature from '@/components/auth/AuthSignature.vue'
import AuthEnterCta from '@/components/auth/AuthEnterCta.vue'
import AuthMethodCard from '@/components/auth/AuthMethodCard.vue'
import { useLoginView } from '@/composables/useLoginView.js'

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
  todayLabel,
  isLogin,
  clipboardHeader,
  signatureName,
  switchTab,
  handleSubmit,
  handleGoogleContinue,
  handleForgotPassword,
  setSignupMethod,
} = useLoginView()
</script>

<template>
  <div class="cork-board flex min-h-screen items-start justify-center" :aria-busy="isLoading">
    <div class="mobile-frame relative flex flex-col items-center overflow-hidden px-3 pt-10 pb-6">
      <AuthPageHeader class="shrink-0" />

      <div class="mt-3 shrink-0">
        <AuthDocTabs
          :model-value="activeTab"
          :disabled="isLoading"
          @update:model-value="switchTab"
        />
      </div>

      <div class="mt-5 min-h-0 w-full flex-1 overflow-y-auto">
        <form
          class="flex flex-col items-center"
          :aria-disabled="isLoading"
          @submit.prevent="handleSubmit"
        >
          <AuthClipboardBoard :header-title="clipboardHeader">
            <!-- 로그인 -->
            <template v-if="isLogin">
              <div class="flex flex-col gap-1.5">
                <div
                  class="flex items-start justify-between font-serif text-[9px] text-[var(--auth-doc-meta)]"
                >
                  <span>제 2026-입장-001 호</span>
                  <span>{{ todayLabel }}</span>
                </div>

                <AuthDocDivider />

                <h2
                  class="text-center font-serif text-[17px] font-black text-[var(--auth-doc-ink)]"
                >
                  회원 확인 신청서
                </h2>

                <AuthDocDivider />

                <p class="text-center font-serif text-[10px] text-[var(--auth-doc-guide)]">
                  아래 항목을 정자로 기재하여 제출하시오.
                </p>

                <AuthDocField
                  id="login-email"
                  v-model="email"
                  label="일. 전자우편 주소 (이메일)"
                  type="email"
                  placeholder="email@example.com"
                  autocomplete="email"
                  :disabled="isLoading"
                />

                <AuthDocField
                  id="login-password"
                  v-model="password"
                  label="이. 비밀번호"
                  type="password"
                  placeholder="※ ※ ※ ※ ※ ※ ※ ※"
                  autocomplete="current-password"
                  mask-password
                  :disabled="isLoading"
                />

                <div class="flex items-center justify-between">
                  <AuthRememberCheck v-model="rememberMe" :disabled="isLoading" />
                  <button
                    type="button"
                    class="font-serif text-[9px] text-[var(--auth-doc-link)] underline disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="isLoading"
                    @click="handleForgotPassword"
                  >
                    비밀번호를 잊으셨습니까?
                  </button>
                </div>

                <AuthSignature :name="signatureName" />

                <AuthMethodCard
                  title="병. Google로 로그인하기"
                  description="Google 계정으로 간편하게 입장합니다."
                  :disabled="isLoading"
                  @select="handleGoogleContinue"
                />

                <AuthEnterCta type="submit" label="입장하기  →" :disabled="isLoading" />

                <p class="text-center font-serif text-[8px] text-[var(--auth-doc-faint)]">
                  본 문서는 Firstfolio 입장 절차에 따라 발급되었습니다.
                </p>
              </div>
            </template>

            <!-- 회원가입 · 방식 선택 -->
            <template v-else-if="signupStep === 'method'">
              <div class="flex flex-col gap-3">
                <div
                  class="flex items-start justify-between font-serif text-[9px] text-[var(--auth-doc-meta)]"
                >
                  <span>제 2026-등록-002 호</span>
                  <span>{{ todayLabel }}</span>
                </div>

                <AuthDocDivider />

                <h2
                  class="text-center font-serif text-[17px] font-black text-[var(--auth-doc-ink)]"
                >
                  등록 방식 선택
                </h2>

                <AuthDocDivider />

                <p class="text-center font-serif text-[10px] text-[var(--auth-doc-guide)]">
                  하나를 선택하여 표기(v)하시오.
                </p>

                <AuthMethodCard
                  title="갑. 외부 계정 연동 (Google)"
                  description="Google 계정으로 간편하게 등록합니다."
                  :selected="signupMethod === 'google'"
                  :disabled="isLoading"
                  @select="setSignupMethod('google')"
                />

                <AuthMethodCard
                  title="을. 이메일로 계속하기"
                  description="전자우편 주소와 비밀번호로 직접 등록합니다."
                  :selected="signupMethod === 'email'"
                  :disabled="isLoading"
                  @select="setSignupMethod('email')"
                />

                <AuthEnterCta type="submit" label="다음 장으로  →" :disabled="isLoading" />

                <p class="text-center font-serif text-[8px] text-[var(--auth-doc-faint)]">
                  ※ 선택한 방식으로 다음 장의 등록 절차가 진행됩니다.
                </p>
              </div>
            </template>

            <!-- 회원가입 · 이메일 폼 -->
            <template v-else>
              <div class="flex flex-col gap-3">
                <div
                  class="flex items-start justify-between font-serif text-[9px] text-[var(--auth-doc-meta)]"
                >
                  <span>제 2026-등록-001 호</span>
                  <span>{{ todayLabel }}</span>
                </div>

                <AuthDocDivider />

                <h2
                  class="text-center font-serif text-[17px] font-black text-[var(--auth-doc-ink)]"
                >
                  회원 등록 신청서
                </h2>

                <AuthDocDivider />

                <p class="text-center font-serif text-[10px] text-[var(--auth-doc-guide)]">
                  신규 등록을 위해 아래 항목을 빠짐없이 기재하시오.
                </p>

                <AuthDocField
                  id="signup-nickname"
                  v-model="nickname"
                  label="일. 성명 (닉네임)"
                  placeholder="김투자"
                  autocomplete="nickname"
                  :disabled="isLoading"
                />

                <AuthDocField
                  id="signup-email"
                  v-model="email"
                  label="이. 전자우편 주소 (이메일)"
                  type="email"
                  placeholder="email@example.com"
                  autocomplete="email"
                  :disabled="isLoading"
                />

                <AuthDocField
                  id="signup-password"
                  v-model="password"
                  label="삼. 비밀번호"
                  type="password"
                  placeholder="※ ※ ※ ※ ※ ※ ※ ※"
                  autocomplete="new-password"
                  mask-password
                  :disabled="isLoading"
                />

                <AuthDocField
                  id="signup-password-confirm"
                  v-model="passwordConfirm"
                  label="사. 비밀번호 재확인"
                  type="password"
                  placeholder="※ ※ ※ ※ ※ ※ ※ ※"
                  autocomplete="new-password"
                  mask-password
                  :disabled="isLoading"
                />

                <AuthSignature :name="signatureName" seal-label="서명" />

                <AuthEnterCta type="submit" label="등록 신청하기  →" :disabled="isLoading" />
              </div>
            </template>
          </AuthClipboardBoard>

          <p v-if="error" class="mt-3 text-center text-sm text-red-400">{{ error }}</p>
        </form>
      </div>

      <p class="mt-4 shrink-0 pt-2 text-center text-[9px] text-[var(--auth-footer)]">
        계속 진행하면 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.
      </p>
    </div>
  </div>
</template>
