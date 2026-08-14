import {
  MOCK_CURRICULUM_RESPONSE,
  MOCK_LEARNING_PROGRESS,
  mockContinueStore,
} from './studyMockData.js'
import { mapCurriculumItem, normalizeCurriculumStatuses } from '../mappers/curriculumMapper.js'
import { buildRoadmapStage } from '../mappers/roadmapMapper.js'

export { mockContinueStore } from './studyMockData.js'

const getLessonProgressForChapter = (mainChapterId) =>
  MOCK_LEARNING_PROGRESS.filter(
    (item) => item.mainChapterId === mainChapterId && item.entryType === 'LESSON',
  ).sort((a, b) => a.order - b.order)

/**
 * 대단원 내 모든 LESSON 수료 여부
 * @param {number} mainChapterId
 */
export const areAllLessonsCompleted = (mainChapterId) => {
  const lessons = getLessonProgressForChapter(mainChapterId)
  return lessons.length > 0 && lessons.every((item) => item.status === 'COMPLETED')
}

/**
 * ACTIVE 대단원 progress_percent를 LESSON 수료 비율로 동기화
 * @param {number} mainChapterId
 */
export const syncCurriculumProgressPercent = (mainChapterId) => {
  const item = MOCK_CURRICULUM_RESPONSE.data.items.find(
    (row) => row.main_chapter_id === mainChapterId,
  )
  if (!item || item.status === 'COMPLETED') return
  const lessons = getLessonProgressForChapter(mainChapterId)
  if (!lessons.length) return
  const done = lessons.filter((row) => row.status === 'COMPLETED').length
  item.progress_percent = Math.round((done / lessons.length) * 100)
}

/**
 * 시나리오 수료 시 해당 대단원 COMPLETED + 다음 LOCKED 대단원 ACTIVE
 * @param {number} completedMainChapterId
 */
export const promoteNextCurriculumChapter = (completedMainChapterId) => {
  const items = MOCK_CURRICULUM_RESPONSE.data.items
  const completed = items.find((item) => item.main_chapter_id === completedMainChapterId)
  if (!completed) return

  const now = new Date().toISOString()
  completed.status = 'COMPLETED'
  completed.progress_percent = 100
  completed.completed_at = completed.completed_at ?? now

  const next = items
    .filter((item) => item.display_order > completed.display_order && item.status === 'LOCKED')
    .sort((a, b) => a.display_order - b.display_order)[0]

  if (next) {
    next.status = 'ACTIVE'
    next.progress_percent = 0
    next.completed_at = null
  }
}

/**
 * 진행도·커리큘럼 기준으로 이어하기 위치 재계산
 * StudyNote「이어서 →」및 getContinuePosition 응답에 반영
 */
export const recomputeContinuePosition = () => {
  const items = MOCK_CURRICULUM_RESPONSE.data.items
  const activeChapter =
    items.find((item) => item.status === 'ACTIVE') ??
    items
      .filter((item) => item.status !== 'LOCKED')
      .sort((a, b) => b.display_order - a.display_order)[0]

  if (!activeChapter) {
    mockContinueStore.data = null
    return
  }

  const mainChapterId = activeChapter.main_chapter_id
  const lessons = getLessonProgressForChapter(mainChapterId)

  if (!lessons.length) {
    mockContinueStore.data = {
      curriculum_item_id: activeChapter.curriculum_item_id,
      main_chapter_id: mainChapterId,
      sub_chapter_id: null,
      content_version_id: null,
      last_page_id: null,
      progress_percent: activeChapter.progress_percent ?? 0,
      route: `/learning?mainChapterId=${mainChapterId}`,
    }
    return
  }

  const inProgress = lessons.find((item) => item.status === 'IN_PROGRESS')
  const incomplete = lessons.find((item) => item.status !== 'COMPLETED')
  const targetLesson = inProgress ?? incomplete

  if (targetLesson) {
    const pageQuery = targetLesson.lastPageId ? `?page=${targetLesson.lastPageId}` : ''
    mockContinueStore.data = {
      curriculum_item_id: activeChapter.curriculum_item_id,
      main_chapter_id: mainChapterId,
      sub_chapter_id: targetLesson.subChapterId,
      content_version_id: targetLesson.contentVersionId,
      last_page_id: targetLesson.lastPageId ?? null,
      progress_percent:
        targetLesson.status === 'COMPLETED' ? 100 : targetLesson.status === 'IN_PROGRESS' ? 50 : 0,
      route: `/learning/sub-chapters/${targetLesson.subChapterId}${pageQuery}`,
    }
    return
  }

  const scenarioProgress = MOCK_LEARNING_PROGRESS.find(
    (item) =>
      item.mainChapterId === mainChapterId &&
      item.entryType === 'SCENARIO_QUIZ' &&
      item.status !== 'COMPLETED',
  )

  if (scenarioProgress) {
    mockContinueStore.data = {
      curriculum_item_id: activeChapter.curriculum_item_id,
      main_chapter_id: mainChapterId,
      sub_chapter_id: null,
      content_version_id: null,
      last_page_id: null,
      progress_percent: 100,
      route: `/learning/main-chapters/${mainChapterId}/scenario-quiz`,
    }
    return
  }

  if (activeChapter.status !== 'ACTIVE') {
    mockContinueStore.data = null
    return
  }

  mockContinueStore.data = {
    curriculum_item_id: activeChapter.curriculum_item_id,
    main_chapter_id: mainChapterId,
    sub_chapter_id: lessons[0]?.subChapterId ?? null,
    content_version_id: lessons[0]?.contentVersionId ?? null,
    last_page_id: null,
    progress_percent: activeChapter.progress_percent ?? 0,
    route: `/learning?mainChapterId=${mainChapterId}`,
  }
}

/**
 * @param {import('@/types/study.js').LearningProgressItem} row
 * @param {import('@/types/study.js').CurriculumItem} chapter
 * @param {import('@/types/study.js').LearningProgressItem[]} lessons
 * @returns {import('@/types/study.js').ScheduleStatus}
 */
const deriveMockScheduleStatus = (row, chapter, lessons) => {
  if (chapter.status === 'LOCKED') return 'LOCKED'
  if (row.status === 'COMPLETED') return 'COMPLETED'
  if (row.status === 'IN_PROGRESS') return 'IN_PROGRESS'
  const firstIncomplete = lessons.find((item) => item.status !== 'COMPLETED')
  if (firstIncomplete && row.subChapterId === firstIncomplete.subChapterId) return 'NEXT'
  return 'LOCKED'
}

/**
 * DEV/E2E — in-memory mock에서 로드맵 응답 조립 (GET /learning/roadmap 폴백)
 */
export const buildMockLearningRoadmap = () => {
  const curriculumItems = normalizeCurriculumStatuses(
    MOCK_CURRICULUM_RESPONSE.data.items.map(mapCurriculumItem),
  )

  const stages = curriculumItems.map((chapter) => {
    const lessons = getLessonProgressForChapter(chapter.mainChapterId)
    const scenarioRow = MOCK_LEARNING_PROGRESS.find(
      (item) => item.mainChapterId === chapter.mainChapterId && item.entryType === 'SCENARIO_QUIZ',
    )

    const periods = lessons.map((row) => ({
      ...structuredClone(row),
      scheduleStatus: deriveMockScheduleStatus(row, chapter, lessons),
    }))

    if (scenarioRow) {
      periods.push({
        ...structuredClone(scenarioRow),
        scheduleStatus:
          scenarioRow.status === 'COMPLETED'
            ? 'COMPLETED'
            : areAllLessonsCompleted(chapter.mainChapterId)
              ? 'NEXT'
              : 'LOCKED',
      })
    }

    const mainChapterQuiz = {
      available: areAllLessonsCompleted(chapter.mainChapterId),
      status: scenarioRow?.status === 'COMPLETED' ? 'COMPLETED' : 'NOT_STARTED',
    }

    return buildRoadmapStage(chapter, periods, mainChapterQuiz)
  })

  return { curriculumItems, stages }
}
