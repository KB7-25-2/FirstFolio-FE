import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/authStore.js'
import { ONBOARDING_PATHS, resolveAuthEntryPath } from '@/router/onboardingRedirect.js'

/**
 * @param {string | undefined} onboardingStep POST /auth/login 응답
 * @param {string} fallbackHome
 */
const resolveLoginRedirect = (onboardingStep, fallbackHome) =>
  resolveAuthEntryPath({ onboardingStep, fallbackHome })

export const useLoginView = () => {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()

  const activeTab = ref('login')
  const signupStep = ref('method')
  const signupMethod = ref('email')
  // 로그인 시도 → SIGNUP_REQUIRED → 회원가입 탭 전환 여부 (Firebase 세션 재사용)
  const isSignupRequiredFlow = ref(false)

  const nickname = ref('')
  const email = ref(authStore.rememberedEmail || '')
  const password = ref('')
  const passwordConfirm = ref('')
  const rememberMe = ref(Boolean(authStore.rememberedEmail))
  const error = ref('')
  const isLoading = ref(false)

  const todayLabel = computed(() => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    return `${yyyy}. ${mm}. ${dd}`
  })

  const isLogin = computed(() => activeTab.value === 'login')
  const clipboardHeader = computed(() => (isLogin.value ? '입 장 서 류' : '등 록 서 류'))
  const signatureName = computed(() => nickname.value || '')

  const fallbackHome = computed(() =>
    typeof route.query.redirect === 'string' ? route.query.redirect : '/home',
  )

  const switchTab = (tab) => {
    if (isLoading.value) return
    activeTab.value = tab
    error.value = ''
    isSignupRequiredFlow.value = false
    if (tab === 'signup') {
      signupStep.value = 'method'
    }
  }

  const setSignupMethod = (method) => {
    if (isLoading.value) return
    signupMethod.value = method
  }

  const handleLogin = async () => {
    if (isLoading.value) return
    isLoading.value = true
    error.value = ''

    try {
      const data = await authStore.loginWithEmail(
        {
          email: email.value,
          password: password.value,
        },
        { remember: rememberMe.value },
      )

      const path = resolveLoginRedirect(data.onboardingStep, fallbackHome.value)
      await router.push(path)
    } catch (err) {
      if (err?.code === 'SIGNUP_REQUIRED') {
        isSignupRequiredFlow.value = true
        signupMethod.value = 'email'
        activeTab.value = 'signup'
        signupStep.value = 'form'
        error.value = err.message
        return
      }

      error.value = err?.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.'
    } finally {
      isLoading.value = false
    }
  }

  const unlockIfPopupDismissed = () => {
    isLoading.value = false
  }

  const handleGoogleLogin = async () => {
    if (isLoading.value) return
    isLoading.value = true
    error.value = ''

    try {
      const data = await authStore.loginWithGoogle({ onDismissed: unlockIfPopupDismissed })
      const path = resolveLoginRedirect(data.onboardingStep, fallbackHome.value)
      await router.push(path)
    } catch (err) {
      if (err?.code === 'SIGNUP_REQUIRED') {
        isSignupRequiredFlow.value = true
        signupMethod.value = 'google'
        activeTab.value = 'signup'
        signupStep.value = 'method'
        error.value = err.message
        return
      }

      error.value = err?.message || 'Google 로그인에 실패했습니다.'
    } finally {
      isLoading.value = false
    }
  }

  const handleGoogleSignup = async () => {
    if (isLoading.value) return
    isLoading.value = true
    error.value = ''

    try {
      if (isSignupRequiredFlow.value) {
        // Firebase 세션 재사용 — 팝업 없이 BE에만 가입
        await authStore.signupWithExistingFirebaseSession()
      } else {
        await authStore.signupWithGoogle({ onDismissed: unlockIfPopupDismissed })
      }
      await router.push(ONBOARDING_PATHS.intro)
    } catch (err) {
      error.value = err?.message || 'Google 회원가입에 실패했습니다.'
    } finally {
      isLoading.value = false
    }
  }

  const handleSignupMethodNext = async () => {
    if (isLoading.value) return
    error.value = ''
    if (signupMethod.value === 'google') {
      await handleGoogleSignup()
      return
    }
    signupStep.value = 'form'
  }

  const handleSignupSubmit = async () => {
    if (isLoading.value) return

    // SIGNUP_REQUIRED 흐름이 아닌 신규 이메일 가입에서만 비밀번호 확인
    if (!isSignupRequiredFlow.value && password.value !== passwordConfirm.value) {
      error.value = '비밀번호가 일치하지 않습니다.'
      return
    }

    isLoading.value = true
    error.value = ''

    try {
      if (isSignupRequiredFlow.value) {
        // Firebase 계정은 이미 있음 — BE에만 회원가입
        await authStore.signupWithExistingFirebaseSession({ nickname: nickname.value })
      } else {
        await authStore.signupWithEmail({
          nickname: nickname.value,
          email: email.value,
          password: password.value,
        })
      }
      await router.push(ONBOARDING_PATHS.intro)
    } catch (err) {
      error.value = err?.message || '회원가입에 실패했습니다.'
    } finally {
      isLoading.value = false
    }
  }

  const handleSubmit = async () => {
    if (isLoading.value) return
    if (isLogin.value) {
      await handleLogin()
      return
    }

    if (signupStep.value === 'method') {
      await handleSignupMethodNext()
      return
    }

    await handleSignupSubmit()
  }

  const handleGoogleContinue = async () => {
    if (isLoading.value) return
    await handleGoogleLogin()
  }

  const handleForgotPassword = () => {
    if (isLoading.value) return
    error.value = '비밀번호 찾기는 준비 중입니다.'
  }

  return {
    activeTab,
    signupStep,
    signupMethod,
    isSignupRequiredFlow,
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
    setSignupMethod,
    handleSubmit,
    handleGoogleContinue,
    handleForgotPassword,
  }
}
