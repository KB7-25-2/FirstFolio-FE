import { describe, it, expect, beforeEach } from 'vitest'
import {
  ONBOARDING_PATHS,
  ONBOARDING_ROUTE_NAMES,
  resolveAuthEntryPath,
  resolveOnboardingGuardTarget,
  resolvePostAuthPath,
} from '@/router/onboardingRedirect.js'

const route = (name, path = '/', query = {}) => ({
  name,
  path,
  query,
  matched: [{ meta: {} }],
})

describe('onboardingRedirect (unit)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('resolveAuthEntryPath', () => {
    it('API onboarding_step LEVEL_TEST이면 intro로 보낸다', () => {
      expect(
        resolveAuthEntryPath({
          onboardingStep: 'LEVEL_TEST',
          levelTestCompleted: true,
          curriculumConfirmed: true,
        }),
      ).toBe(ONBOARDING_PATHS.intro)
    })

    it('API onboarding_step CURRICULUM이면 curriculum으로 보낸다', () => {
      expect(
        resolveAuthEntryPath({
          onboardingStep: 'CURRICULUM',
          levelTestCompleted: false,
        }),
      ).toBe(ONBOARDING_PATHS.curriculum)
    })

    it('API onboarding_step HOME이면 home으로 보낸다', () => {
      expect(
        resolveAuthEntryPath({
          onboardingStep: 'HOME',
          fallbackHome: '/home',
        }),
      ).toBe('/home')
    })

    it('레벨 테스트 미완료면 intro로 보낸다', () => {
      expect(resolveAuthEntryPath({ levelTestCompleted: false })).toBe(ONBOARDING_PATHS.intro)
    })

    it('레벨 테스트 완료 + 커리큘럼 확정이면 fallback home으로 보낸다', () => {
      expect(
        resolveAuthEntryPath({
          levelTestCompleted: true,
          curriculumConfirmed: true,
          fallbackHome: '/learning',
        }),
      ).toBe('/learning')
    })

    it('레벨 테스트 완료 + 커리큘럼 미확정이면 result로 보낸다', () => {
      expect(
        resolveAuthEntryPath({
          levelTestCompleted: true,
          curriculumConfirmed: false,
        }),
      ).toBe(ONBOARDING_PATHS.result)
    })
  })

  describe('resolvePostAuthPath', () => {
    it('resolveAuthEntryPath와 동일한 규칙을 따른다', () => {
      expect(resolvePostAuthPath(false)).toBe(ONBOARDING_PATHS.intro)
      expect(resolvePostAuthPath(true, '/home')).toBe(ONBOARDING_PATHS.result)
    })
  })

  describe('resolveOnboardingGuardTarget', () => {
    it('API LEVEL_TEST + home 접근 시 intro로 보낸다', () => {
      expect(
        resolveOnboardingGuardTarget(route('home', '/home'), {
          onboardingStep: 'LEVEL_TEST',
          levelTestCompleted: false,
          curriculumConfirmed: false,
        }),
      ).toEqual({ path: ONBOARDING_PATHS.intro })
    })

    it('API CURRICULUM + home 접근 시 curriculum으로 보낸다', () => {
      expect(
        resolveOnboardingGuardTarget(route('home', '/home'), {
          onboardingStep: 'CURRICULUM',
          levelTestCompleted: true,
          curriculumConfirmed: false,
        }),
      ).toEqual({ name: ONBOARDING_ROUTE_NAMES.curriculum })
    })

    it('API HOME이면 home 접근을 허용한다', () => {
      expect(
        resolveOnboardingGuardTarget(route('home', '/home'), {
          onboardingStep: 'HOME',
          levelTestCompleted: true,
          curriculumConfirmed: true,
        }),
      ).toBe(true)
    })

    it('API HOME + 온보딩 접근 시 home으로 보낸다', () => {
      expect(
        resolveOnboardingGuardTarget(route(ONBOARDING_ROUTE_NAMES.intro, '/onboarding/intro'), {
          onboardingStep: 'HOME',
          levelTestCompleted: true,
          curriculumConfirmed: true,
        }),
      ).toEqual({ path: '/home' })
    })

    it('API HOME + 커리큘럼 수정(mode=edit)은 허용한다', () => {
      expect(
        resolveOnboardingGuardTarget(
          route(ONBOARDING_ROUTE_NAMES.curriculum, '/onboarding/curriculum', { mode: 'edit' }),
          {
            onboardingStep: 'HOME',
            levelTestCompleted: true,
            curriculumConfirmed: true,
          },
        ),
      ).toBe(true)
    })

    it('mock fallback: 미완료 사용자가 home 접근 시 intro로 보낸다', () => {
      expect(
        resolveOnboardingGuardTarget(route('home', '/home'), {
          levelTestCompleted: false,
          curriculumConfirmed: false,
        }),
      ).toEqual({ path: ONBOARDING_PATHS.intro })
    })

    it('mock fallback: 미완료 사용자가 result 접근 시 quiz로 보낸다', () => {
      expect(
        resolveOnboardingGuardTarget(route(ONBOARDING_ROUTE_NAMES.result, '/onboarding/result'), {
          levelTestCompleted: false,
          curriculumConfirmed: false,
        }),
      ).toEqual({ name: ONBOARDING_ROUTE_NAMES.quiz })
    })

    it('mock fallback: 완료 + 커리큘럼 확정 사용자가 온보딩 접근 시 home으로 보낸다', () => {
      expect(
        resolveOnboardingGuardTarget(route(ONBOARDING_ROUTE_NAMES.intro, '/onboarding/intro'), {
          levelTestCompleted: true,
          curriculumConfirmed: true,
        }),
      ).toEqual({ path: '/home' })
    })

    it('mock fallback: 완료 + 커리큘럼 미확정 사용자가 home 접근 시 curriculum으로 보낸다', () => {
      expect(
        resolveOnboardingGuardTarget(route('home', '/home'), {
          levelTestCompleted: true,
          curriculumConfirmed: false,
        }),
      ).toEqual({ name: ONBOARDING_ROUTE_NAMES.curriculum })
    })
  })
})
