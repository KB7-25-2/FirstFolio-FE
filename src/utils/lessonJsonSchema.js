/**
 * 소단원 강좌 JSON (lesson.json) 클라이언트 검증
 * — `.cursor/rules/JSON_SCHEMA.md` v1.0
 */

const SCHEMA_VERSION = '1.0'
const ROOT_KEYS = new Set(['schemaVersion', 'pages', 'subChapterQuiz'])
const PAGE_KEYS = new Set(['id', 'title', 'blocks'])
const BLOCK_TYPES = new Set(['text', 'conclusion', 'definition', 'learn_more'])

const TEXT_KEYS = new Set(['type', 'content'])
const CONCLUSION_KEYS = new Set(['type', 'formula', 'note'])
const DEFINITION_KEYS = new Set(['type', 'term', 'body'])
const LEARN_MORE_KEYS = new Set(['type', 'chipLabel', 'chipSubtitle', 'modal'])
const MODAL_KEYS = new Set(['title', 'body', 'example', 'footer'])
const QUIZ_KEYS = new Set(['questionIds'])

const isPlainObject = (value) => value != null && typeof value === 'object' && !Array.isArray(value)

const nonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const rejectUnknownKeys = (obj, allowed, path, errors) => {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      errors.push(`${path}: 허용되지 않은 필드 "${key}"`)
    }
  }
}

/**
 * @param {unknown} block
 * @param {string} path
 * @param {string[]} errors
 */
const validateBlock = (block, path, errors) => {
  if (!isPlainObject(block)) {
    errors.push(`${path}: 객체여야 합니다.`)
    return
  }
  const type = block.type
  if (!BLOCK_TYPES.has(type)) {
    errors.push(`${path}.type: 지원하지 않는 블록 타입 "${type}"`)
    return
  }

  if (type === 'text') {
    rejectUnknownKeys(block, TEXT_KEYS, path, errors)
    if (!nonEmptyString(block.content)) errors.push(`${path}.content: 필수 (공백 불가)`)
    return
  }

  if (type === 'conclusion') {
    rejectUnknownKeys(block, CONCLUSION_KEYS, path, errors)
    if (!nonEmptyString(block.formula)) errors.push(`${path}.formula: 필수 (공백 불가)`)
    if (block.note !== undefined && typeof block.note !== 'string') {
      errors.push(`${path}.note: 문자열이어야 합니다.`)
    }
    return
  }

  if (type === 'definition') {
    rejectUnknownKeys(block, DEFINITION_KEYS, path, errors)
    if (!nonEmptyString(block.term)) errors.push(`${path}.term: 필수 (공백 불가)`)
    if (!nonEmptyString(block.body)) errors.push(`${path}.body: 필수 (공백 불가)`)
    return
  }

  // learn_more
  rejectUnknownKeys(block, LEARN_MORE_KEYS, path, errors)
  if (block.chipLabel !== undefined && typeof block.chipLabel !== 'string') {
    errors.push(`${path}.chipLabel: 문자열이어야 합니다.`)
  }
  if (block.chipSubtitle !== undefined && typeof block.chipSubtitle !== 'string') {
    errors.push(`${path}.chipSubtitle: 문자열이어야 합니다.`)
  }
  if (!isPlainObject(block.modal)) {
    errors.push(`${path}.modal: 필수 객체`)
    return
  }
  rejectUnknownKeys(block.modal, MODAL_KEYS, `${path}.modal`, errors)
  if (!nonEmptyString(block.modal.title)) errors.push(`${path}.modal.title: 필수`)
  if (!nonEmptyString(block.modal.body)) errors.push(`${path}.modal.body: 필수`)
  if (block.modal.example !== undefined && typeof block.modal.example !== 'string') {
    errors.push(`${path}.modal.example: 문자열이어야 합니다.`)
  }
  if (block.modal.footer !== undefined && typeof block.modal.footer !== 'string') {
    errors.push(`${path}.modal.footer: 문자열이어야 합니다.`)
  }
}

/**
 * @param {unknown} lesson
 * @returns {{ ok: true, lesson: object } | { ok: false, errors: string[] }}
 */
export const validateLessonJson = (lesson) => {
  /** @type {string[]} */
  const errors = []

  if (!isPlainObject(lesson)) {
    return { ok: false, errors: ['루트는 JSON 객체여야 합니다.'] }
  }

  rejectUnknownKeys(lesson, ROOT_KEYS, 'root', errors)

  if (lesson.schemaVersion !== SCHEMA_VERSION) {
    errors.push(
      `schemaVersion: "${SCHEMA_VERSION}" 이어야 합니다. (현재: ${JSON.stringify(lesson.schemaVersion)})`,
    )
  }

  if (!Array.isArray(lesson.pages) || lesson.pages.length < 1) {
    errors.push('pages: 최소 1개의 페이지가 필요합니다.')
  } else {
    const pageIds = new Set()
    lesson.pages.forEach((page, index) => {
      const path = `pages[${index}]`
      if (!isPlainObject(page)) {
        errors.push(`${path}: 객체여야 합니다.`)
        return
      }
      rejectUnknownKeys(page, PAGE_KEYS, path, errors)
      if (!nonEmptyString(page.id)) {
        errors.push(`${path}.id: 필수 (공백 불가)`)
      } else if (pageIds.has(page.id)) {
        errors.push(`${path}.id: 중복된 페이지 id "${page.id}"`)
      } else {
        pageIds.add(page.id)
      }
      if (!nonEmptyString(page.title)) errors.push(`${path}.title: 필수 (공백 불가)`)
      if (!Array.isArray(page.blocks) || page.blocks.length < 1) {
        errors.push(`${path}.blocks: 최소 1개의 블록이 필요합니다.`)
      } else {
        page.blocks.forEach((block, blockIndex) => {
          validateBlock(block, `${path}.blocks[${blockIndex}]`, errors)
        })
      }
    })
  }

  if (!isPlainObject(lesson.subChapterQuiz)) {
    errors.push('subChapterQuiz: 필수 객체')
  } else {
    rejectUnknownKeys(lesson.subChapterQuiz, QUIZ_KEYS, 'subChapterQuiz', errors)
    const ids = lesson.subChapterQuiz.questionIds
    if (!Array.isArray(ids) || ids.length < 1) {
      errors.push('subChapterQuiz.questionIds: 최소 1개의 문항 ID가 필요합니다.')
    } else {
      const seen = new Set()
      ids.forEach((id, index) => {
        if (!Number.isInteger(id) || id <= 0) {
          errors.push(`subChapterQuiz.questionIds[${index}]: 양의 정수여야 합니다.`)
          return
        }
        if (seen.has(id)) {
          errors.push(`subChapterQuiz.questionIds[${index}]: 중복 ID ${id}`)
        } else {
          seen.add(id)
        }
      })
    }
  }

  if (errors.length) return { ok: false, errors }
  return { ok: true, lesson }
}

/**
 * 업로드 폼용 최소 예시 JSON
 * @returns {object}
 */
export const createLessonJsonTemplate = () => ({
  schemaVersion: SCHEMA_VERSION,
  pages: [
    {
      id: 'intro',
      title: '첫 페이지 제목',
      blocks: [
        {
          type: 'text',
          content: '학습 내용을 입력하세요.',
        },
      ],
    },
  ],
  subChapterQuiz: {
    questionIds: [1],
  },
})

export const LESSON_JSON_SCHEMA_VERSION = SCHEMA_VERSION
