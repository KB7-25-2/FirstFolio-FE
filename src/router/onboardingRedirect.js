import { isCurriculumConfirmed } from '@/utils/curriculumConfirm.js'

/** @typedef {'LEVEL_TEST' | 'CURRICULUM' | 'HOME'} OnboardingStep */

export const ONBOARDING_PATHS = {
  intro: '/onboarding/intro',
  quiz: '/onboarding/quiz',
  result: '/onboarding/result',
  curriculum: '/onboarding/curriculum',
  curriculumConfirm: '/onboarding/curriculum-confirm',
}

export const ONBOARDING_ROUTE_NAMES = {
  intro: 'onboarding-intro',
  quiz: 'onboarding-quiz',
  result: 'onboarding-result',
  curriculum: 'onboarding-curriculum',
  curriculumConfirm: 'onboarding-curriculum-confirm',
}

/** 레벨 테스트 제출 이후에만 접근 가능한 온보딩 화면 */
export const POST_TEST_ROUTE_NAMES = new Set([
  ONBOARDING_ROUTE_NAMES.result,
  ONBOARDING_ROUTE_NAMES.curriculum,
  ONBOARDING_ROUTE_NAMES.curriculumConfirm,
])

/** 레벨 테스트 진행 중 화면 */
export const PRE_TEST_ROUTE_NAMES = new Set([
  ONBOARDING_ROUTE_NAMES.intro,
  ONBOARDING_ROUTE_NAMES.quiz,
])

/**
 * @param {import('vue-router').RouteLocationNormalized} to
 */
export const isOnboardingRoute = (to) =>
  to.matched.some((record) => record.meta.onboarding === true) || to.path.startsWith('/onboarding')

/**
 * 학습 화면에서 확정 커리큘럼 수정 (HOME 사용자도 접근 허용)
 * @param {import('vue-router').RouteLocationNormalized} to
 */
export const isCurriculumEditRoute = (to) =>
  (to.name === ONBOARDING_ROUTE_NAMES.curriculum ||
    to.name === ONBOARDING_ROUTE_NAMES.curriculumConfirm) &&
  to.query?.mode === 'edit'

/**
 * POST /auth/login 응답 onboarding_step 기준 진입 경로
 * @param {object} params
 * @param {OnboardingStep | string | undefined} [params.onboardingStep]
 * @param {boolean} [params.levelTestCompleted] API step 없을 때 mock fallback
 * @param {boolean} [params.curriculumConfirmed=isCurriculumConfirmed()]
 * @param {string} [params.fallbackHome='/home']
 * @returns {string}
 */
export const resolveAuthEntryPath = ({
  onboardingStep,
  levelTestCompleted,
  curriculumConfirmed = isCurriculumConfirmed(),
  fallbackHome = '/home',
}) => {
  if (onboardingStep === 'LEVEL_TEST') return ONBOARDING_PATHS.intro
  if (onboardingStep === 'CURRICULUM') return ONBOARDING_PATHS.curriculum
  if (onboardingStep === 'HOME') return fallbackHome

  if (levelTestCompleted === undefined) return fallbackHome

  if (!levelTestCompleted) return ONBOARDING_PATHS.intro
  if (curriculumConfirmed) return fallbackHome
  return ONBOARDING_PATHS.result
}

/**
 * @param {OnboardingStep | string | null | undefined} onboardingStep
 * @param {import('vue-router').RouteLocationNormalized} to
 */
const resolveGuardByApiStep = (onboardingStep, to) => {
  const onboarding = isOnboardingRoute(to)

  if (onboardingStep === 'HOME') {
    if (onboarding && !isCurriculumEditRoute(to)) return { path: '/home' }
    return true
  }

  if (onboardingStep === 'LEVEL_TEST') {
    if (!onboarding) return { path: ONBOARDING_PATHS.intro }
    if (POST_TEST_ROUTE_NAMES.has(to.name)) {
      return { name: ONBOARDING_ROUTE_NAMES.quiz }
    }
    return true
  }

  if (onboardingStep === 'CURRICULUM') {
    if (!onboarding) return { name: ONBOARDING_ROUTE_NAMES.curriculum }
    if (PRE_TEST_ROUTE_NAMES.has(to.name)) {
      return { name: ONBOARDING_ROUTE_NAMES.result }
    }
    return true
  }

  return null
}

/**
 * API onboarding_step 없을 때 localStorage mock 기준 fallback
 * @param {import('vue-router').RouteLocationNormalized} to
 * @param {object} state
 * @param {boolean} state.levelTestCompleted
 * @param {boolean} state.curriculumConfirmed
 */
const resolveGuardByLocalState = (to, { levelTestCompleted, curriculumConfirmed }) => {
  const onboarding = isOnboardingRoute(to)

  if (!levelTestCompleted && !onboarding) {
    return { path: ONBOARDING_PATHS.intro }
  }

  if (!levelTestCompleted && onboarding && POST_TEST_ROUTE_NAMES.has(to.name)) {
    return { name: ONBOARDING_ROUTE_NAMES.quiz }
  }

  if (levelTestCompleted && onboarding) {
    if (curriculumConfirmed && !isCurriculumEditRoute(to)) {
      return { path: '/home' }
    }
    if (PRE_TEST_ROUTE_NAMES.has(to.name)) {
      return { name: ONBOARDING_ROUTE_NAMES.result }
    }
    return true
  }

  if (levelTestCompleted && !onboarding && !curriculumConfirmed) {
    return { name: ONBOARDING_ROUTE_NAMES.curriculum }
  }

  return true
}

/**
 * 레벨 테스트 완료 여부만 알 때 (mock fallback)
 * @param {boolean} levelTestCompleted
 * @param {string} [fallbackHome='/home']
 */
export const resolvePostAuthPath = (levelTestCompleted, fallbackHome = '/home') =>
  resolveAuthEntryPath({ levelTestCompleted, fallbackHome })

/**
 * 인증된 사용자의 온보딩 라우트 가드 분기
 * — onboardingStep(POST /auth/login) 우선, 없으면 localStorage mock
 * @param {import('vue-router').RouteLocationNormalized} to
 * @param {object} state
 * @param {OnboardingStep | string | null | undefined} [state.onboardingStep]
 * @param {boolean} state.levelTestCompleted
 * @param {boolean} state.curriculumConfirmed
 */
export const resolveOnboardingGuardTarget = (
  to,
  { onboardingStep, levelTestCompleted, curriculumConfirmed },
) => {
  const apiTarget = resolveGuardByApiStep(onboardingStep, to)
  if (apiTarget !== null) return apiTarget

  return resolveGuardByLocalState(to, { levelTestCompleted, curriculumConfirmed })
}
