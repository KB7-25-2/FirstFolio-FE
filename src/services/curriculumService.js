import {
  confirmCurriculum as confirmCurriculumApi,
  getCurriculumDraft as getCurriculumDraftApi,
  saveCurriculumDraft as saveCurriculumDraftApi,
} from '@/api/user/curriculumApi.js'

const unwrap = (response) => response.data?.data ?? response.data

const mapSourceType = (sourceType) => {
  if (sourceType === 'FOUNDATION') return 'REQUIRED'
  if (sourceType === 'USER_ADDED') return 'CART'
  return sourceType
}

const mapItem = (item) => ({
  mainChapterId: item.main_chapter_id,
  title: item.title,
  sourceType: mapSourceType(item.source_type),
  displayOrder: item.display_order,
  removable: item.removable ?? item.source_type !== 'FOUNDATION',
})

const mapCandidate = (item) => ({
  mainChapterId: item.main_chapter_id,
  title: item.title,
})

export const chapterTitle = (mainChapterId) => `대단원 ${mainChapterId}`

export const getCurriculumDraft = async () => {
  const response = await getCurriculumDraftApi()
  const raw = unwrap(response)
  return {
    data: {
      items: (raw.items ?? []).map(mapItem),
      recommendationCandidates: (raw.recommendation_candidates ?? []).map(mapCandidate),
      cartCandidates: (raw.cart_candidates ?? []).map(mapCandidate),
    },
  }
}

export const saveCurriculumDraft = async (payload) => {
  const mainChapterIds = payload?.mainChapterIds ?? payload?.main_chapter_ids ?? []
  const response = await saveCurriculumDraftApi({ main_chapter_ids: mainChapterIds })
  const raw = unwrap(response)
  return { data: { items: (raw.items ?? []).map(mapItem) } }
}

export const confirmCurriculum = async (payload) => {
  const mainChapterIds = payload?.mainChapterIds ?? payload?.main_chapter_ids ?? []
  const response = await confirmCurriculumApi({ main_chapter_ids: mainChapterIds })
  const raw = unwrap(response)
  return {
    data: {
      status: 'CONFIRMED',
      items: (raw.items ?? []).map(mapItem),
    },
  }
}

export const resetCurriculumState = () => {}
