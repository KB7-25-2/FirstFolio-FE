import { getUserCurriculum } from '@/api/user/curriculumApi.js'
import { parseApiError } from '@/api/user/errorHandler.js'
import { StudyApiError } from './studyApiError.js'
import { unwrap } from './studyResponseUtils.js'
import { mapCurriculumItem, normalizeCurriculumStatuses } from './mappers/curriculumMapper.js'

/**
 * 학습 화면용 확정 커리큘럼 (GET /curriculum)
 *
 * - **용도**: StudyNote, 기초 가이드, 포트폴리오 잠금 등 **학습 진행 UI**
 * - **매핑**: `chapterType`, 순차 학습용 `status`(ACTIVE/LOCKED/COMPLETED), `progressPercent`
 *
 * 온보딩·편집(`sourceType`, `removable`)은 `@/services/curriculumService.js`의
 * `getConfirmedCurriculum` / `getCurriculumDraft`를 사용한다.
 *
 * 소단원 목록·진도는 `getLearningRoadmap`(권장) 또는 legacy `getLearningProgress`를 사용한다.
 *
 * @typedef {import('@/types/study.js').CurriculumItem} CurriculumItem
 */

/**
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
