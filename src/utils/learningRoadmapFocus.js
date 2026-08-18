/**
 * 학습 로드맵 UI 포커스 — 탭 전환·리마운트 후에도 유지
 */

/** @type {number | null} */
let persistedMainChapterId = null

/** @type {number} */
let persistedFocusStageIndex = 0

/** @type {number} */
let persistedListScrollTop = 0

/** 세션 중 최초 1회만 '이어하기' 위치로 자동 스크롤 */
let didInitialAutoFocus = false

export const getPersistedMainChapterId = () => persistedMainChapterId

export const setPersistedMainChapterId = (id) => {
  if (id == null || !Number.isFinite(Number(id))) return
  persistedMainChapterId = Number(id)
}

export const getPersistedFocusStageIndex = () => persistedFocusStageIndex

export const setPersistedFocusStageIndex = (index) => {
  if (!Number.isFinite(index) || index < 0) return
  persistedFocusStageIndex = index
}

export const getPersistedListScrollTop = () => persistedListScrollTop

export const setPersistedListScrollTop = (top) => {
  persistedListScrollTop = Math.max(0, Number(top) || 0)
}

export const getDidInitialAutoFocus = () => didInitialAutoFocus

export const markInitialAutoFocusDone = () => {
  didInitialAutoFocus = true
}

/** 포커스 대단원 인덱스 + id 를 함께 저장 */
export const persistRoadmapFocus = (stageIndex, mainChapterId) => {
  setPersistedFocusStageIndex(stageIndex)
  setPersistedMainChapterId(mainChapterId)
}

/** 네비 탭 → 학습 진입 시 쿼리 복원용 */
export const getLearningNavLocation = () => {
  if (persistedMainChapterId == null) return { name: 'learning' }
  return {
    name: 'learning',
    query: { mainChapterId: String(persistedMainChapterId) },
  }
}
