import { getRoadmap as getRoadmapApi } from '@/api/user/studyApi.js'
import { parseApiError } from '@/api/user/errorHandler.js'
import { StudyApiError } from './studyApiError.js'
import { unwrap } from './studyResponseUtils.js'
import {
  buildRoadmapStage,
  mapRoadmapChapterItem,
  mapRoadmapSubChapter,
} from './mappers/roadmapMapper.js'

/**
 * @typedef {import('@/types/study.js').CurriculumItem} CurriculumItem
 */

/**
 * 학습 로드맵 통합 조회
 * GET /learning/roadmap
 * @returns {Promise<{ data: { curriculumItems: CurriculumItem[], stages: ReturnType<typeof buildRoadmapStage>[] } }>}
 * @throws {StudyApiError} CURRICULUM_NOT_FOUND
 */
export const getLearningRoadmap = async () => {
  try {
    const raw = unwrap(await getRoadmapApi())
    const rawItems = raw?.items ?? []
    if (!rawItems.length) {
      throw new StudyApiError('CURRICULUM_NOT_FOUND', '확정된 커리큘럼이 없다.', 404)
    }

    const curriculumItems = rawItems.map(mapRoadmapChapterItem)
    const stages = rawItems.map((item) => {
      const chapter = mapRoadmapChapterItem(item)
      const subChapters = (item.sub_chapters ?? item.subChapters ?? []).map((row) =>
        mapRoadmapSubChapter(row, chapter.mainChapterId),
      )
      const mainChapterQuiz = item.main_chapter_quiz ?? item.mainChapterQuiz ?? null
      return buildRoadmapStage(chapter, subChapters, mainChapterQuiz)
    })

    return { data: { curriculumItems, stages } }
  } catch (error) {
    if (error instanceof StudyApiError) throw error
    const parsed = parseApiError(error)
    const mapped = new StudyApiError(
      parsed?.code || 'ROADMAP_FETCH_FAILED',
      parsed?.message || '학습 로드맵을 불러오지 못했습니다.',
      parsed?.status || 500,
    )
    if (mapped.status === 404 || mapped.code === 'CURRICULUM_NOT_FOUND') {
      throw new StudyApiError(
        'CURRICULUM_NOT_FOUND',
        mapped.message || '확정된 커리큘럼이 없다.',
        404,
      )
    }
    throw mapped
  }
}

export { buildRoadmapStage } from './mappers/roadmapMapper.js'
