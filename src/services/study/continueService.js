import { getContinuePosition as getContinuePositionApi } from '@/api/user/studyApi.js'
import { parseApiError } from '@/api/user/errorHandler.js'
import { StudyApiError } from './studyApiError.js'
import { unwrap } from './studyResponseUtils.js'
import { mapContinuePosition } from './mappers/continueMapper.js'

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
    throw new StudyApiError(
      parsed?.code ?? error?.code ?? 'CONTINUE_FETCH_FAILED',
      parsed?.message ?? error?.message ?? '이어하기 위치를 불러오지 못했습니다.',
      parsed?.status ?? error?.status ?? 500,
    )
  }
}
