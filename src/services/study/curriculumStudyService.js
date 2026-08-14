import { getUserCurriculum } from '@/api/user/curriculumApi.js'
import { parseApiError } from '@/api/user/errorHandler.js'
import { StudyApiError } from './studyApiError.js'
import { unwrap } from './studyResponseUtils.js'
import { mapCurriculumItem, normalizeCurriculumStatuses } from './mappers/curriculumMapper.js'

/**
 * @typedef {import('@/types/study.js').CurriculumItem} CurriculumItem
 */

/**
 * 확정된 개인 커리큘럼 + 대단원별 진행 상태 조회
 * GET /curriculum
 * @returns {Promise<{ data: { items: CurriculumItem[] } }>}
 * @throws {StudyApiError} CURRICULUM_NOT_FOUND
 */
export const getCurriculum = async () => {
  try {
    const raw = unwrap(await getUserCurriculum())
    const items = normalizeCurriculumStatuses((raw?.items ?? []).map(mapCurriculumItem))
    if (!items.length) {
      throw new StudyApiError('CURRICULUM_NOT_FOUND', '확정된 커리큘럼이 없다.', 404)
    }
    return { data: { items } }
  } catch (error) {
    const mapped =
      error instanceof StudyApiError
        ? error
        : (() => {
            const parsed = parseApiError(error)
            if (parsed.status === 404 || parsed.code === 'CURRICULUM_NOT_FOUND') {
              return new StudyApiError(
                'CURRICULUM_NOT_FOUND',
                parsed.message || '확정된 커리큘럼이 없다.',
                404,
              )
            }
            return new StudyApiError(
              parsed.code || 'CURRICULUM_FETCH_FAILED',
              parsed.message || '커리큘럼을 불러오지 못했다.',
              parsed.status || 500,
            )
          })()

    throw mapped
  }
}
