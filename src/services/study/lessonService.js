import {
  getSubChapters as getSubChaptersApi,
  getSubChapterLesson as getSubChapterLessonApi,
  getSubChapterProgress as getSubChapterProgressApi,
  putSubChapterProgress as putSubChapterProgressApi,
} from '@/api/user/studyApi.js'
import { parseApiError } from '@/api/user/errorHandler.js'
import { StudyApiError } from './studyApiError.js'
import { pickField, unwrap } from './studyResponseUtils.js'
import {
  mapSaveProgressResponse,
  mapSubChapterContent,
  mapSubChapterListItem,
  mergeProgressIntoItem,
  normalizePutProgressStatus,
} from './mappers/subChapterMapper.js'

/**
 * @typedef {import('@/types/study.js').LearningProgressItem} LearningProgressItem
 * @typedef {import('@/types/study.js').SubChapterContent} SubChapterContent
 * @typedef {import('@/types/study.js').SubChapterLessonJson} SubChapterLessonJson
 * @typedef {import('@/types/study.js').LearningProgressStatus} LearningProgressStatus
 */

/**
 * @param {number} subChapterId
 * @param {number | null | undefined} payloadVersionId
 */
const resolveContentVersionId = async (subChapterId, payloadVersionId) => {
  if (payloadVersionId != null) return payloadVersionId
  try {
    const raw = unwrap(await getSubChapterProgressApi(subChapterId))
    return pickField(raw, 'contentVersionId', 'content_version_id') ?? null
  } catch {
    return null
  }
}

/**
 * 대단원 소단원 목록 + 각 소단원 진도 조회
 * @param {number} mainChapterId
 * @returns {Promise<{ data: { items: LearningProgressItem[] } }>}
 */
export const getLearningProgress = async (mainChapterId) => {
  try {
    const raw = unwrap(await getSubChaptersApi(mainChapterId))
    const baseItems = (raw?.items ?? [])
      .map((item, index) => mapSubChapterListItem(item, mainChapterId, index))
      .sort((a, b) => a.order - b.order)

    const items = await Promise.all(
      baseItems.map(async (item) => {
        if (!item.subChapterId) return item
        try {
          const progressRaw = unwrap(await getSubChapterProgressApi(item.subChapterId))
          return mergeProgressIntoItem(item, progressRaw)
        } catch {
          return item
        }
      }),
    )

    return { data: { items } }
  } catch (error) {
    if (error instanceof StudyApiError) throw error
    const parsed = parseApiError(error)
    const mapped = new StudyApiError(
      parsed?.code || 'SUB_CHAPTER_LIST_FAILED',
      parsed?.message || '소단원 목록을 불러오지 못했습니다.',
      parsed?.status || 500,
    )
    if (mapped.status === 404 || mapped.code === 'MAIN_CHAPTER_NOT_FOUND') {
      throw new StudyApiError(
        'MAIN_CHAPTER_NOT_FOUND',
        mapped.message || '대단원을 찾을 수 없습니다.',
        404,
      )
    }
    throw mapped
  }
}

/**
 * 소단원 메타 + 공개 강좌 + 진도
 * @param {number} subChapterId
 * @returns {Promise<{ data: SubChapterContent }>}
 */
export const getSubChapterContent = async (subChapterId) => {
  try {
    const [lessonRes, progressRes] = await Promise.all([
      getSubChapterLessonApi(subChapterId),
      getSubChapterProgressApi(subChapterId).catch(() => null),
    ])
    const lessonRaw = unwrap(lessonRes)
    const progressRaw = progressRes ? unwrap(progressRes) : null
    return { data: mapSubChapterContent(lessonRaw, progressRaw) }
  } catch (error) {
    if (error instanceof StudyApiError) throw error
    const parsed = parseApiError(error)
    throw new StudyApiError(
      parsed?.code ?? 'SUB_CHAPTER_FETCH_FAILED',
      parsed?.message ?? '소단원을 불러오지 못했습니다.',
      parsed?.status ?? 500,
    )
  }
}

/**
 * 강좌 JSON 로드 — OpenAPI는 lesson을 콘텐츠 응답에 포함
 * @param {string | null | undefined} contentUrl
 * @param {SubChapterLessonJson | null} [embeddedLesson]
 * @returns {Promise<{ data: SubChapterLessonJson }>}
 */
export const getLessonPages = async (contentUrl, embeddedLesson = null) => {
  if (embeddedLesson && (embeddedLesson.pages || embeddedLesson.schemaVersion)) {
    return { data: structuredClone(embeddedLesson) }
  }
  if (embeddedLesson && typeof embeddedLesson === 'object') {
    if (Array.isArray(embeddedLesson.pages) || embeddedLesson.subChapterQuiz) {
      return { data: structuredClone(embeddedLesson) }
    }
  }

  throw new StudyApiError('CONTENT_NOT_FOUND', '학습 페이지를 찾을 수 없다.', 404)
}

/**
 * 소단원 강좌 진도 저장
 * @param {number} subChapterId
 * @param {{ lastPageId?: string | null, status?: LearningProgressStatus, contentVersionId?: number }} payload
 */
export const saveLessonProgress = async (subChapterId, payload) => {
  const lastPageId = payload.lastPageId ?? null
  const status = normalizePutProgressStatus(payload.status)

  try {
    const contentVersionId = await resolveContentVersionId(subChapterId, payload.contentVersionId)
    if (contentVersionId == null) {
      throw new StudyApiError(
        'CONTENT_NOT_PUBLISHED',
        '공개된 학습 콘텐츠 버전을 찾을 수 없습니다.',
        404,
      )
    }

    const response = await putSubChapterProgressApi(subChapterId, {
      contentVersionId,
      lastPageId,
      status,
    })
    const raw = unwrap(response)
    return {
      data: mapSaveProgressResponse(raw, { lastPageId, status }),
    }
  } catch (error) {
    if (error instanceof StudyApiError) throw error
    const parsed = parseApiError(error)
    throw new StudyApiError(
      parsed?.code ?? 'PROGRESS_SAVE_FAILED',
      parsed?.message ?? '진도를 저장하지 못했습니다.',
      parsed?.status ?? 500,
    )
  }
}
