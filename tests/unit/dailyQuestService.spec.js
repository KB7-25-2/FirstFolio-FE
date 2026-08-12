import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/api/user/errorHandler.js'

vi.mock('@/api/user/dailyQuestApi.js', () => ({
  getToday: vi.fn(() => Promise.reject(new ApiError('unavailable', 500))),
  saveAnswer: vi.fn(() => Promise.reject(new ApiError('unavailable', 500))),
  submitToday: vi.fn(() => Promise.reject(new ApiError('unavailable', 500))),
}))

vi.mock('@/store/userStore.js', () => ({
  useUserStore: () => ({
    fetchProfile: vi.fn(() => Promise.resolve()),
  }),
}))

import {
  getToday as getTodayApi,
  saveAnswer as saveAnswerApi,
  submitToday as submitTodayApi,
} from '@/api/user/dailyQuestApi.js'
import {
  __POINTS_PER_CORRECT,
  __QUESTION_SEED_COUNT,
  __STORAGE_KEY,
  getTodayDailyQuest,
  mapDailyQuest,
  resetDailyQuestState,
  resolveInitialPhase,
  resolveResumeItemIndex,
  saveDailyQuestAnswer,
  submitDailyQuest,
  DailyQuestApiError,
} from '@/services/dailyQuestService.js'
import { useDailyQuestStore } from '@/store/dailyQuestStore.js'

describe('dailyQuestService (unit)', () => {
  beforeEach(() => {
    localStorage.clear()
    resetDailyQuestState()
    vi.clearAllMocks()
    getTodayApi.mockRejectedValue(new ApiError('unavailable', 500))
    saveAnswerApi.mockRejectedValue(new ApiError('unavailable', 500))
    submitTodayApi.mockRejectedValue(new ApiError('unavailable', 500))
  })

  it('GET today 응답을 daily_quests·items 스키마 기준으로 매핑한다', () => {
    const mapped = mapDailyQuest({
      daily_quest_id: 4001,
      quest_date: '2026-07-29',
      status: 'IN_PROGRESS',
      total_count: 5,
      correct_count: 0,
      score: 0,
      answered_count: 1,
      completed_at: null,
      question_types: ['SINGLE_CHOICE', 'SCENARIO'],
      question_type_summary: [
        { question_type: 'SINGLE_CHOICE', label: '객관식 퀴즈', count: 3 },
        { question_type: 'SCENARIO', label: '시나리오 퀴즈', count: 2 },
      ],
      items: [
        {
          daily_quest_item_id: 5001,
          question_id: 1001,
          source_type: 'GENERAL',
          display_order: 1,
          question_snapshot_json: {
            question_id: 1001,
            question_key: 'q1',
            version_no: 1,
            usage_type: 'DAILY_GENERAL',
            main_chapter_id: 2,
            sub_chapter_id: null,
            question_type: 'SINGLE_CHOICE',
            prompt: '질문',
            scenario_json: null,
            options_json: [{ key: '2', label: '보기' }],
            source_refs_json: null,
          },
          user_answer_json: { selected_key: '2' },
          is_correct: null,
          answered_at: '2026-07-29T01:00:00Z',
        },
      ],
    })

    expect(mapped.dailyQuestId).toBe(4001)
    expect(mapped.status).toBe('IN_PROGRESS')
    expect(mapped.questionTypes).toEqual(['SINGLE_CHOICE', 'SCENARIO'])
    expect(mapped.items[0]).toMatchObject({
      dailyQuestItemId: 5001,
      sourceType: 'GENERAL',
      displayOrder: 1,
      userAnswer: { selectedKey: '2' },
      questionSnapshot: {
        questionId: 1001,
        questionType: 'SINGLE_CHOICE',
        optionsJson: [{ key: '2', label: '보기' }],
        scenarioJson: null,
      },
    })
  })

  it('오늘의 퀘스트를 멱등하게 5문항 배정한다', async () => {
    expect(__QUESTION_SEED_COUNT).toBeGreaterThanOrEqual(5)

    const first = await getTodayDailyQuest()
    const second = await getTodayDailyQuest()

    expect(first.data.totalCount).toBe(5)
    expect(first.data.items).toHaveLength(5)
    expect(first.data.status).toBe('ASSIGNED')
    expect(first.data.answeredCount).toBe(0)
    expect(first.data.dailyQuestId).toBe(second.data.dailyQuestId)
    expect(first.data.items.map((i) => i.questionId)).toEqual(
      second.data.items.map((i) => i.questionId),
    )
  })

  it('SINGLE_CHOICE와 SCENARIO가 섞여 배정되고 INTRO용 요약을 제공한다', async () => {
    const { data } = await getTodayDailyQuest()
    const types = data.items.map((item) => item.questionSnapshot.questionType)

    expect(types).toContain('SINGLE_CHOICE')
    expect(types).toContain('SCENARIO')
    expect(data.questionTypes).toEqual(expect.arrayContaining(['SINGLE_CHOICE', 'SCENARIO']))
    expect(data.questionTypeSummary.length).toBeGreaterThanOrEqual(2)
    expect(data.questionTypeSummary.every((row) => row.label && row.count > 0)).toBe(true)
  })

  it('SCENARIO 문항은 scenarioJson·optionsJson을 갖고, 객관식은 scenarioJson이 null이다', async () => {
    const { data } = await getTodayDailyQuest()
    const scenario = data.items.find((i) => i.questionSnapshot.questionType === 'SCENARIO')
    const objective = data.items.find((i) => i.questionSnapshot.questionType === 'SINGLE_CHOICE')

    expect(scenario?.questionSnapshot.scenarioJson).toBeTruthy()
    expect(scenario?.questionSnapshot.optionsJson?.length).toBeGreaterThanOrEqual(4)
    expect(objective?.questionSnapshot.scenarioJson).toBeNull()
    expect(objective?.questionSnapshot.optionsJson?.[0]).toEqual(
      expect.objectContaining({ key: expect.any(String), label: expect.any(String) }),
    )
  })

  it('제출 전 스냅샷에 정답·해설을 노출하지 않는다', async () => {
    const { data } = await getTodayDailyQuest()

    for (const item of data.items) {
      expect(item.questionSnapshot).not.toHaveProperty('correctAnswerJson')
      expect(item.questionSnapshot).not.toHaveProperty('explanation')
      expect(item.questionSnapshot).not.toHaveProperty('_correct_key')
    }
  })

  it('답안 저장 시 status·answeredCount·userAnswer를 갱신한다', async () => {
    const { data: session } = await getTodayDailyQuest()
    const itemId = session.items[0].dailyQuestItemId

    const { data: saved } = await saveDailyQuestAnswer({
      dailyQuestItemId: itemId,
      answer: { selectedKey: '2' },
    })

    expect(saved).toMatchObject({
      dailyQuestItemId: itemId,
      userAnswer: { selectedKey: '2' },
      answeredCount: 1,
      status: 'IN_PROGRESS',
    })

    const { data: reloaded } = await getTodayDailyQuest()
    expect(reloaded.status).toBe('IN_PROGRESS')
    expect(reloaded.answeredCount).toBe(1)
    expect(reloaded.items[0].userAnswer?.selectedKey).toBe('2')
  })

  it('이전 날짜 퀘스트는 오늘로 이어 풀지 않는다', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const y = yesterday.getFullYear()
    const m = String(yesterday.getMonth() + 1).padStart(2, '0')
    const d = String(yesterday.getDate()).padStart(2, '0')

    localStorage.setItem(
      __STORAGE_KEY,
      JSON.stringify({
        quest: {
          daily_quest_id: 3999,
          quest_date: `${y}-${m}-${d}`,
          status: 'IN_PROGRESS',
          total_count: 5,
          correct_count: 0,
          score: 0,
          answered_count: 1,
          completed_at: null,
          items: [
            {
              daily_quest_item_id: 1,
              question_id: 1,
              source_type: 'GENERAL',
              display_order: 1,
              question_snapshot_json: {
                question_id: 1,
                question_key: 'old',
                version_no: 1,
                usage_type: 'DAILY_GENERAL',
                question_type: 'SINGLE_CHOICE',
                prompt: '어제 문제',
                scenario_json: null,
                options_json: [{ key: '1', label: 'A' }],
              },
              user_answer_json: { selected_key: '1' },
              is_correct: null,
              answered_at: null,
            },
          ],
        },
      }),
    )

    const { data } = await getTodayDailyQuest()
    expect(data.dailyQuestId).not.toBe(3999)
    expect(data.answeredCount).toBe(0)
    expect(data.items).toHaveLength(5)
    expect(data.items[0].questionSnapshot.prompt).not.toBe('어제 문제')
  })

  it('resolveResumeItemIndex·resolveInitialPhase가 status에 맞게 동작한다', () => {
    expect(resolveInitialPhase('ASSIGNED')).toBe('INTRO')
    expect(resolveInitialPhase('IN_PROGRESS')).toBe('INTRO')
    expect(resolveInitialPhase('COMPLETED')).toBe('RESULT')

    expect(
      resolveResumeItemIndex({
        items: [{ userAnswer: { selectedKey: '1' } }, { userAnswer: null }, { userAnswer: null }],
      }),
    ).toBe(1)
  })

  it('잘못된 답안 저장은 DailyQuestApiError를 던진다', async () => {
    await getTodayDailyQuest()

    await expect(
      saveDailyQuestAnswer({ dailyQuestItemId: 5001, answer: {} }),
    ).rejects.toBeInstanceOf(DailyQuestApiError)
    await expect(
      saveDailyQuestAnswer({ dailyQuestItemId: 9999, answer: { selectedKey: '1' } }),
    ).rejects.toMatchObject({ code: 'ITEM_NOT_FOUND', status: 404 })
  })

  it('답안 미완료 제출은 DAILY_QUEST_ANSWERS_INCOMPLETE를 던진다', async () => {
    await getTodayDailyQuest()
    await expect(submitDailyQuest()).rejects.toMatchObject({
      code: 'DAILY_QUEST_ANSWERS_INCOMPLETE',
      status: 409,
    })
  })

  it('5문항 저장 후 submit은 채점·보상하고 재호출은 멱등이다', async () => {
    const { data: quest } = await getTodayDailyQuest()
    for (const item of quest.items) {
      await saveDailyQuestAnswer({
        dailyQuestItemId: item.dailyQuestItemId,
        answer: { selectedKey: '1' },
      })
    }

    const first = await submitDailyQuest()
    expect(first.data.status).toBe('COMPLETED')
    expect(first.data.totalCount).toBe(5)
    expect(first.data.results).toHaveLength(5)
    expect(first.data.reward.points).toBe(first.data.correctCount * __POINTS_PER_CORRECT)
    expect(first.data.results.every((row) => typeof row.explanation === 'string')).toBe(true)

    const second = await submitDailyQuest()
    expect(second.data.reward.pointTransactionId).toBe(first.data.reward.pointTransactionId)
    expect(second.data.correctCount).toBe(first.data.correctCount)
  })

  it('실 API 성공 시 GET today 응답을 매핑한다', async () => {
    getTodayApi.mockResolvedValue({
      data: {
        data: {
          daily_quest_id: 4100,
          quest_date: '2026-08-07',
          status: 'ASSIGNED',
          total_count: 5,
          correct_count: 0,
          score: 0,
          answered_count: 0,
          completed_at: null,
          items: [
            {
              daily_quest_item_id: 5100,
              question_id: 2001,
              source_type: 'GENERAL',
              display_order: 1,
              question_snapshot_json: {
                question_id: 2001,
                question_key: 'api-q1',
                version_no: 1,
                usage_type: 'DAILY_GENERAL',
                question_type: 'SINGLE_CHOICE',
                prompt: 'API 문항',
                scenario_json: null,
                options_json: [{ key: '1', label: 'A' }],
              },
              user_answer_json: null,
              is_correct: null,
              answered_at: null,
            },
          ],
        },
      },
    })

    const { data } = await getTodayDailyQuest()
    expect(getTodayApi).toHaveBeenCalled()
    expect(data.dailyQuestId).toBe(4100)
    expect(data.items[0].questionSnapshot.prompt).toBe('API 문항')
  })

  it('실 API 409 DAILY_QUEST_ANSWERS_INCOMPLETE 는 mock으로 가리지 않는다', async () => {
    submitTodayApi.mockRejectedValue(
      new ApiError('incomplete', 409, null, 'DAILY_QUEST_ANSWERS_INCOMPLETE'),
    )

    await expect(submitDailyQuest()).rejects.toMatchObject({
      code: 'DAILY_QUEST_ANSWERS_INCOMPLETE',
      status: 409,
    })
  })
})

describe('dailyQuestStore (unit)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    resetDailyQuestState()
    vi.clearAllMocks()
    getTodayApi.mockRejectedValue(new ApiError('unavailable', 500))
    saveAnswerApi.mockRejectedValue(new ApiError('unavailable', 500))
    submitTodayApi.mockRejectedValue(new ApiError('unavailable', 500))
  })

  it('fetchToday 시 ASSIGNED면 INTRO와 questionTypeSummary를 노출한다', async () => {
    const store = useDailyQuestStore()
    await store.fetchToday()

    expect(store.isAssigned).toBe(true)
    expect(store.isIntro).toBe(true)
    expect(store.itemTotal).toBe(5)
    expect(store.questionTypeSummary.length).toBeGreaterThanOrEqual(2)
    expect(store.progressLabel).toBe('0/5')
  })

  it('openItem·saveAndReturnToHub로 허브에서 문항을 골라 저장한다', async () => {
    const store = useDailyQuestStore()
    await store.fetchToday()

    store.openItem(0)
    expect(store.isPlay).toBe(true)

    await store.saveAndReturnToHub('2')
    expect(store.answeredCount).toBe(1)
    expect(store.isInProgress).toBe(true)
    expect(store.isIntro).toBe(true)

    await store.fetchToday()
    expect(store.isIntro).toBe(true)
    expect(store.answeredCount).toBe(1)
  })

  it('5문항 저장 후 submitToday로 채점·보상을 확정한다', async () => {
    const store = useDailyQuestStore()
    await store.fetchToday()

    for (let i = 0; i < store.itemTotal; i += 1) {
      store.openItem(i)
      await store.saveAndReturnToHub('1')
    }

    expect(store.canSubmit).toBe(true)
    const result = await store.submitToday()

    expect(result?.status).toBe('COMPLETED')
    expect(store.isResult).toBe(true)
    expect(store.correctCount).toBeGreaterThanOrEqual(0)
    expect(store.rewardPoints).toBe(store.correctCount * 100)
    expect(store.resultRows).toHaveLength(5)

    const again = await store.submitToday()
    expect(again?.reward.pointTransactionId).toBe(result.reward.pointTransactionId)
  })

  it('clear 시 세션과 localStorage를 초기화한다', async () => {
    const store = useDailyQuestStore()
    await store.fetchToday()
    store.clear()

    expect(store.quest).toBeNull()
    expect(store.phase).toBe('INTRO')
    expect(localStorage.getItem(__STORAGE_KEY)).toBeNull()
  })
})
