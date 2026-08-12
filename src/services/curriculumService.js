/**
 * 커리큘럼 초안 서비스
 * - GET  /curriculums/draft
 * - PUT  /curriculums/draft  body: { main_chapter_ids }
 * - POST /curriculums/confirm
 * — 실 API 우선, DEV에서 실패 시 로컬 mock 폴백
 */

/**
 * @typedef {import('@/types/curriculum.js').CurriculumDraft} CurriculumDraft
 * @typedef {import('@/types/curriculum.js').CurriculumConfirmItem} CurriculumConfirmItem
 * @typedef {import('@/types/curriculum.js').CurriculumConfirmResult} CurriculumConfirmResult
 */

import { LevelTestApiError } from '@/services/levelTestService.js'
import { CURRICULUM_STORAGE_KEY } from '@/utils/curriculumConfirm.js'
import { ApiError } from '@/api/errorHandler.js'
import {
  confirmCurriculum as confirmCurriculumApi,
  getCurriculumDraft as getCurriculumDraftApi,
  saveCurriculumDraft as saveCurriculumDraftApi,
} from '@/api/curriculumApi.js'
import { pickField, unwrapData } from '@/utils/apiMapper.js'

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
  items: (raw.items || []).map((item) => {
    const mainChapterId = Number(pickField(item, 'mainChapterId', 'main_chapter_id'))
    const sourceType = pickField(item, 'sourceType', 'source_type')
    return {
      mainChapterId,
      title: item.title ?? chapterTitle(mainChapterId),
      sourceType,
      displayOrder: Number(pickField(item, 'displayOrder', 'display_order') ?? 0),
      removable: pickField(item, 'removable') ?? sourceType !== 'REQUIRED',
    }
  }),
  cartCandidates: (raw.cartCandidates || raw.cart_candidates || []).map((c) => {
    const mainChapterId = Number(pickField(c, 'mainChapterId', 'main_chapter_id'))
    return {
      mainChapterId,
      title: c.title ?? chapterTitle(mainChapterId),
    }
  }),
  recommendationCandidates: (
    raw.recommendationCandidates ||
    raw.recommendation_candidates ||
    []
  ).map((c) => {
    const mainChapterId = Number(pickField(c, 'mainChapterId', 'main_chapter_id'))
    return {
      mainChapterId,
      title: c.title ?? chapterTitle(mainChapterId),
      sourceType: 'LEVEL_TEST_WRONG',
      removable: true,
    }
  }),
})

/** DEV에서도 mock으로 가리지 않는 비즈니스 오류 */
const CURRICULUM_BUSINESS_ERROR_CODES = new Set([
  'UNAUTHORIZED',
  'LEVEL_TEST_REQUIRED',
  'INVALID_CURRICULUM_ITEMS',
  'VALIDATION_ERROR',
])

/**
 * @param {unknown} error
 * @param {string} fallbackCode
 * @param {string} fallbackMessage
 * @returns {LevelTestApiError}
 */
const mapCurriculumError = (error, fallbackCode, fallbackMessage) => {
  if (error instanceof LevelTestApiError) return error

  if (error instanceof ApiError) {
    const mapped = new LevelTestApiError(
      error.code || fallbackCode,
      error.message ?? fallbackMessage,
      error.status,
    )
    mapped.unmapped = !error.code
    return mapped
  }

  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const err = /** @type {{ code: string, message: string, status?: number }} */ (error)
    return new LevelTestApiError(err.code, err.message, err.status ?? 400)
  }

  const mapped = new LevelTestApiError(fallbackCode, fallbackMessage, 500)
  mapped.unmapped = true
  return mapped
}

/**
 * @param {LevelTestApiError} error
 * @returns {boolean}
 */
const shouldFallbackToMock = (error) => {
  if (CURRICULUM_BUSINESS_ERROR_CODES.has(error.code)) return false
  if (import.meta.env.DEV) return true
  return Boolean(error.unmapped) && (error.status === 404 || error.status === 0)
}

const mapConfirmResult = (raw) => ({
  status: raw.status ?? 'CONFIRMED',
  confirmedAt: pickField(raw, 'confirmedAt', 'confirmed_at'),
  items: (raw.items || []).map((item) => {
    const mainChapterId = Number(pickField(item, 'mainChapterId', 'main_chapter_id'))
    return {
      mainChapterId,
      title: item.title ?? chapterTitle(mainChapterId),
      sourceType: pickField(item, 'sourceType', 'source_type'),
      displayOrder: Number(pickField(item, 'displayOrder', 'display_order') ?? 0),
    }
  }),
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
const getCurriculumDraftMock = async () => {
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
 * GET /curriculums/draft — 실 API 우선
 * @returns {Promise<{ data: CurriculumDraft }>}
 */
export const getCurriculumDraft = async () => {
  try {
    const raw = unwrapData(await getCurriculumDraftApi())
    return { data: mapDraft(raw ?? {}) }
  } catch (error) {
    const mapped = mapCurriculumError(
      error,
      'DRAFT_FETCH_FAILED',
      '커리큘럼 초안을 불러오지 못했다.',
    )
    if (!shouldFallbackToMock(mapped)) throw mapped
    console.warn('[curriculumService] getCurriculumDraft API 실패 — mock 사용', mapped)
    return getCurriculumDraftMock()
  }
}

/**
 * PUT /curriculums/draft
 * body: { main_chapter_ids } — FOUNDATION 제외 선택 ID 순서
 * @param {{ mainChapterIds?: number[], main_chapter_ids?: number[] }} payload
 */
const saveCurriculumDraftMock = async (payload) => {
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
 * PUT /curriculums/draft — 실 API 우선
 * @param {{ mainChapterIds?: number[], main_chapter_ids?: number[] }} payload
 */
export const saveCurriculumDraft = async (payload) => {
  const ids = payload?.mainChapterIds ?? payload?.main_chapter_ids
  try {
    const raw = unwrapData(
      await saveCurriculumDraftApi({
        main_chapter_ids: Array.isArray(ids) ? ids.map(Number) : ids,
      }),
    )
    return {
      data: {
        items: (raw?.items ?? []).map((item) => ({
          mainChapterId: Number(pickField(item, 'mainChapterId', 'main_chapter_id')),
          sourceType: pickField(item, 'sourceType', 'source_type'),
          displayOrder: Number(pickField(item, 'displayOrder', 'display_order') ?? 0),
        })),
      },
    }
  } catch (error) {
    const mapped = mapCurriculumError(
      error,
      'INVALID_CURRICULUM_ITEMS',
      '대단원 목록 또는 순서가 올바르지 않다.',
    )
    if (!shouldFallbackToMock(mapped)) throw mapped
    console.warn('[curriculumService] saveCurriculumDraft API 실패 — mock 사용', mapped)
    return saveCurriculumDraftMock(payload)
  }
}

/**
 * POST /curriculums/confirm
 * @param {{ mainChapterIds?: number[], main_chapter_ids?: number[] }} [payload]
 */
const confirmCurriculumMock = async (payload = {}) => {
  await delay()
  requireLevelTestCompleted()

  const rawIds = payload?.mainChapterIds ?? payload?.main_chapter_ids
  if (Array.isArray(rawIds)) {
    await saveCurriculumDraftMock({ main_chapter_ids: rawIds })
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

/**
 * POST /curriculums/confirm — 실 API 우선
 * @param {{ mainChapterIds?: number[], main_chapter_ids?: number[] }} [payload]
 */
export const confirmCurriculum = async (payload = {}) => {
  const ids = payload?.mainChapterIds ?? payload?.main_chapter_ids
  try {
    const raw = unwrapData(
      await confirmCurriculumApi(Array.isArray(ids) ? { main_chapter_ids: ids.map(Number) } : {}),
    )
    return { data: mapConfirmResult(raw ?? {}) }
  } catch (error) {
    const mapped = mapCurriculumError(
      error,
      'INVALID_CURRICULUM_ITEMS',
      '커리큘럼 확정에 실패했다.',
    )
    if (!shouldFallbackToMock(mapped)) throw mapped
    console.warn('[curriculumService] confirmCurriculum API 실패 — mock 사용', mapped)
    return confirmCurriculumMock(payload)
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
