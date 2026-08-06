/**
 * 커리큘럼 초안 mock 서비스
 * - GET  /curriculums/draft
 * - PUT  /curriculums/draft  body: { main_chapter_ids }
 * - POST /curriculums/confirm
 * TODO: API 연동 시 curriculumApi로 교체
 */

/**
 * @typedef {import('@/types/curriculum.js').CurriculumDraft} CurriculumDraft
 * @typedef {import('@/types/curriculum.js').CurriculumConfirmItem} CurriculumConfirmItem
 * @typedef {import('@/types/curriculum.js').CurriculumConfirmResult} CurriculumConfirmResult
 */

import { LevelTestApiError } from '@/services/levelTestService.js'
import { CURRICULUM_STORAGE_KEY } from '@/utils/curriculumConfirm.js'

const LEVEL_TEST_STORAGE_KEY = 'level_test_state'
const FOUNDATION_CHAPTER_ID = 1
const ASSET_CHAPTER_IDS = new Set([2, 3, 4, 5])
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

const CHAPTER_META = {
  1: { title: '포트폴리오 기초 과정' },
  2: { title: '예·적금' },
  3: { title: '채권' },
  4: { title: '주식' },
  5: { title: '펀드' },
}

export const chapterTitle = (mainChapterId) =>
  CHAPTER_META[mainChapterId]?.title ?? `대단원 ${mainChapterId}`

const readLevelTestState = () => {
  try {
    const raw = localStorage.getItem(LEVEL_TEST_STORAGE_KEY)
    if (!raw) return { completed: false, attempt: null }
    const parsed = JSON.parse(raw)
    return {
      completed: Boolean(parsed.completed),
      attempt: parsed.attempt ?? null,
    }
  } catch {
    return { completed: false, attempt: null }
  }
}

/**
 * @returns {{ confirmed: boolean, items: object[] | null, wrongIds: number[], cartIds: number[] }}
 */
const readCurriculumState = () => {
  try {
    const raw = localStorage.getItem(CURRICULUM_STORAGE_KEY)
    if (!raw) return { confirmed: false, items: null, wrongIds: [], cartIds: [] }
    const parsed = JSON.parse(raw)
    return {
      confirmed: Boolean(parsed.confirmed),
      items: parsed.items ?? null,
      wrongIds: parsed.wrong_ids ?? [],
      cartIds: parsed.cart_ids ?? [],
    }
  } catch {
    return { confirmed: false, items: null, wrongIds: [], cartIds: [] }
  }
}

const writeCurriculumState = (state) => {
  localStorage.setItem(CURRICULUM_STORAGE_KEY, JSON.stringify(state))
}

const requireLevelTestCompleted = () => {
  const state = readLevelTestState()
  if (!state.completed || !state.attempt?.submit_result) {
    throw new LevelTestApiError('LEVEL_TEST_REQUIRED', '레벨 테스트 완료가 필요하다.', 409)
  }
  return state
}

const mapDraft = (raw) => ({
  items: (raw.items || []).map((item) => ({
    mainChapterId: item.main_chapter_id,
    title: item.title ?? chapterTitle(item.main_chapter_id),
    sourceType: item.source_type,
    displayOrder: item.display_order,
    removable: item.source_type !== 'REQUIRED',
  })),
  cartCandidates: (raw.cart_candidates || []).map((c) => ({
    mainChapterId: c.main_chapter_id,
    title: c.title ?? chapterTitle(c.main_chapter_id),
  })),
  recommendationCandidates: (raw.recommendation_candidates || []).map((c) => ({
    mainChapterId: c.main_chapter_id,
    title: c.title ?? chapterTitle(c.main_chapter_id),
    sourceType: 'LEVEL_TEST_WRONG',
    removable: true,
  })),
})

/** @returns {{ wrongIds: Set<number>, cartIds: Set<number> }} */
const classifyFromSubmit = (submitResult) => {
  const wrongIds = new Set(
    (submitResult?.recommendations || []).map((r) => r.main_chapter_id ?? r.mainChapterId),
  )
  const cartIds = new Set(
    (submitResult?.cart_candidates || submitResult?.cartCandidates || []).map(
      (c) => c.main_chapter_id ?? c.mainChapterId,
    ),
  )
  return { wrongIds, cartIds }
}

const buildDefaultDraft = (submitResult) => {
  const { wrongIds, cartIds } = classifyFromSubmit(submitResult)
  /** @type {object[]} */
  const items = [
    {
      main_chapter_id: FOUNDATION_CHAPTER_ID,
      title: chapterTitle(FOUNDATION_CHAPTER_ID),
      source_type: 'REQUIRED',
      display_order: 1,
      removable: false,
    },
  ]

  let order = 2
  for (const id of wrongIds) {
    items.push({
      main_chapter_id: id,
      title: chapterTitle(id),
      source_type: 'LEVEL_TEST_WRONG',
      display_order: order,
      removable: true,
    })
    order += 1
  }

  const cart_candidates = [...cartIds].map((id) => ({
    main_chapter_id: id,
    title: chapterTitle(id),
  }))

  const recommendation_candidates = [...wrongIds].map((id) => ({
    main_chapter_id: id,
    title: chapterTitle(id),
  }))

  return {
    items,
    cart_candidates,
    recommendation_candidates,
    wrongIds: [...wrongIds],
    cartIds: [...cartIds],
  }
}

const resolveSourceType = (mainChapterId, wrongIds, cartIds) => {
  if (mainChapterId === FOUNDATION_CHAPTER_ID) return 'REQUIRED'
  if (wrongIds.has(mainChapterId)) return 'LEVEL_TEST_WRONG'
  if (cartIds.has(mainChapterId)) return 'CART'
  return 'CART'
}

/**
 * GET /curriculums/draft
 * @returns {Promise<{ data: CurriculumDraft }>}
 */
export const getCurriculumDraft = async () => {
  await delay()
  const state = requireLevelTestCompleted()
  const submitResult = state.attempt.submit_result
  const { wrongIds, cartIds } = classifyFromSubmit(submitResult)
  const saved = readCurriculumState()

  const cart_candidates = [...cartIds].map((id) => ({
    main_chapter_id: id,
    title: chapterTitle(id),
  }))
  const recommendation_candidates = [...wrongIds].map((id) => ({
    main_chapter_id: id,
    title: chapterTitle(id),
  }))

  if (saved.items?.length) {
    return {
      data: mapDraft({
        items: saved.items,
        cart_candidates,
        recommendation_candidates,
      }),
    }
  }

  const defaults = buildDefaultDraft(submitResult)
  writeCurriculumState({
    confirmed: false,
    items: defaults.items,
    wrong_ids: defaults.wrongIds,
    cart_ids: defaults.cartIds,
  })

  return {
    data: mapDraft({
      items: defaults.items,
      cart_candidates: defaults.cart_candidates,
      recommendation_candidates: defaults.recommendation_candidates,
    }),
  }
}

/**
 * PUT /curriculums/draft
 * body: { main_chapter_ids } — FOUNDATION 제외 선택 ID 순서
 * @param {{ mainChapterIds?: number[], main_chapter_ids?: number[] }} payload
 */
export const saveCurriculumDraft = async (payload) => {
  await delay()
  const state = requireLevelTestCompleted()
  const { wrongIds, cartIds } = classifyFromSubmit(state.attempt.submit_result)

  const rawIds = payload?.mainChapterIds ?? payload?.main_chapter_ids
  if (!Array.isArray(rawIds)) {
    throw new LevelTestApiError(
      'INVALID_CURRICULUM_ITEMS',
      '대단원 목록 또는 순서가 올바르지 않다.',
      422,
    )
  }

  const ids = rawIds.map(Number)
  if (ids.some((id) => id === FOUNDATION_CHAPTER_ID)) {
    throw new LevelTestApiError(
      'INVALID_CURRICULUM_ITEMS',
      'FOUNDATION ID는 요청에 포함하지 않는다.',
      422,
    )
  }
  if (ids.some((id) => !ASSET_CHAPTER_IDS.has(id))) {
    throw new LevelTestApiError(
      'INVALID_CURRICULUM_ITEMS',
      '활성 ASSET 대단원만 선택할 수 있다.',
      422,
    )
  }
  if (new Set(ids).size !== ids.length) {
    throw new LevelTestApiError('INVALID_CURRICULUM_ITEMS', '중복된 대단원 ID가 있다.', 422)
  }

  const items = [
    {
      main_chapter_id: FOUNDATION_CHAPTER_ID,
      title: chapterTitle(FOUNDATION_CHAPTER_ID),
      source_type: 'REQUIRED',
      display_order: 1,
      removable: false,
    },
    ...ids.map((id, index) => ({
      main_chapter_id: id,
      title: chapterTitle(id),
      source_type: resolveSourceType(id, wrongIds, cartIds),
      display_order: index + 2,
      removable: true,
    })),
  ]

  writeCurriculumState({
    confirmed: false,
    items,
    wrong_ids: [...wrongIds],
    cart_ids: [...cartIds],
  })

  return {
    data: {
      items: items.map((item) => ({
        mainChapterId: item.main_chapter_id,
        sourceType: item.source_type,
        displayOrder: item.display_order,
      })),
    },
  }
}

/**
 * POST /curriculums/confirm
 * @param {{ mainChapterIds?: number[], main_chapter_ids?: number[] }} [payload]
 */
export const confirmCurriculum = async (payload = {}) => {
  await delay()
  requireLevelTestCompleted()

  const rawIds = payload?.mainChapterIds ?? payload?.main_chapter_ids
  if (Array.isArray(rawIds)) {
    await saveCurriculumDraft({ main_chapter_ids: rawIds })
  }

  const saved = readCurriculumState()
  if (!saved.items?.length) {
    throw new LevelTestApiError(
      'INVALID_CURRICULUM_ITEMS',
      '대단원 목록 또는 순서가 올바르지 않다.',
      422,
    )
  }

  const confirmedAt = new Date().toISOString()
  writeCurriculumState({ ...saved, confirmed: true, confirmed_at: confirmedAt })

  return {
    data: {
      status: 'CONFIRMED',
      confirmedAt,
      items: saved.items.map((item) => ({
        mainChapterId: item.main_chapter_id,
        title: item.title ?? chapterTitle(item.main_chapter_id),
        sourceType: item.source_type,
        displayOrder: item.display_order,
      })),
    },
  }
}

export const resetCurriculumState = () => {
  localStorage.removeItem(CURRICULUM_STORAGE_KEY)
}

export const getCurriculumConfirmStatus = () => {
  const state = readCurriculumState()
  return { confirmed: state.confirmed, items: state.items }
}

export { FOUNDATION_CHAPTER_ID }
