const hasCurrentProgress = (stage) =>
  stage?.scenarioStatus === 'IN_PROGRESS' ||
  stage?.periods?.some(
    (item) => item.status === 'IN_PROGRESS' || item.quiz?.activeAttemptId != null,
  )

/**
 * 홈 학습 노트가 표시할 대단원을 결정한다.
 * 이어하기 API는 소단원·시나리오를 포함한 사용자의 실제 현재 학습 위치이므로
 * 로드맵의 ACTIVE 상태나 대시보드 요약보다 우선한다.
 *
 * @param {{ continuePosition?: { mainChapterId?: number | string | null } | null, stages?: Array<{ mainChapterId: number, status?: string, scenarioStatus?: string, periods?: Array<object> }>, curriculumItems?: Array<{ mainChapterId: number, status?: string }> }} options
 */
export const findFocusedMainChapterId = ({
  continuePosition,
  stages = [],
  curriculumItems = [],
}) => {
  const continueMainChapterId = Number(continuePosition?.mainChapterId)
  if (
    Number.isFinite(continueMainChapterId) &&
    stages.some((stage) => stage.mainChapterId === continueMainChapterId)
  ) {
    return continueMainChapterId
  }

  const progressStage = stages.find(hasCurrentProgress)
  if (progressStage) return progressStage.mainChapterId

  return (
    curriculumItems.find((item) => item.status === 'ACTIVE')?.mainChapterId ??
    stages.find((stage) => stage.status === 'ACTIVE')?.mainChapterId ??
    null
  )
}
