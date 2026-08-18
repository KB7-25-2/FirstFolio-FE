import { describe, expect, it } from 'vitest'
import {
  mapCurriculumItem,
  normalizeCurriculumStatuses,
} from '@/services/study/mappers/curriculumMapper.js'
import {
  buildRoadmapStage,
  mapRoadmapChapterItem,
  mapRoadmapSubChapter,
} from '@/services/study/mappers/roadmapMapper.js'
import { pickStageLearningItems } from '@/services/study/roadmapService.js'
import { buildMockLearningRoadmap } from '@/services/study/mock/studyMockEngine.js'
import {
  mapSubChapterListItem,
  mergeProgressIntoItem,
  mapSubChapterProgress,
  needsQuizAttempt,
  isPeriodQuizDue,
} from '@/services/study/mappers/subChapterMapper.js'
import { mapQuizAttemptStart, mapQuizAttemptQuestion } from '@/services/study/mappers/quizMapper.js'

describe('curriculumMapper', () => {
  it('mapCurriculumItem은 ASSET을 CORE로 정규화한다', () => {
    const item = mapCurriculumItem({
      curriculum_item_id: 1,
      main_chapter_id: 2,
      title: '예·적금',
      chapter_type: 'ASSET',
      display_order: 2,
      status: 'ACTIVE',
      progress_percent: 40,
    })

    expect(item.chapterType).toBe('CORE')
    expect(item.status).toBe('PENDING')
  })

  it('normalizeCurriculumStatuses는 첫 미완료만 ACTIVE로 둔다', () => {
    const items = normalizeCurriculumStatuses([
      mapCurriculumItem({
        curriculum_item_id: 1,
        main_chapter_id: 1,
        title: '기초',
        chapter_type: 'FOUNDATION',
        display_order: 1,
        status: 'COMPLETED',
        progress_percent: 100,
        completed_at: '2026-01-01',
      }),
      mapCurriculumItem({
        curriculum_item_id: 2,
        main_chapter_id: 2,
        title: '예·적금',
        chapter_type: 'CORE',
        display_order: 2,
        status: 'ACTIVE',
        progress_percent: 0,
      }),
      mapCurriculumItem({
        curriculum_item_id: 3,
        main_chapter_id: 3,
        title: '채권',
        chapter_type: 'CORE',
        display_order: 3,
        status: 'LOCKED',
        progress_percent: 0,
      }),
    ])

    expect(items.map((row) => row.status)).toEqual(['COMPLETED', 'ACTIVE', 'LOCKED'])
  })
})

describe('roadmapMapper', () => {
  it('mapRoadmapSubChapter는 snake_case progress를 매핑한다', () => {
    const row = mapRoadmapSubChapter(
      {
        sub_chapter_id: 103,
        title: '금리의 이해',
        display_order: 3,
        description: '3교시',
        progress_status: 'IN_PROGRESS',
        schedule_status: 'AVAILABLE',
        last_page_id: 'page-2',
      },
      2,
    )

    expect(row).toMatchObject({
      mainChapterId: 2,
      subChapterId: 103,
      status: 'IN_PROGRESS',
      scheduleStatus: 'AVAILABLE',
      lastPageId: 'page-2',
      order: 3,
    })
  })

  it('buildRoadmapStage는 LOCKED 대단원의 소단원 scheduleStatus를 LOCKED로 만든다', () => {
    const chapter = mapRoadmapChapterItem({
      curriculum_item_id: 502,
      main_chapter_id: 2,
      title: '예·적금',
      chapter_type: 'CORE',
      display_order: 2,
      status: 'LOCKED',
      progress_percent: 0,
    })
    const subChapters = [
      mapRoadmapSubChapter(
        {
          sub_chapter_id: 101,
          title: '예금이란?',
          display_order: 1,
          progress_status: 'COMPLETED',
          schedule_status: 'AVAILABLE',
        },
        2,
      ),
    ]

    const stage = buildRoadmapStage(chapter, subChapters, {
      available: true,
      status: 'NOT_STARTED',
    })

    expect(stage.periods[0].scheduleStatus).toBe('LOCKED')
    expect(stage.scenarioReady).toBe(false)
  })

  it('buildRoadmapStage는 LESSON이 모두 끝나면 시나리오 CTA를 연다', () => {
    const chapter = mapRoadmapChapterItem({
      curriculum_item_id: 502,
      main_chapter_id: 2,
      title: '예·적금',
      chapter_type: 'CORE',
      display_order: 2,
      status: 'ACTIVE',
      progress_percent: 100,
    })
    const lessons = [
      mapRoadmapSubChapter(
        {
          sub_chapter_id: 103,
          title: '금리의 이해',
          display_order: 1,
          progress_status: 'COMPLETED',
          schedule_status: 'COMPLETED',
        },
        2,
      ),
    ]
    const scenarioPeriod = {
      ...lessons[0],
      subChapterId: null,
      title: '예금 실전 퀴즈',
      entryType: 'SCENARIO_QUIZ',
      status: 'NOT_STARTED',
      scheduleStatus: 'NEXT',
      order: 2,
    }

    const stage = buildRoadmapStage(chapter, [...lessons, scenarioPeriod], {
      available: true,
      status: 'NOT_STARTED',
    })

    expect(stage.scenarioReady).toBe(true)
  })

  it('pickStageLearningItems는 ACTIVE 대단원 periods를 반환한다', () => {
    const chapter = mapRoadmapChapterItem({
      curriculum_item_id: 502,
      main_chapter_id: 2,
      title: '예·적금',
      chapter_type: 'CORE',
      display_order: 2,
      status: 'ACTIVE',
      progress_percent: 50,
    })
    const subChapters = [
      mapRoadmapSubChapter(
        {
          sub_chapter_id: 101,
          title: '예금이란?',
          display_order: 1,
          progress_status: 'COMPLETED',
          schedule_status: 'COMPLETED',
        },
        2,
      ),
    ]
    const stages = [buildRoadmapStage(chapter, subChapters)]

    const items = pickStageLearningItems(stages)
    expect(items).toHaveLength(1)
    expect(items[0].subChapterId).toBe(101)
  })
})

describe('buildMockLearningRoadmap (E2E/DEV fallback)', () => {
  it('예·적금 ACTIVE 대단원에 103 IN_PROGRESS 소단원을 포함한다', () => {
    const { curriculumItems, stages } = buildMockLearningRoadmap()
    const active = curriculumItems.find((item) => item.status === 'ACTIVE')
    expect(active?.mainChapterId).toBe(2)

    const items = pickStageLearningItems(stages, 2)
    expect(items.some((row) => row.subChapterId === 103 && row.status === 'IN_PROGRESS')).toBe(true)
  })
})

describe('subChapterMapper', () => {
  it('mergeProgressIntoItem은 progress API 응답을 목록 항목에 병합한다', () => {
    const base = mapSubChapterListItem(
      { sub_chapter_id: 101, title: '예금이란?', display_order: 1 },
      2,
      0,
    )

    const merged = mergeProgressIntoItem(base, {
      sub_chapter_id: 101,
      content_version_id: 301,
      last_page_id: 'page-final',
      status: 'COMPLETED',
      completed_at: '2026-07-02T00:00:00',
    })

    expect(merged).toMatchObject({
      subChapterId: 101,
      contentVersionId: 301,
      lastPageId: 'page-final',
      status: 'COMPLETED',
    })
  })

  it('mapSubChapterProgress는 quiz 진행을 매핑한다', () => {
    const progress = mapSubChapterProgress({
      sub_chapter_id: 101,
      status: 'COMPLETED',
      quiz: {
        completed: false,
        active_attempt_id: 3001,
        answered_count: 1,
        total_count: 3,
      },
    })

    expect(progress.quiz).toEqual({
      completed: false,
      activeAttemptId: 3001,
      answeredCount: 1,
      totalCount: 3,
    })
    expect(needsQuizAttempt(progress)).toBe(true)
  })

  it('isPeriodQuizDue는 강좌 완료·소단원 미완료를 퀴즈 필요로 본다', () => {
    expect(isPeriodQuizDue({ status: 'COMPLETED', scheduleStatus: 'IN_PROGRESS' })).toBe(true)
    expect(isPeriodQuizDue({ status: 'COMPLETED', scheduleStatus: 'COMPLETED' })).toBe(false)
  })
})

describe('quizMapper', () => {
  it('mapQuizAttemptStart는 questions 배열을 매핑한다', () => {
    const mapped = mapQuizAttemptStart({
      attempt_id: 99,
      quiz_type: 'SUB_CHAPTER',
      sub_chapter_id: 103,
      question_count: 1,
      status: 'IN_PROGRESS',
      questions: [
        {
          question_id: 1001,
          question_type: 'SINGLE_CHOICE',
          prompt: '테스트',
          choices: [{ key: '1', label: 'A' }],
        },
      ],
    })

    expect(mapped).toMatchObject({
      attemptId: 99,
      quizType: 'SUB_CHAPTER',
      subChapterId: 103,
      questionCount: 1,
    })
    expect(mapped.questions[0].questionId).toBe(1001)
    expect(mapped.questions[0].optionsJson[0].label).toBe('A')
  })

  it('mapQuizAttemptQuestion은 제출된 문항의 채점 결과를 포함한다', () => {
    const mapped = mapQuizAttemptQuestion({
      question_id: 1001,
      question_type: 'SINGLE_CHOICE',
      answered: true,
      selected_key: 'B',
      is_correct: false,
      correct_answer: { key: 'A' },
      explanation: '해설',
      choices: [{ key: 'A', label: 'A' }],
    })

    expect(mapped).toMatchObject({
      answered: true,
      selectedKey: 'B',
      isCorrect: false,
      correctAnswerJson: { key: 'A' },
      explanation: '해설',
    })
  })
})
