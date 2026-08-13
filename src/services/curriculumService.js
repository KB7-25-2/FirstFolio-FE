import {
  confirmCurriculumDraft,
  fetchCurriculumDraft,
  updateCurriculumDraft,
} from '@/api/user/curriculumApi.js'

const unwrap = (response) => response.data?.data ?? response.data

const pick = (obj, ...keys) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key]
  }
  return undefined
}

/** OpenAPI sourceType → 온보딩 UI 출처 타입 */
const mapSourceType = (sourceType) => {
  if (sourceType === 'FOUNDATION') return 'REQUIRED'
  if (sourceType === 'USER_ADDED') return 'CART'
  return sourceType
}

const mapItem = (item) => ({
  mainChapterId: pick(item, 'mainChapterId', 'main_chapter_id'),
  title: item.title,
  sourceType: mapSourceType(pick(item, 'sourceType', 'source_type')),
  displayOrder: pick(item, 'displayOrder', 'display_order'),
  removable: item.removable ?? pick(item, 'sourceType', 'source_type') !== 'FOUNDATION',
})

const mapCandidate = (item) => ({
  mainChapterId: pick(item, 'mainChapterId', 'main_chapter_id'),
  title: item.title,
})

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
  const mainChapterIds = payload?.mainChapterIds ?? payload?.main_chapter_ids ?? []
  // 라이브 BE는 snake_case 요청 본문만 수용 (Swagger 스키마와 불일치)
  const response = await updateCurriculumDraft({ main_chapter_ids: mainChapterIds })
  const raw = unwrap(response)
  return { data: { items: (raw.items ?? []).map(mapItem) } }
}

export const confirmCurriculum = async (payload) => {
  const mainChapterIds = payload?.mainChapterIds ?? payload?.main_chapter_ids ?? []
  const response = await confirmCurriculumDraft({ main_chapter_ids: mainChapterIds })
  const raw = unwrap(response)
  return {
    data: {
      status: 'CONFIRMED',
      items: (raw.items ?? []).map(mapItem),
    },
  }
}

export const resetCurriculumState = () => {}
