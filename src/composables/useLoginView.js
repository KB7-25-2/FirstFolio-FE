import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/authStore.js'
import { useLevelTestStore } from '@/store/levelTestStore.js'
import { resolvePostAuthPath } from '@/router/guards.js'

/**
 * @param {string | undefined} onboardingStep
 * @param {string} fallbackHome
 * @returns {Promise<string>}
 */
const resolveLoginRedirect = async (onboardingStep, fallbackHome) => {
  if (onboardingStep === 'LEVEL_TEST') {
    return '/onboarding/intro'
  }

  if (onboardingStep === 'CURRICULUM') {
    return '/onboarding/curriculum'
  }

  const levelTestStore = useLevelTestStore()
  const completed = await levelTestStore.ensureStatus()
  return resolvePostAuthPath(completed, fallbackHome)
}

export const useLoginView = () => {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()

  const activeTab = ref('login')
  const signupStep = ref('method')
  const signupMethod = ref('email')

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
  const signatureName = computed(() => nickname.value || '김투자')

  const fallbackHome = computed(() =>
    typeof route.query.redirect === 'string' ? route.query.redirect : '/home',
  )

  const switchTab = (tab) => {
    if (isLoading.value) return
    activeTab.value = tab
    error.value = ''
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
      await authStore.login(
        {
          email: email.value,
          password: password.value,
        },
        { remember: rememberMe.value },
      )

      const path = await resolveLoginRedirect(undefined, fallbackHome.value)
      await router.push(path)
    } catch (err) {
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
      isLoading.value = true
      const path = await resolveLoginRedirect(data.onboardingStep, fallbackHome.value)
      await router.push(path)
    } catch (err) {
      if (err?.code === 'SIGNUP_REQUIRED') {
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
      await authStore.signupWithGoogle({ onDismissed: unlockIfPopupDismissed })
      isLoading.value = true
      await router.push('/onboarding/intro')
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

  const handleSignupSubmit = () => {
    if (isLoading.value) return
    if (password.value !== passwordConfirm.value) {
      error.value = '비밀번호가 일치하지 않습니다.'
      return
    }
    error.value = '회원가입은 준비 중입니다.'
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

    handleSignupSubmit()
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
