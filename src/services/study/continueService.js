import { getContinuePosition as getContinuePositionApi } from '@/api/user/studyApi.js'
import { parseApiError } from '@/api/user/errorHandler.js'
import { StudyApiError } from './studyApiError.js'
import { delay, shouldFallbackStudyMock, unwrap } from './studyResponseUtils.js'
import { mapContinuePosition } from './mappers/continueMapper.js'
import { mockContinueStore } from './mock/studyMockData.js'
import { recomputeContinuePosition } from './mock/studyMockEngine.js'

/**
 * @typedef {import('@/types/study.js').ContinuePosition} ContinuePosition
 */

/**
 * 마지막 미완료 학습 위치 조회
 * @returns {Promise<{ data: ContinuePosition }>}
 */
export const getContinuePosition = async () => {
  try {
    const response = await getContinuePositionApi()
    return { data: mapContinuePosition(unwrap(response)) }
  } catch (error) {
    const parsed = parseApiError(error)
    const mapped = new StudyApiError(
      parsed?.code ?? error?.code ?? 'CONTINUE_FETCH_FAILED',
      parsed?.message ?? error?.message ?? '이어하기 위치를 불러오지 못했습니다.',
      parsed?.status ?? error?.status ?? 500,
    )
    if (mapped.code === 'CONTINUE_POSITION_NOT_FOUND') throw mapped
    if (!shouldFallbackStudyMock(mapped)) throw mapped
    console.warn('[studyService] GET continue 실패 — mock으로 대체합니다.', mapped)
  }

  await delay()
  recomputeContinuePosition()
  if (!mockContinueStore.data) {
    throw new StudyApiError('CONTINUE_POSITION_NOT_FOUND', '이어갈 미완료 학습이 없다.', 404)
  }
  return { data: mapContinuePosition(structuredClone(mockContinueStore.data)) }
}
