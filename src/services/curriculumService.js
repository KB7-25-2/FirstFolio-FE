import {
  confirmCurriculumDraft,
  fetchCurriculumDraft,
  getUserCurriculum,
  updateCurriculumDraft,
  updateUserCurriculum,
} from '@/api/user/curriculumApi.js'
import { clearCurriculumConfirmed } from '@/utils/curriculumConfirm.js'

const unwrap = (response) => response.data?.data ?? response.data

const pick = (obj, camel, snake) => obj?.[camel] ?? obj?.[snake]

const mapSourceType = (sourceType, chapterType) => {
  const raw = sourceType ?? chapterType
  if (raw === 'FOUNDATION') return 'REQUIRED'
  if (raw === 'USER_ADDED') return 'CART'
  if (raw === 'ASSET') return 'CART'
  return raw
}

const mapItem = (item) => ({
  mainChapterId: pick(item, 'mainChapterId', 'main_chapter_id'),
  title: item.title,
  sourceType: mapSourceType(
    pick(item, 'sourceType', 'source_type'),
    pick(item, 'chapterType', 'chapter_type'),
  ),
  displayOrder: pick(item, 'displayOrder', 'display_order'),
  removable:
    item.removable ??
    mapSourceType(
      pick(item, 'sourceType', 'source_type'),
      pick(item, 'chapterType', 'chapter_type'),
    ) !== 'REQUIRED',
})

const mapCandidate = (item) => ({
  mainChapterId: pick(item, 'mainChapterId', 'main_chapter_id'),
  title: item.title,
})

/** 라이브 BE 요청 본문 — snake_case (Swagger camelCase와 불일치) */
const assetIdsBody = (payload) => {
  const raw = payload?.mainChapterIds ?? payload?.main_chapter_ids ?? []
  const main_chapter_ids = (Array.isArray(raw) ? raw : [])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id))
  return { main_chapter_ids }
}

export const chapterTitle = (mainChapterId) => `대단원 ${mainChapterId}`

export const getCurriculumDraft = async () => {
  const response = await fetchCurriculumDraft()
  const raw = unwrap(response)
  return {
    data: {
      items: (raw.items ?? []).map(mapItem),
      recommendationCandidates: (
        raw.recommendationCandidates ??
        raw.recommendation_candidates ??
        []
      ).map(mapCandidate),
      cartCandidates: (raw.cartCandidates ?? raw.cart_candidates ?? []).map(mapCandidate),
    },
  }
}

export const saveCurriculumDraft = async (payload) => {
  const body = assetIdsBody(payload)
  const response = await updateCurriculumDraft(body)
  const raw = unwrap(response)
  return { data: { items: (raw.items ?? []).map(mapItem) } }
}

export const confirmCurriculum = async (payload) => {
  const body = assetIdsBody(payload)
  const response = await confirmCurriculumDraft(body)
  const raw = unwrap(response)
  return {
    data: {
      status: 'CONFIRMED',
      items: (raw.items ?? []).map(mapItem),
    },
  }
}

/** 확정된 개인 커리큘럼 조회 (GET /curriculum) */
export const getConfirmedCurriculum = async () => {
  const response = await getUserCurriculum()
  const raw = unwrap(response)
  return {
    data: {
      items: (raw.items ?? []).map(mapItem),
    },
  }
}

/** 확정된 개인 커리큘럼 수정 (PUT /curriculum) */
export const updateConfirmedCurriculum = async (payload) => {
  const body = assetIdsBody(payload)
  const response = await updateUserCurriculum(body)
  const raw = unwrap(response)
  return {
    data: {
      status: 'CONFIRMED',
      items: (raw.items ?? []).map(mapItem),
    },
  }
}

export const resetCurriculumState = () => {
  clearCurriculumConfirmed()
}
