<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  DIFFICULTY_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  STATUS_LABELS,
  USAGE_TYPE_OPTIONS,
  createQuizQuestion,
  createQuizQuestionVersion,
  defaultOptionsForType,
  fetchAdminQuizQuestions,
  formatAdminQuizError,
  publishQuizQuestion,
  submitQuizQuestionForReview,
} from '@/services/adminQuizService.js'
import { fetchAdminMainChapters, fetchAdminSubChapters } from '@/services/adminCurriculumService.js'

const route = useRoute()

const loading = ref(false)
const loadingMore = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const notice = ref('')
const questions = ref([])
const nextCursor = ref(null)
const mainChapters = ref([])
const subChapters = ref([])

const filterUsageType = ref('')
const filterStatus = ref('')
const filterMainId = ref('')
const filterSubId = ref('')
const filterQuestionKey = ref('')

const showForm = ref(false)
/** @type {import('vue').Ref<'create' | 'version'>} */
const formMode = ref('create')
/** @type {import('vue').Ref<import('@/types/quiz.js').QuizQuestion | null>} */
const versionBase = ref(null)
const form = ref(emptyForm())

const showPublishConfirm = ref(false)
/** @type {import('vue').Ref<import('@/types/quiz.js').QuizQuestion | null>} */
const publishTarget = ref(null)

function emptyForm() {
  return {
    questionKey: '',
    usageType: 'SUB_CHAPTER',
    mainChapterId: '',
    subChapterId: '',
    questionType: 'SINGLE_CHOICE',
    difficulty: '',
    prompt: '',
    explanation: '',
    options: defaultOptionsForType('SINGLE_CHOICE'),
    correctKey: '1',
    scenarioTitle: '',
    scenarioNarrative: '',
    scenarioPersonaName: '',
    scenarioConstraints: '',
  }
}

const flash = (message) => {
  notice.value = message
  window.setTimeout(() => {
    if (notice.value === message) notice.value = ''
  }, 2800)
}

const setError = (error) => {
  errorMessage.value = formatAdminQuizError(error)
}

const loadMains = async () => {
  try {
    mainChapters.value = await fetchAdminMainChapters({ isActive: true })
  } catch {
    mainChapters.value = []
  }
}

const loadSubs = async (mainChapterId) => {
  if (!mainChapterId) {
    subChapters.value = []
    return
  }
  try {
    subChapters.value = await fetchAdminSubChapters(Number(mainChapterId))
  } catch {
    subChapters.value = []
  }
}

const buildListFilters = (cursor = null) => ({
  usageType: filterUsageType.value || undefined,
  status: filterStatus.value || undefined,
  mainChapterId: filterMainId.value ? Number(filterMainId.value) : null,
  subChapterId: filterSubId.value ? Number(filterSubId.value) : null,
  questionKey: filterQuestionKey.value.trim() || undefined,
  cursor: cursor || undefined,
})

const loadQuestions = async () => {
  loading.value = true
  errorMessage.value = ''
  nextCursor.value = null
  try {
    const result = await fetchAdminQuizQuestions(buildListFilters())
    questions.value = result.items
    nextCursor.value = result.nextCursor
  } catch (error) {
    setError(error)
    questions.value = []
    nextCursor.value = null
  } finally {
    loading.value = false
  }
}

const loadMoreQuestions = async () => {
  if (!nextCursor.value || loadingMore.value) return
  loadingMore.value = true
  errorMessage.value = ''
  try {
    const result = await fetchAdminQuizQuestions(buildListFilters(nextCursor.value))
    const seen = new Set(questions.value.map((q) => q.questionId))
    questions.value = [...questions.value, ...result.items.filter((q) => !seen.has(q.questionId))]
    nextCursor.value = result.nextCursor
  } catch (error) {
    setError(error)
  } finally {
    loadingMore.value = false
  }
}

const openCreate = () => {
  formMode.value = 'create'
  versionBase.value = null
  form.value = emptyForm()
  if (filterMainId.value) form.value.mainChapterId = String(filterMainId.value)
  if (filterSubId.value) form.value.subChapterId = String(filterSubId.value)
  if (filterUsageType.value) form.value.usageType = filterUsageType.value
  showForm.value = true
  errorMessage.value = ''
}

const openVersion = (question) => {
  formMode.value = 'version'
  versionBase.value = question
  form.value = {
    questionKey: question.questionKey,
    usageType: question.usageType,
    mainChapterId: question.mainChapterId != null ? String(question.mainChapterId) : '',
    subChapterId: question.subChapterId != null ? String(question.subChapterId) : '',
    questionType: question.questionType,
    difficulty: question.difficulty ?? '',
    prompt: question.prompt,
    explanation: question.explanation,
    options: (question.optionsJson?.length
      ? question.optionsJson
      : defaultOptionsForType(question.questionType)
    ).map((o) => ({
      key: o.key,
      label: o.label,
      description: o.description ?? null,
    })),
    correctKey: question.correctAnswerJson?.key ?? question.optionsJson?.[0]?.key ?? '1',
    scenarioTitle: question.scenarioJson?.title ?? '',
    scenarioNarrative: question.scenarioJson?.narrative ?? '',
    scenarioPersonaName: question.scenarioJson?.persona?.name ?? '',
    scenarioConstraints: (question.scenarioJson?.constraints ?? []).join('\n'),
  }
  showForm.value = true
  errorMessage.value = ''
}

const closeForm = () => {
  showForm.value = false
  versionBase.value = null
}

watch(
  () => form.value.questionType,
  (type, prev) => {
    if (type === prev) return
    form.value.options = defaultOptionsForType(type)
    form.value.correctKey = form.value.options[0]?.key ?? ''
  },
)

watch(
  () => form.value.mainChapterId,
  (id) => {
    loadSubs(id)
    if (formMode.value === 'create') form.value.subChapterId = ''
  },
)

watch(
  () => form.value.usageType,
  (usage) => {
    if (usage === 'DAILY_GENERAL' || usage === 'DAILY_NEWS') {
      form.value.mainChapterId = ''
      form.value.subChapterId = ''
    }
    if (usage === 'LEVEL_TEST' || usage === 'MAIN_CHAPTER') {
      form.value.subChapterId = ''
    }
  },
)

const addOption = () => {
  const next = String(form.value.options.length + 1)
  form.value.options.push({ key: next, label: '', description: null })
}

const removeOption = (index) => {
  if (form.value.options.length <= 2) return
  const removed = form.value.options.splice(index, 1)[0]
  if (form.value.correctKey === removed.key) {
    form.value.correctKey = form.value.options[0]?.key ?? ''
  }
}

const buildScenarioJson = () => {
  if (form.value.questionType !== 'SCENARIO') return null
  const constraints = form.value.scenarioConstraints
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  return {
    title: form.value.scenarioTitle.trim() || undefined,
    narrative: form.value.scenarioNarrative.trim() || undefined,
    persona: form.value.scenarioPersonaName.trim()
      ? { name: form.value.scenarioPersonaName.trim() }
      : undefined,
    constraints: constraints.length ? constraints : undefined,
  }
}

const buildPayloadCore = () => ({
  prompt: form.value.prompt,
  explanation: form.value.explanation,
  optionsJson: form.value.options.map((o) => ({
    key: String(o.key).trim(),
    label: String(o.label).trim(),
    description: o.description ?? null,
  })),
  correctAnswerJson: { key: String(form.value.correctKey) },
  scenarioJson: buildScenarioJson(),
  questionType: form.value.questionType,
})

const submitForm = async () => {
  saving.value = true
  errorMessage.value = ''
  try {
    if (formMode.value === 'version' && versionBase.value) {
      const created = await createQuizQuestionVersion(
        versionBase.value.questionId,
        buildPayloadCore(),
      )
      flash(`새 버전 등록 #${created.questionId} (v${created.versionNo})`)
    } else {
      const created = await createQuizQuestion({
        questionKey: form.value.questionKey,
        usageType: form.value.usageType,
        mainChapterId: form.value.mainChapterId ? Number(form.value.mainChapterId) : null,
        subChapterId: form.value.subChapterId ? Number(form.value.subChapterId) : null,
        questionType: form.value.questionType,
        difficulty: form.value.difficulty || null,
        ...buildPayloadCore(),
        generationType: 'HUMAN',
      })
      flash(`DRAFT 등록 #${created.questionId}`)
    }
    closeForm()
    await loadQuestions()
  } catch (error) {
    setError(error)
  } finally {
    saving.value = false
  }
}

const sendToReview = async (question) => {
  saving.value = true
  errorMessage.value = ''
  try {
    await submitQuizQuestionForReview(question.questionId)
    flash(`#${question.questionId} → 검수`)
    await loadQuestions()
  } catch (error) {
    setError(error)
  } finally {
    saving.value = false
  }
}

const openPublish = (question) => {
  publishTarget.value = question
  showPublishConfirm.value = true
}

const closePublish = () => {
  showPublishConfirm.value = false
  publishTarget.value = null
}

const confirmPublish = async () => {
  if (!publishTarget.value) return
  saving.value = true
  errorMessage.value = ''
  try {
    const published = await publishQuizQuestion(publishTarget.value.questionId)
    closePublish()
    flash(`#${published.questionId} PUBLISHED — 소단원 JSON questionIds에 사용 가능`)
    await loadQuestions()
  } catch (error) {
    setError(error)
  } finally {
    saving.value = false
  }
}

const copyQuestionId = async (questionId) => {
  try {
    await navigator.clipboard.writeText(String(questionId))
    flash(`questionId ${questionId} 복사됨`)
  } catch {
    flash(String(questionId))
  }
}

const needsMain = computed(
  () =>
    form.value.usageType === 'SUB_CHAPTER' ||
    form.value.usageType === 'LEVEL_TEST' ||
    form.value.usageType === 'MAIN_CHAPTER',
)
const needsSub = computed(() => form.value.usageType === 'SUB_CHAPTER')

watch([filterUsageType, filterStatus, filterMainId, filterSubId], () => {
  if (filterMainId.value) loadSubs(filterMainId.value)
  else subChapters.value = []
  loadQuestions()
})

let questionKeyTimer = 0
watch(filterQuestionKey, () => {
  window.clearTimeout(questionKeyTimer)
  questionKeyTimer = window.setTimeout(() => {
    loadQuestions()
  }, 300)
})

onMounted(async () => {
  await loadMains()
  if (route.query.subChapterId) {
    filterSubId.value = String(route.query.subChapterId)
    filterUsageType.value = 'SUB_CHAPTER'
  }
  if (route.query.mainChapterId) {
    filterMainId.value = String(route.query.mainChapterId)
    await loadSubs(filterMainId.value)
  }
  if (route.query.status) filterStatus.value = String(route.query.status)
  if (route.query.questionKey) filterQuestionKey.value = String(route.query.questionKey)
  await loadQuestions()
})
</script>

<template>
  <div class="admin-page admin-page--wide">
    <div class="admin-page__header">
      <div>
        <p class="admin-page__kicker">Quiz Questions</p>
        <h2 class="admin-page__title">퀴즈 문항</h2>
        <p class="admin-page__desc">
          DRAFT → 검수 → PUBLISHED. 강좌 JSON에는 게시된 questionId만 연결합니다.
        </p>
      </div>
      <button
        type="button"
        class="admin-btn admin-btn--primary"
        :disabled="saving"
        @click="openCreate"
      >
        문항 등록
      </button>
    </div>

    <p v-if="notice" class="admin-alert admin-alert--ok" role="status">{{ notice }}</p>
    <pre v-if="errorMessage" class="admin-alert admin-alert--error" role="alert">{{
      errorMessage
    }}</pre>

    <section class="admin-card">
      <div class="admin-filters">
        <label class="admin-field">
          <span>usage_type</span>
          <select v-model="filterUsageType" class="admin-input">
            <option value="">전체</option>
            <option v-for="opt in USAGE_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
        <label class="admin-field">
          <span>status</span>
          <select v-model="filterStatus" class="admin-input">
            <option value="">전체</option>
            <option value="DRAFT">초안</option>
            <option value="REVIEW">검수</option>
            <option value="PUBLISHED">게시됨</option>
            <option value="RETIRED">폐기</option>
          </select>
        </label>
        <label class="admin-field">
          <span>대단원</span>
          <select v-model="filterMainId" class="admin-input">
            <option value="">전체</option>
            <option
              v-for="chapter in mainChapters"
              :key="chapter.mainChapterId"
              :value="String(chapter.mainChapterId)"
            >
              {{ chapter.title }} (#{{ chapter.mainChapterId }})
            </option>
          </select>
        </label>
        <label class="admin-field">
          <span>소단원</span>
          <select v-model="filterSubId" class="admin-input" :disabled="!filterMainId">
            <option value="">전체</option>
            <option
              v-for="chapter in subChapters"
              :key="chapter.subChapterId"
              :value="String(chapter.subChapterId)"
            >
              {{ chapter.title }} (#{{ chapter.subChapterId }})
            </option>
          </select>
        </label>
        <label class="admin-field admin-filters__key">
          <span>question_key</span>
          <input
            v-model="filterQuestionKey"
            class="admin-input"
            type="search"
            placeholder="논리 키 검색"
          />
        </label>
      </div>
    </section>

    <section class="admin-card admin-card--flush">
      <p v-if="loading" class="admin-empty">불러오는 중…</p>
      <p v-else-if="!questions.length" class="admin-empty">
        조건에 맞는 문항이 없습니다. 필터를 바꾸거나 문항을 등록해 보세요.
      </p>
      <div v-else class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>문항</th>
              <th>유형</th>
              <th>범위</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="q in questions" :key="q.questionId">
              <td class="admin-mono">
                <button type="button" class="admin-linkish" @click="copyQuestionId(q.questionId)">
                  #{{ q.questionId }}
                </button>
                <div class="admin-cell-sub">v{{ q.versionNo }}</div>
              </td>
              <td>
                <div class="admin-cell-title">{{ q.prompt }}</div>
                <div class="admin-cell-sub">{{ q.questionKey }}</div>
              </td>
              <td>
                <span class="admin-badge">{{ q.questionType }}</span>
              </td>
              <td class="admin-cell-sub">
                {{ q.usageType }}
                <template v-if="q.subChapterId != null"> · sub #{{ q.subChapterId }}</template>
                <template v-else-if="q.mainChapterId != null">
                  · main #{{ q.mainChapterId }}
                </template>
              </td>
              <td>
                <span
                  class="admin-badge"
                  :class="{
                    'admin-badge--ok': q.status === 'PUBLISHED',
                    'admin-badge--muted': q.status === 'RETIRED',
                    'admin-badge--accent': q.status === 'REVIEW',
                  }"
                >
                  {{ STATUS_LABELS[q.status] || q.status }}
                </span>
              </td>
              <td class="admin-table__actions">
                <button
                  v-if="q.status === 'DRAFT'"
                  type="button"
                  class="admin-btn admin-btn--ghost"
                  :disabled="saving"
                  @click="sendToReview(q)"
                >
                  검수
                </button>
                <button
                  v-if="q.status === 'DRAFT' || q.status === 'REVIEW'"
                  type="button"
                  class="admin-btn admin-btn--primary"
                  :disabled="saving"
                  @click="openPublish(q)"
                >
                  게시
                </button>
                <button
                  type="button"
                  class="admin-btn admin-btn--ghost"
                  :disabled="saving"
                  @click="openVersion(q)"
                >
                  새 버전
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="nextCursor" class="admin-load-more">
          <button
            type="button"
            class="admin-btn"
            :disabled="loadingMore"
            @click="loadMoreQuestions"
          >
            {{ loadingMore ? '불러오는 중…' : '더 보기' }}
          </button>
        </div>
      </div>
    </section>

    <div
      v-if="showForm"
      class="admin-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-form-title"
    >
      <button type="button" class="admin-modal__backdrop" aria-label="닫기" @click="closeForm" />
      <div class="admin-modal__panel admin-modal__panel--wide">
        <h3 id="quiz-form-title" class="admin-modal__title">
          {{ formMode === 'version' ? '문항 새 버전' : '문항 DRAFT 등록' }}
        </h3>
        <form class="admin-form" @submit.prevent="submitForm">
          <div class="admin-cv__grid">
            <div class="admin-form">
              <label v-if="formMode === 'create'" class="admin-field">
                <span>question_key</span>
                <input
                  v-model="form.questionKey"
                  class="admin-input"
                  type="text"
                  required
                  placeholder="deposit-basic-001"
                />
              </label>
              <label class="admin-field">
                <span>usage_type</span>
                <select
                  v-model="form.usageType"
                  class="admin-input"
                  :disabled="formMode === 'version'"
                >
                  <option v-for="opt in USAGE_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </label>
              <label v-if="needsMain" class="admin-field">
                <span>main_chapter_id</span>
                <select
                  v-model="form.mainChapterId"
                  class="admin-input"
                  :disabled="formMode === 'version'"
                  :required="needsMain"
                >
                  <option value="">선택</option>
                  <option
                    v-for="chapter in mainChapters"
                    :key="chapter.mainChapterId"
                    :value="String(chapter.mainChapterId)"
                  >
                    {{ chapter.title }}
                  </option>
                </select>
              </label>
              <label v-if="needsSub" class="admin-field">
                <span>sub_chapter_id</span>
                <select
                  v-model="form.subChapterId"
                  class="admin-input"
                  :disabled="formMode === 'version' || !form.mainChapterId"
                  :required="needsSub"
                >
                  <option value="">선택</option>
                  <option
                    v-for="chapter in subChapters"
                    :key="chapter.subChapterId"
                    :value="String(chapter.subChapterId)"
                  >
                    {{ chapter.title }}
                  </option>
                </select>
              </label>
              <label class="admin-field">
                <span>question_type</span>
                <select
                  v-model="form.questionType"
                  class="admin-input"
                  :disabled="formMode === 'version'"
                >
                  <option v-for="opt in QUESTION_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </label>
              <label class="admin-field">
                <span>difficulty</span>
                <select
                  v-model="form.difficulty"
                  class="admin-input"
                  :disabled="formMode === 'version'"
                >
                  <option v-for="opt in DIFFICULTY_OPTIONS" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </label>
            </div>

            <div class="admin-form">
              <label class="admin-field">
                <span>prompt</span>
                <textarea
                  v-model="form.prompt"
                  class="admin-input admin-input--area"
                  rows="3"
                  required
                />
              </label>
              <label class="admin-field">
                <span>explanation</span>
                <textarea
                  v-model="form.explanation"
                  class="admin-input admin-input--area"
                  rows="2"
                  required
                />
              </label>

              <template v-if="form.questionType === 'SCENARIO'">
                <p class="admin-toolbar__hint">SCENARIO — prompt와 scenario_json 분리</p>
                <label class="admin-field">
                  <span>scenario.title</span>
                  <input v-model="form.scenarioTitle" class="admin-input" type="text" />
                </label>
                <label class="admin-field">
                  <span>scenario.narrative</span>
                  <textarea
                    v-model="form.scenarioNarrative"
                    class="admin-input admin-input--area"
                    rows="3"
                    required
                  />
                </label>
                <label class="admin-field">
                  <span>scenario.persona.name</span>
                  <input v-model="form.scenarioPersonaName" class="admin-input" type="text" />
                </label>
                <label class="admin-field">
                  <span>scenario.constraints (줄바꿈 구분)</span>
                  <textarea
                    v-model="form.scenarioConstraints"
                    class="admin-input admin-input--area"
                    rows="2"
                  />
                </label>
              </template>
            </div>
          </div>

          <div class="admin-field">
            <span>options_json</span>
            <div class="admin-option-list">
              <div v-for="(opt, index) in form.options" :key="index" class="admin-option-row">
                <input v-model="opt.key" class="admin-input admin-input--sm" type="text" required />
                <input
                  v-model="opt.label"
                  class="admin-input"
                  type="text"
                  required
                  placeholder="선택지 문구"
                />
                <label class="admin-field--check">
                  <input v-model="form.correctKey" type="radio" :value="opt.key" />
                  정답
                </label>
                <button
                  type="button"
                  class="admin-btn admin-btn--ghost"
                  :disabled="form.options.length <= 2"
                  @click="removeOption(index)"
                >
                  삭제
                </button>
              </div>
            </div>
            <button
              v-if="form.questionType !== 'TRUE_FALSE'"
              type="button"
              class="admin-btn admin-btn--ghost"
              @click="addOption"
            >
              선택지 추가
            </button>
          </div>

          <div class="admin-form__actions">
            <button type="button" class="admin-btn" :disabled="saving" @click="closeForm">
              취소
            </button>
            <button type="submit" class="admin-btn admin-btn--primary" :disabled="saving">
              {{ saving ? '저장 중…' : formMode === 'version' ? '버전 등록' : 'DRAFT 저장' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="showPublishConfirm && publishTarget"
      class="admin-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-publish-title"
    >
      <button type="button" class="admin-modal__backdrop" aria-label="닫기" @click="closePublish" />
      <div class="admin-modal__panel admin-modal__panel--sm">
        <h3 id="quiz-publish-title" class="admin-modal__title">문항 게시 확인</h3>
        <p class="admin-toolbar__hint">
          #{{ publishTarget.questionId }} 를 PUBLISHED로 올립니다. 이후 소단원 강좌 JSON의
          <code>subChapterQuiz.questionIds</code>에 넣을 수 있습니다.
        </p>
        <div class="admin-form__actions">
          <button type="button" class="admin-btn" :disabled="saving" @click="closePublish">
            취소
          </button>
          <button
            type="button"
            class="admin-btn admin-btn--primary"
            :disabled="saving"
            @click="confirmPublish"
          >
            {{ saving ? '게시 중…' : '게시' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-filters {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.admin-filters__key {
  grid-column: 1 / -1;
}

@media (max-width: 900px) {
  .admin-filters {
    grid-template-columns: 1fr 1fr;
  }
}

.admin-load-more {
  display: flex;
  justify-content: center;
  padding: 16px;
}

.admin-option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.admin-option-row {
  display: grid;
  grid-template-columns: 72px 1fr auto auto;
  gap: 8px;
  align-items: center;
}

.admin-input--sm {
  width: 72px;
}

.admin-linkish {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--admin-accent);
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
}
</style>
