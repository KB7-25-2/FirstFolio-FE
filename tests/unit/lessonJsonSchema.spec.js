import { describe, expect, it } from 'vitest'
import { createLessonJsonTemplate, validateLessonJson } from '@/utils/lessonJsonSchema.js'

describe('validateLessonJson', () => {
  it('템플릿 JSON을 통과한다', () => {
    const result = validateLessonJson(createLessonJsonTemplate())
    expect(result.ok).toBe(true)
  })

  it('schemaVersion이 다르면 실패한다', () => {
    const lesson = createLessonJsonTemplate()
    lesson.schemaVersion = '2.0'
    const result = validateLessonJson(lesson)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('schemaVersion'))).toBe(true)
  })

  it('정의되지 않은 루트 필드를 거부한다', () => {
    const lesson = { ...createLessonJsonTemplate(), subChapterId: 1 }
    const result = validateLessonJson(lesson)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('subChapterId'))).toBe(true)
  })

  it('페이지 id 중복을 거부한다', () => {
    const lesson = createLessonJsonTemplate()
    lesson.pages.push({
      id: 'intro',
      title: '두번째',
      blocks: [{ type: 'text', content: '본문' }],
    })
    const result = validateLessonJson(lesson)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('중복'))).toBe(true)
  })

  it('questionIds 중복·비정수를 거부한다', () => {
    const lesson = createLessonJsonTemplate()
    lesson.subChapterQuiz.questionIds = [1, 1, 0]
    const result = validateLessonJson(lesson)
    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })

  it('learn_more 필수 modal 필드를 검사한다', () => {
    const lesson = createLessonJsonTemplate()
    lesson.pages[0].blocks = [
      {
        type: 'learn_more',
        modal: { title: '제목' },
      },
    ]
    const result = validateLessonJson(lesson)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('modal.body'))).toBe(true)
  })
})
