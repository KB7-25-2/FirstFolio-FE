<script setup>
import { computed, ref, watch } from 'vue'
import {
  CONTENT_VERSION_STATUS_LABELS,
  fetchContentVersions,
  formatAdminContentVersionError,
  publishContentVersion,
  suggestNextVersionNo,
  uploadContentVersion,
} from '@/services/adminContentVersionService.js'
import { createLessonJsonTemplate, validateLessonJson } from '@/utils/lessonJsonSchema.js'

const props = defineProps({
  /** @type {import('vue').PropType<{ subChapterId: number, title: string, currentContentVersionId?: number | null } | null>} */
  subChapter: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'published'])

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const notice = ref('')
const versions = ref([])

const versionNo = ref(1)
const jsonText = ref(JSON.stringify(createLessonJsonTemplate(), null, 2))
const clientErrors = ref([])

const showPublishConfirm = ref(false)
/** @type {import('vue').Ref<import('@/services/adminContentVersionService.js').AdminContentVersion | null>} */
const publishTarget = ref(null)

const currentVersion = computed(() => versions.value.find((v) => v.current) ?? null)

const flash = (message) => {
  notice.value = message
  window.setTimeout(() => {
    if (notice.value === message) notice.value = ''
  }, 2800)
}

const loadVersions = async () => {
  if (!props.subChapter?.subChapterId) {
    versions.value = []
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    versions.value = await fetchContentVersions(props.subChapter.subChapterId)
    versionNo.value = suggestNextVersionNo(versions.value)
  } catch (error) {
    errorMessage.value = formatAdminContentVersionError(error)
    versions.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.subChapter?.subChapterId,
  () => {
    clientErrors.value = []
    errorMessage.value = ''
    notice.value = ''
    jsonText.value = JSON.stringify(createLessonJsonTemplate(), null, 2)
    loadVersions()
  },
  { immediate: true },
)

const runClientValidate = () => {
  clientErrors.value = []
  let parsed
  try {
    parsed = JSON.parse(jsonText.value)
  } catch {
    clientErrors.value = ['JSON 파싱 실패: 문법을 확인해 주세요.']
    return null
  }
  const result = validateLessonJson(parsed)
  if (!result.ok) {
    clientErrors.value = result.errors
    return null
  }
  return result.lesson
}

const handleValidateOnly = () => {
  errorMessage.value = ''
  const lesson = runClientValidate()
  if (lesson) {
    clientErrors.value = []
    flash('스키마 검증 통과')
  }
}

const handleFileChange = async (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  try {
    const text = await file.text()
    JSON.parse(text)
    jsonText.value = text
    clientErrors.value = []
    flash(`${file.name} 불러옴`)
  } catch {
    errorMessage.value = 'JSON 파일을 읽지 못했습니다.'
  }
}

const handleUpload = async () => {
  if (!props.subChapter?.subChapterId) return
  errorMessage.value = ''
  const lesson = runClientValidate()
  if (!lesson) return

  saving.value = true
  try {
    const created = await uploadContentVersion(props.subChapter.subChapterId, {
      versionNo: Number(versionNo.value),
      lesson,
    })
    flash(`버전 v${created.versionNo} 업로드됨 (#${created.contentVersionId})`)
    await loadVersions()
  } catch (error) {
    errorMessage.value = formatAdminContentVersionError(error)
  } finally {
    saving.value = false
  }
}

const openPublishConfirm = (version) => {
  publishTarget.value = version
  showPublishConfirm.value = true
  errorMessage.value = ''
}

const closePublishConfirm = () => {
  showPublishConfirm.value = false
  publishTarget.value = null
}

const confirmPublish = async () => {
  if (!publishTarget.value) return
  saving.value = true
  errorMessage.value = ''
  try {
    const result = await publishContentVersion(publishTarget.value.contentVersionId)
    closePublishConfirm()
    flash(`버전 #${result.contentVersionId} 게시 완료`)
    await loadVersions()
    emit('published', {
      subChapterId: props.subChapter.subChapterId,
      contentVersionId: result.contentVersionId,
    })
  } catch (error) {
    errorMessage.value = formatAdminContentVersionError(error)
  } finally {
    saving.value = false
  }
}

const statusLabel = (status) => CONTENT_VERSION_STATUS_LABELS[status] || status

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('ko-KR')
}

const canPublish = (version) => version.status === 'DRAFT' || version.status === 'REVIEW'
</script>

<template>
  <div
    v-if="subChapter"
    class="admin-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="content-version-title"
  >
    <button type="button" class="admin-modal__backdrop" aria-label="닫기" @click="emit('close')" />
    <div class="admin-modal__panel admin-modal__panel--wide">
      <div class="admin-cv__header">
        <div>
          <h3 id="content-version-title" class="admin-modal__title">강좌 JSON 버전</h3>
          <p class="admin-toolbar__hint">{{ subChapter.title }} · #{{ subChapter.subChapterId }}</p>
        </div>
        <button type="button" class="admin-btn" @click="emit('close')">닫기</button>
      </div>

      <p v-if="notice" class="admin-alert admin-alert--ok" role="status">{{ notice }}</p>
      <pre v-if="errorMessage" class="admin-alert admin-alert--error" role="alert">{{
        errorMessage
      }}</pre>

      <section class="admin-cv__current">
        <span class="admin-cv__label">현재 게시본</span>
        <template v-if="currentVersion">
          <span class="admin-badge admin-badge--ok">v{{ currentVersion.versionNo }}</span>
          <span class="admin-mono">#{{ currentVersion.contentVersionId }}</span>
          <span class="admin-cell-sub">스키마 {{ currentVersion.schemaVersion }}</span>
        </template>
        <span v-else class="admin-cell-sub">게시된 버전 없음</span>
      </section>

      <div class="admin-cv__grid">
        <section class="admin-cv__list">
          <div class="admin-toolbar">
            <h4 class="admin-card__title">버전 이력</h4>
            <button
              type="button"
              class="admin-btn admin-btn--ghost"
              :disabled="loading || saving"
              @click="loadVersions"
            >
              새로고침
            </button>
          </div>
          <p v-if="loading" class="admin-empty">불러오는 중…</p>
          <p v-else-if="!versions.length" class="admin-empty">등록된 버전이 없습니다.</p>
          <div v-else class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>버전</th>
                  <th>상태</th>
                  <th>생성</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="version in versions" :key="version.contentVersionId">
                  <td>
                    <div class="admin-cell-title">
                      v{{ version.versionNo }}
                      <span v-if="version.current" class="admin-badge admin-badge--accent"
                        >CURRENT</span
                      >
                    </div>
                    <div class="admin-cell-sub admin-mono">#{{ version.contentVersionId }}</div>
                  </td>
                  <td>
                    <span
                      class="admin-badge"
                      :class="{
                        'admin-badge--ok': version.status === 'PUBLISHED',
                        'admin-badge--muted': version.status === 'RETIRED',
                      }"
                    >
                      {{ statusLabel(version.status) }}
                    </span>
                  </td>
                  <td class="admin-cell-sub">{{ formatDateTime(version.createdAt) }}</td>
                  <td class="admin-table__actions">
                    <button
                      v-if="canPublish(version)"
                      type="button"
                      class="admin-btn admin-btn--primary"
                      :disabled="saving"
                      @click="openPublishConfirm(version)"
                    >
                      게시
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="admin-cv__upload">
          <h4 class="admin-card__title">새 버전 업로드</h4>
          <p class="admin-toolbar__hint">
            schemaVersion 1.0 · pages / subChapterQuiz.questionIds 검증 후 업로드
          </p>

          <label class="admin-field">
            <span>versionNo</span>
            <input v-model.number="versionNo" class="admin-input" type="number" min="1" required />
          </label>

          <label class="admin-field">
            <span>JSON 파일</span>
            <div class="admin-input-file-wrap">
              <input type="file" class="admin-input-file" @change="handleFileChange" />
              <span class="admin-input-file-name">
                {{ fileName }}
              </span>
            </div>
          </label>

          <label class="admin-field">
            <span>lesson JSON</span>
            <textarea
              v-model="jsonText"
              class="admin-input admin-input--area admin-input--code"
              rows="16"
              spellcheck="false"
            />
          </label>

          <ul v-if="clientErrors.length" class="admin-cv__errors" role="alert">
            <li v-for="(err, index) in clientErrors" :key="index">{{ err }}</li>
          </ul>

          <div class="admin-form__actions">
            <button type="button" class="admin-btn" :disabled="saving" @click="handleValidateOnly">
              스키마 검증
            </button>
            <button
              type="button"
              class="admin-btn admin-btn--primary"
              :disabled="saving || loading"
              @click="handleUpload"
            >
              {{ saving ? '업로드 중…' : '업로드' }}
            </button>
          </div>
        </section>
      </div>
    </div>

    <div
      v-if="showPublishConfirm && publishTarget"
      class="admin-modal admin-modal--nested"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-confirm-title"
    >
      <button
        type="button"
        class="admin-modal__backdrop"
        aria-label="닫기"
        @click="closePublishConfirm"
      />
      <div class="admin-modal__panel admin-modal__panel--sm">
        <h3 id="publish-confirm-title" class="admin-modal__title">버전 게시 확인</h3>
        <p class="admin-toolbar__hint">
          v{{ publishTarget.versionNo }} (#{{ publishTarget.contentVersionId }}) 를 현재 공개
          버전으로 게시합니다. 참조 questionId가 없거나 PUBLISHED/SUB_CHAPTER가 아니면 실패합니다.
        </p>
        <div class="admin-form__actions">
          <button type="button" class="admin-btn" :disabled="saving" @click="closePublishConfirm">
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
