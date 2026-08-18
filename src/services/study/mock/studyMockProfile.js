import { setGrantedSimulationCash } from '@/utils/foundationGrant.js'
import {
  MOCK_CHAPTER_GAMES,
  MOCK_CURRICULUM_RESPONSE,
  MOCK_LEARNING_PROGRESS,
} from './studyMockData.js'
import { recomputeContinuePosition } from './studyMockEngine.js'

/** @typedef {'mid-curriculum' | 'foundation-pending'} MockLearningProfile */

/** 기본 시드 스냅샷 (기초 수료 · 예·적금 진행 중) */
const MID_CURRICULUM_SNAPSHOT = {
  curriculumItems: structuredClone(MOCK_CURRICULUM_RESPONSE.data.items),
  learningProgress: structuredClone(MOCK_LEARNING_PROGRESS),
}

/** @type {MockLearningProfile} */
let mockLearningProfile = 'mid-curriculum'

const applyMidCurriculumProfile = () => {
  MOCK_CURRICULUM_RESPONSE.data.items = structuredClone(MID_CURRICULUM_SNAPSHOT.curriculumItems)
  MOCK_LEARNING_PROGRESS.length = 0
  MOCK_LEARNING_PROGRESS.push(...structuredClone(MID_CURRICULUM_SNAPSHOT.learningProgress))
  recomputeContinuePosition()
}

const applyFoundationPendingProfile = () => {
  for (const item of MOCK_CURRICULUM_RESPONSE.data.items) {
    if (item.chapter_type === 'FOUNDATION') {
      item.status = 'ACTIVE'
      item.completed_at = null
      item.progress_percent = 0
    } else {
      item.status = 'LOCKED'
      item.completed_at = null
      item.progress_percent = 0
    }
  }

  for (const row of MOCK_LEARNING_PROGRESS) {
    row.status = 'NOT_STARTED'
    row.startedAt = null
    row.completedAt = null
    row.lastPageId = null
    row.quizScore = null
    row.updatedAt = '2026-06-01T00:00:00'
  }

  for (const game of MOCK_CHAPTER_GAMES.values()) {
    game.unlocked = false
    for (const scenario of game.scenarios) {
      scenario.completed = false
    }
  }

  setGrantedSimulationCash(false)
  recomputeContinuePosition()
}

/**
 * 학습 mock 진도 프로필 전환 (테스트·가이드 연동용)
 * @param {MockLearningProfile} profile
 */
export const __setMockLearningProfile = (profile) => {
  if (profile !== 'mid-curriculum' && profile !== 'foundation-pending') {
    throw new Error(`Unknown mock learning profile: ${profile}`)
  }
  mockLearningProfile = profile
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('mock_learning_profile', profile)
    }
  } catch {
    /* ignore */
  }
  if (profile === 'foundation-pending') {
    applyFoundationPendingProfile()
    return
  }
  applyMidCurriculumProfile()
}

/** @returns {MockLearningProfile} */
export const __getMockLearningProfile = () => mockLearningProfile

const resolveInitialMockLearningProfile = () => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('mock_learning_profile')
      if (stored === 'mid-curriculum' || stored === 'foundation-pending') return stored
    }
  } catch {
    /* ignore */
  }
  return 'mid-curriculum'
}

__setMockLearningProfile(resolveInitialMockLearningProfile())

if (typeof window !== 'undefined') {
  window.__setMockLearningProfile = __setMockLearningProfile
  window.__getMockLearningProfile = __getMockLearningProfile
}
