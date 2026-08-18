<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AdminContentVersionPanel from '@/components/admin/AdminContentVersionPanel.vue'
import {
  ASSET_TYPE_OPTIONS,
  CHAPTER_TYPE_LABELS,
  assetTypeLabel,
  createMainChapter,
  createSubChapter,
  fetchAdminMainChapters,
  fetchAdminSubChapters,
  formatAdminCurriculumError,
  updateMainChapter,
  updateSubChapter,
} from '@/services/adminCurriculumService.js'

const loadingMains = ref(false)
const loadingSubs = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const notice = ref('')

const chapterTypeFilter = ref('')
const activeFilter = ref('all')
const mainChapters = ref([])
const selectedMainId = ref(null)
const subChapters = ref([])

const showMainForm = ref(false)
const editingMainId = ref(null)
const mainForm = ref(emptyMainForm())

const showSubForm = ref(false)
const editingSubId = ref(null)
const subForm = ref(emptySubForm())

/** @type {import('vue').Ref<import('@/services/adminCurriculumService.js').AdminSubChapter | null>} */
const contentVersionTarget = ref(null)

const selectedMain = computed(
  () => mainChapters.value.find((c) => c.mainChapterId === selectedMainId.value) ?? null,
)

function emptyMainForm() {
  return {
    chapterType: 'ASSET',
    assetType: 'DEPOSIT_SAVINGS',
    title: '',
    description: '',
    displayOrder: 1,
    isRequired: false,
    isActive: true,
  }
}

function emptySubForm() {
  return {
    title: '',
    description: '',
    displayOrder: 1,
    isActive: true,
  }
}

const flash = (message) => {
  notice.value = message
  window.setTimeout(() => {
    if (notice.value === message) notice.value = ''
  }, 2800)
}

const setError = (error) => {
  errorMessage.value = formatAdminCurriculumError(error)
}

const loadMainChapters = async () => {
  loadingMains.value = true
  errorMessage.value = ''
  try {
    const filters = {}
    if (chapterTypeFilter.value) filters.chapterType = chapterTypeFilter.value
    if (activeFilter.value === 'active') filters.isActive = true
    if (activeFilter.value === 'inactive') filters.isActive = false
    mainChapters.value = await fetchAdminMainChapters(filters)
    if (
      selectedMainId.value != null &&
      !mainChapters.value.some((c) => c.mainChapterId === selectedMainId.value)
    ) {
      selectedMainId.value = null
      subChapters.value = []
    }
  } catch (error) {
    setError(error)
  } finally {
    loadingMains.value = false
  }
}

const loadSubChapters = async (mainChapterId) => {
  if (mainChapterId == null) {
    subChapters.value = []
    return
  }
  loadingSubs.value = true
  errorMessage.value = ''
  try {
    subChapters.value = await fetchAdminSubChapters(mainChapterId)
  } catch (error) {
    setError(error)
    subChapters.value = []
  } finally {
    loadingSubs.value = false
  }
}

const selectMain = (chapter) => {
  selectedMainId.value = chapter.mainChapterId
  showSubForm.value = false
  editingSubId.value = null
}

const openCreateMain = () => {
  editingMainId.value = null
  const nextOrder = mainChapters.value.reduce((max, c) => Math.max(max, c.displayOrder), 0) + 1
  mainForm.value = { ...emptyMainForm(), displayOrder: nextOrder || 1 }
  showMainForm.value = true
}

const openEditMain = (chapter) => {
  editingMainId.value = chapter.mainChapterId
  mainForm.value = {
    chapterType: chapter.chapterType,
    assetType: chapter.assetType || 'DEPOSIT_SAVINGS',
    title: chapter.title,
    description: chapter.description || '',
    displayOrder: chapter.displayOrder,
    isRequired: chapter.isRequired,
    isActive: chapter.isActive,
  }
  showMainForm.value = true
}

const closeMainForm = () => {
  showMainForm.value = false
  editingMainId.value = null
}

const submitMainForm = async () => {
  if (!mainForm.value.title.trim()) {
    errorMessage.value = '대단원 제목을 입력해 주세요.'
    return
  }
  saving.value = true
  errorMessage.value = ''
  try {
    if (editingMainId.value == null) {
      await createMainChapter({
        chapterType: mainForm.value.chapterType,
        assetType: mainForm.value.chapterType === 'ASSET' ? mainForm.value.assetType : null,
        title: mainForm.value.title.trim(),
        description: mainForm.value.description.trim(),
        displayOrder: Number(mainForm.value.displayOrder) || 1,
        isRequired: mainForm.value.chapterType === 'FOUNDATION' || mainForm.value.isRequired,
      })
      flash('대단원을 생성했습니다.')
    } else {
      await updateMainChapter(editingMainId.value, {
        title: mainForm.value.title.trim(),
        description: mainForm.value.description.trim(),
        displayOrder: Number(mainForm.value.displayOrder) || 1,
        isActive: mainForm.value.isActive,
      })
      flash('대단원을 수정했습니다.')
    }
    closeMainForm()
    await loadMainChapters()
  } catch (error) {
    setError(error)
  } finally {
    saving.value = false
  }
}

const toggleMainActive = async (chapter) => {
  saving.value = true
  errorMessage.value = ''
  try {
    await updateMainChapter(chapter.mainChapterId, { isActive: !chapter.isActive })
    flash(
      chapter.isActive ? '대단원을 비활성으로 변경했습니다.' : '대단원을 활성으로 변경했습니다.',
    )
    await loadMainChapters()
  } catch (error) {
    setError(error)
  } finally {
    saving.value = false
  }
}

const moveMainOrder = async (chapter, direction) => {
  const sorted = [...mainChapters.value].sort((a, b) => a.displayOrder - b.displayOrder)
  const index = sorted.findIndex((c) => c.mainChapterId === chapter.mainChapterId)
  const swapWith = sorted[index + direction]
  if (!swapWith) return
  const from = chapter.displayOrder
  const to = swapWith.displayOrder
  if (from === to) return
  saving.value = true
  errorMessage.value = ''
  try {
    const tempOrder = Math.max(...sorted.map((c) => c.displayOrder), 0) + 1000
    await updateMainChapter(chapter.mainChapterId, { displayOrder: tempOrder })
    await updateMainChapter(swapWith.mainChapterId, { displayOrder: from })
    await updateMainChapter(chapter.mainChapterId, { displayOrder: to })
    await loadMainChapters()
  } catch (error) {
    setError(error)
    await loadMainChapters()
  } finally {
    saving.value = false
  }
}

const openCreateSub = () => {
  if (!selectedMainId.value) return
  editingSubId.value = null
  const nextOrder = subChapters.value.reduce((max, c) => Math.max(max, c.displayOrder), 0) + 1
  subForm.value = { ...emptySubForm(), displayOrder: nextOrder || 1 }
  showSubForm.value = true
}

const openEditSub = (chapter) => {
  editingSubId.value = chapter.subChapterId
  subForm.value = {
    title: chapter.title,
    description: chapter.description || '',
    displayOrder: chapter.displayOrder,
    isActive: chapter.isActive,
  }
  showSubForm.value = true
}

const closeSubForm = () => {
  showSubForm.value = false
  editingSubId.value = null
}

const submitSubForm = async () => {
  if (!selectedMainId.value) return
  if (!subForm.value.title.trim()) {
    errorMessage.value = '소단원 제목을 입력해 주세요.'
    return
  }
  saving.value = true
  errorMessage.value = ''
  try {
    if (editingSubId.value == null) {
      await createSubChapter(selectedMainId.value, {
        title: subForm.value.title.trim(),
        description: subForm.value.description.trim(),
        displayOrder: Number(subForm.value.displayOrder) || 1,
      })
      flash('소단원을 생성했습니다.')
    } else {
      await updateSubChapter(editingSubId.value, {
        title: subForm.value.title.trim(),
        description: subForm.value.description.trim(),
        displayOrder: Number(subForm.value.displayOrder) || 1,
        isActive: subForm.value.isActive,
      })
      flash('소단원을 수정했습니다.')
    }
    closeSubForm()
    await loadSubChapters(selectedMainId.value)
  } catch (error) {
    setError(error)
  } finally {
    saving.value = false
  }
}

const toggleSubActive = async (chapter) => {
  saving.value = true
  errorMessage.value = ''
  try {
    await updateSubChapter(chapter.subChapterId, { isActive: !chapter.isActive })
    flash(
      chapter.isActive ? '소단원을 비활성으로 변경했습니다.' : '소단원을 활성으로 변경했습니다.',
    )
    await loadSubChapters(selectedMainId.value)
  } catch (error) {
    setError(error)
  } finally {
    saving.value = false
  }
}

const moveSubOrder = async (chapter, direction) => {
  const sorted = [...subChapters.value].sort((a, b) => a.displayOrder - b.displayOrder)
  const index = sorted.findIndex((c) => c.subChapterId === chapter.subChapterId)
  const swapWith = sorted[index + direction]
  if (!swapWith) return
  const from = chapter.displayOrder
  const to = swapWith.displayOrder
  if (from === to) return
  saving.value = true
  errorMessage.value = ''
  try {
    const tempOrder = Math.max(...sorted.map((c) => c.displayOrder), 0) + 1000
    await updateSubChapter(chapter.subChapterId, { displayOrder: tempOrder })
    await updateSubChapter(swapWith.subChapterId, { displayOrder: from })
    await updateSubChapter(chapter.subChapterId, { displayOrder: to })
    await loadSubChapters(selectedMainId.value)
  } catch (error) {
    setError(error)
    await loadSubChapters(selectedMainId.value)
  } finally {
    saving.value = false
  }
}

const openContentVersions = (chapter) => {
  contentVersionTarget.value = {
    ...chapter,
    mainChapterId: chapter.mainChapterId ?? selectedMainId.value ?? undefined,
  }
}

const closeContentVersions = () => {
  contentVersionTarget.value = null
}

const onContentPublished = async ({ subChapterId, contentVersionId }) => {
  const target = subChapters.value.find((c) => c.subChapterId === subChapterId)
  if (target) {
    target.currentContentVersionId = contentVersionId
  }
  if (contentVersionTarget.value?.subChapterId === subChapterId) {
    contentVersionTarget.value = {
      ...contentVersionTarget.value,
      currentContentVersionId: contentVersionId,
    }
  }
  flash(`소단원 #${subChapterId} 현재 게시본 → #${contentVersionId}`)
}

watch(selectedMainId, (id) => {
  loadSubChapters(id)
})

watch([chapterTypeFilter, activeFilter], () => {
  loadMainChapters()
})

onMounted(() => {
  loadMainChapters()
})
</script>

<template>
  <div class="admin-page admin-page--wide">
    <div class="admin-page__header">
      <div>
        <p class="admin-page__kicker">Curriculum</p>
        <h2 class="admin-page__title">대단원 · 소단원</h2>
        <p class="admin-page__desc">
          대단원·소단원 메타데이터와 소단원 강좌 JSON 버전 업로드·게시를 관리합니다.
        </p>
      </div>
      <button
        type="button"
        class="admin-btn admin-btn--primary"
        :disabled="saving"
        @click="openCreateMain"
      >
        대단원 추가
      </button>
    </div>

    <p v-if="notice" class="admin-alert admin-alert--ok" role="status">{{ notice }}</p>
    <p v-if="errorMessage" class="admin-alert admin-alert--error" role="alert">
      {{ errorMessage }}
    </p>

    <div class="admin-split">
      <section class="admin-card admin-card--flush">
        <div class="admin-toolbar">
          <h3 class="admin-card__title">대단원</h3>
          <div class="admin-toolbar__filters">
            <select v-model="chapterTypeFilter" class="admin-select" aria-label="유형 필터">
              <option value="">전체 유형</option>
              <option value="FOUNDATION">기초 과정</option>
              <option value="ASSET">자산군</option>
            </select>
            <select v-model="activeFilter" class="admin-select" aria-label="활성 필터">
              <option value="all">활성 전체</option>
              <option value="active">활성만</option>
              <option value="inactive">비활성만</option>
            </select>
          </div>
        </div>

        <p v-if="loadingMains" class="admin-empty">불러오는 중…</p>
        <p v-else-if="!mainChapters.length" class="admin-empty">등록된 대단원이 없습니다.</p>
        <div v-else class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>순서</th>
                <th>제목</th>
                <th>유형</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="chapter in mainChapters"
                :key="chapter.mainChapterId"
                :class="{ 'is-selected': selectedMainId === chapter.mainChapterId }"
                @click="selectMain(chapter)"
              >
                <td class="admin-mono">{{ chapter.displayOrder }}</td>
                <td>
                  <div class="admin-cell-title">{{ chapter.title }}</div>
                  <div class="admin-cell-sub">
                    #{{ chapter.mainChapterId }}
                    <template v-if="chapter.assetType">
                      · {{ assetTypeLabel(chapter.assetType) }}</template
                    >
                  </div>
                </td>
                <td>
                  <span class="admin-badge">{{
                    CHAPTER_TYPE_LABELS[chapter.chapterType] || chapter.chapterType
                  }}</span>
                  <span v-if="chapter.isRequired" class="admin-badge admin-badge--accent"
                    >필수</span
                  >
                </td>
                <td>
                  <span
                    class="admin-badge"
                    :class="chapter.isActive ? 'admin-badge--ok' : 'admin-badge--muted'"
                  >
                    {{ chapter.isActive ? '활성' : '비활성' }}
                  </span>
                </td>
                <td class="admin-table__actions" @click.stop>
                  <button
                    type="button"
                    class="admin-btn admin-btn--ghost"
                    :disabled="saving"
                    @click="moveMainOrder(chapter, -1)"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    class="admin-btn admin-btn--ghost"
                    :disabled="saving"
                    @click="moveMainOrder(chapter, 1)"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    class="admin-btn admin-btn--ghost"
                    :disabled="saving"
                    @click="openEditMain(chapter)"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    class="admin-btn admin-btn--ghost"
                    :disabled="saving"
                    @click="toggleMainActive(chapter)"
                  >
                    {{ chapter.isActive ? '비활성' : '활성' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="admin-card admin-card--flush">
        <div class="admin-toolbar">
          <div>
            <h3 class="admin-card__title">소단원</h3>
            <p v-if="selectedMain" class="admin-toolbar__hint">{{ selectedMain.title }}</p>
            <p v-else class="admin-toolbar__hint">왼쪽에서 대단원을 선택하세요</p>
          </div>
          <button
            type="button"
            class="admin-btn admin-btn--primary"
            :disabled="!selectedMainId || saving"
            @click="openCreateSub"
          >
            소단원 추가
          </button>
        </div>

        <p v-if="!selectedMainId" class="admin-empty">
          대단원을 선택하면 소단원 목록이 표시됩니다.
        </p>
        <p v-else-if="loadingSubs" class="admin-empty">불러오는 중…</p>
        <p v-else-if="!subChapters.length" class="admin-empty">등록된 소단원이 없습니다.</p>
        <div v-else class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>순서</th>
                <th>제목</th>
                <th>콘텐츠</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="chapter in subChapters" :key="chapter.subChapterId">
                <td class="admin-mono">{{ chapter.displayOrder }}</td>
                <td>
                  <div class="admin-cell-title">{{ chapter.title }}</div>
                  <div class="admin-cell-sub">#{{ chapter.subChapterId }}</div>
                </td>
                <td class="admin-mono">
                  {{
                    chapter.currentContentVersionId != null
                      ? `v#${chapter.currentContentVersionId}`
                      : '—'
                  }}
                </td>
                <td>
                  <span
                    class="admin-badge"
                    :class="chapter.isActive ? 'admin-badge--ok' : 'admin-badge--muted'"
                  >
                    {{ chapter.isActive ? '활성' : '비활성' }}
                  </span>
                </td>
                <td class="admin-table__actions">
                  <button
                    type="button"
                    class="admin-btn admin-btn--ghost"
                    :disabled="saving"
                    @click="moveSubOrder(chapter, -1)"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    class="admin-btn admin-btn--ghost"
                    :disabled="saving"
                    @click="moveSubOrder(chapter, 1)"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    class="admin-btn admin-btn--primary"
                    :disabled="saving"
                    @click="openContentVersions(chapter)"
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    class="admin-btn admin-btn--ghost"
                    :disabled="saving"
                    @click="openEditSub(chapter)"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    class="admin-btn admin-btn--ghost"
                    :disabled="saving"
                    @click="toggleSubActive(chapter)"
                  >
                    {{ chapter.isActive ? '비활성' : '활성' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div
      v-if="showMainForm"
      class="admin-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="main-form-title"
    >
      <button
        type="button"
        class="admin-modal__backdrop"
        aria-label="닫기"
        @click="closeMainForm"
      />
      <div class="admin-modal__panel">
        <h3 id="main-form-title" class="admin-modal__title">
          {{ editingMainId == null ? '대단원 추가' : '대단원 수정' }}
        </h3>
        <form class="admin-form" @submit.prevent="submitMainForm">
          <label class="admin-field">
            <span>유형</span>
            <select
              v-model="mainForm.chapterType"
              class="admin-input"
              :disabled="editingMainId != null"
            >
              <option value="FOUNDATION">기초 과정 (FOUNDATION)</option>
              <option value="ASSET">자산군 (ASSET)</option>
            </select>
          </label>
          <label v-if="mainForm.chapterType === 'ASSET'" class="admin-field">
            <span>자산군</span>
            <select
              v-model="mainForm.assetType"
              class="admin-input"
              :disabled="editingMainId != null"
            >
              <option v-for="opt in ASSET_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label class="admin-field">
            <span>제목</span>
            <input
              v-model="mainForm.title"
              class="admin-input"
              type="text"
              maxlength="100"
              required
            />
          </label>
          <label class="admin-field">
            <span>설명</span>
            <textarea
              v-model="mainForm.description"
              class="admin-input admin-input--area"
              rows="3"
            />
          </label>
          <label class="admin-field">
            <span>노출 순서</span>
            <input
              v-model.number="mainForm.displayOrder"
              class="admin-input"
              type="number"
              min="1"
              required
            />
          </label>
          <label
            v-if="editingMainId == null && mainForm.chapterType === 'ASSET'"
            class="admin-field admin-field--check"
          >
            <input v-model="mainForm.isRequired" type="checkbox" />
            <span>필수 과정으로 표시</span>
          </label>
          <label v-if="editingMainId != null" class="admin-field admin-field--check">
            <input v-model="mainForm.isActive" type="checkbox" />
            <span>활성</span>
          </label>
          <div class="admin-form__actions">
            <button type="button" class="admin-btn" :disabled="saving" @click="closeMainForm">
              취소
            </button>
            <button type="submit" class="admin-btn admin-btn--primary" :disabled="saving">
              {{ saving ? '저장 중…' : '저장' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="showSubForm"
      class="admin-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sub-form-title"
    >
      <button type="button" class="admin-modal__backdrop" aria-label="닫기" @click="closeSubForm" />
      <div class="admin-modal__panel">
        <h3 id="sub-form-title" class="admin-modal__title">
          {{ editingSubId == null ? '소단원 추가' : '소단원 수정' }}
        </h3>
        <form class="admin-form" @submit.prevent="submitSubForm">
          <label class="admin-field">
            <span>제목</span>
            <input
              v-model="subForm.title"
              class="admin-input"
              type="text"
              maxlength="100"
              required
            />
          </label>
          <label class="admin-field">
            <span>설명</span>
            <textarea
              v-model="subForm.description"
              class="admin-input admin-input--area"
              rows="3"
            />
          </label>
          <label class="admin-field">
            <span>노출 순서</span>
            <input
              v-model.number="subForm.displayOrder"
              class="admin-input"
              type="number"
              min="1"
              required
            />
          </label>
          <label v-if="editingSubId != null" class="admin-field admin-field--check">
            <input v-model="subForm.isActive" type="checkbox" />
            <span>활성</span>
          </label>
          <div class="admin-form__actions">
            <button type="button" class="admin-btn" :disabled="saving" @click="closeSubForm">
              취소
            </button>
            <button type="submit" class="admin-btn admin-btn--primary" :disabled="saving">
              {{ saving ? '저장 중…' : '저장' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <AdminContentVersionPanel
      :sub-chapter="contentVersionTarget"
      @close="closeContentVersions"
      @published="onContentPublished"
    />
  </div>
</template>
