<script setup>
import { onMounted, ref } from 'vue'
import {
  fetchAdminNews,
  formatAdminNewsError,
  removeAdminNews,
  updateAdminNewsContent,
} from '@/services/adminNewsService.js'

const loading = ref(false)
const saving = ref(false)
const removing = ref(false)
const errorMessage = ref('')
const notice = ref('')
/** @type {import('vue').Ref<import('@/types/adminNews.js').AdminNewsItem[]>} */
const items = ref([])
/** @type {import('vue').Ref<import('@/types/adminNews.js').AdminNewsItem | null>} */
const selected = ref(null)
const showEdit = ref(false)
const showDeleteConfirm = ref(false)

const editForm = ref(emptyEditForm())

function emptyEditForm() {
  return {
    title: '',
    summary: '',
    imageUrl: '',
    clearThumbnail: false,
  }
}

const flash = (message) => {
  notice.value = message
  window.setTimeout(() => {
    if (notice.value === message) notice.value = ''
  }, 3200)
}

const setError = (error) => {
  errorMessage.value = formatAdminNewsError(error)
}

const loadNews = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    items.value = await fetchAdminNews()
    if (selected.value) {
      const refreshed = items.value.find(
        (item) => item.financialNewsId === selected.value.financialNewsId,
      )
      selected.value = refreshed ?? null
    }
  } catch (error) {
    setError(error)
    items.value = []
  } finally {
    loading.value = false
  }
}

const selectItem = (item) => {
  selected.value = item
  showEdit.value = false
  errorMessage.value = ''
}

const openEdit = () => {
  if (!selected.value) return
  editForm.value = {
    title: selected.value.title ?? '',
    summary: selected.value.summary ?? '',
    imageUrl: selected.value.imageUrl ?? '',
    clearThumbnail: false,
  }
  showEdit.value = true
  errorMessage.value = ''
}

const closeEdit = () => {
  showEdit.value = false
}

const submitEdit = async () => {
  if (!selected.value) return
  saving.value = true
  errorMessage.value = ''
  try {
    /** @type {import('@/types/adminNews.js').AdminNewsPatchPayload} */
    const payload = {
      title: editForm.value.title.trim(),
      summary: editForm.value.summary.trim(),
    }
    if (editForm.value.clearThumbnail) {
      payload.imageUrl = null
    } else {
      const nextImage = editForm.value.imageUrl.trim()
      const prevImage = selected.value.imageUrl ?? ''
      if (nextImage !== prevImage) payload.imageUrl = nextImage || null
    }

    const updated = await updateAdminNewsContent(selected.value.financialNewsId, payload)
    items.value = items.value.map((item) =>
      item.financialNewsId === updated.financialNewsId ? updated : item,
    )
    selected.value = items.value.find((item) => item.financialNewsId === updated.financialNewsId)
    closeEdit()
    flash(`#${updated.financialNewsId} 내용 수정 완료`)
  } catch (error) {
    setError(error)
  } finally {
    saving.value = false
  }
}

const openDelete = () => {
  if (!selected.value) return
  showDeleteConfirm.value = true
  errorMessage.value = ''
}

const closeDelete = () => {
  showDeleteConfirm.value = false
}

const confirmDelete = async () => {
  if (!selected.value) return
  removing.value = true
  errorMessage.value = ''
  const id = selected.value.financialNewsId
  try {
    await removeAdminNews(id)
    items.value = items.value.filter((item) => item.financialNewsId !== id)
    selected.value = null
    showEdit.value = false
    closeDelete()
    flash(`#${id} 뉴스를 제거했습니다`)
  } catch (error) {
    setError(error)
  } finally {
    removing.value = false
  }
}

onMounted(() => {
  loadNews()
})
</script>

<template>
  <div class="admin-page admin-page--wide">
    <div class="admin-page__header">
      <div>
        <p class="admin-page__kicker">News Review</p>
        <h2 class="admin-page__title">뉴스 검수</h2>
        <p class="admin-page__desc">
          공개 뉴스 목록을 확인하고 제목·요약·썸네일을 수정하거나 잘못 노출된 기사를 제거합니다.
          원문 URL은 바꿀 수 없습니다.
        </p>
      </div>
    </div>

    <p v-if="notice" class="admin-alert admin-alert--ok" role="status">{{ notice }}</p>
    <pre v-if="errorMessage" class="admin-alert admin-alert--error" role="alert">{{
      errorMessage
    }}</pre>

    <section class="admin-card">
      <div class="admin-filters">
        <button type="button" class="admin-btn" :disabled="loading" @click="loadNews">
          새로고침
        </button>
      </div>
    </section>

    <div class="admin-split">
      <section class="admin-card admin-card--flush admin-news-list-panel">
        <h3 class="admin-card__title">뉴스 목록</h3>
        <div class="admin-news-list-scroll" role="region" aria-label="뉴스 목록">
          <p v-if="loading" class="admin-muted">불러오는 중…</p>
          <p v-else-if="!items.length" class="admin-muted">뉴스가 없습니다.</p>
          <ul v-else class="admin-list admin-list--scroll">
            <li
              v-for="item in items"
              :key="item.financialNewsId"
              class="admin-list__item admin-list__item--clickable"
              :class="{ 'is-selected': selected?.financialNewsId === item.financialNewsId }"
              @click="selectItem(item)"
            >
              <div>
                <p class="admin-list__label">
                  {{ item.title || '(제목 없음)' }}
                  <span class="admin-code">#{{ item.financialNewsId }}</span>
                </p>
                <p class="admin-list__meta">
                  {{ item.sourceName || '출처 미기재' }}
                  <template v-if="item.sourcePublishedAt">
                    · {{ item.sourcePublishedAt }}
                  </template>
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section class="admin-card admin-card--flush">
        <div class="admin-page__header" style="margin-bottom: 12px">
          <h3 class="admin-card__title" style="margin: 0">상세</h3>
          <div v-if="selected && !showEdit" class="admin-form__actions">
            <button
              type="button"
              class="admin-btn"
              :disabled="saving || removing"
              @click="openEdit"
            >
              내용 수정
            </button>
            <button
              type="button"
              class="admin-btn admin-btn--danger"
              :disabled="saving || removing"
              @click="openDelete"
            >
              제거
            </button>
          </div>
        </div>

        <p v-if="!selected" class="admin-muted">왼쪽에서 뉴스를 선택하세요.</p>

        <template v-else-if="!showEdit">
          <dl class="admin-detail">
            <div>
              <dt>financial_news_id</dt>
              <dd>{{ selected.financialNewsId }}</dd>
            </div>
            <div v-if="selected.knowledgeContentId != null">
              <dt>knowledge_content_id</dt>
              <dd>{{ selected.knowledgeContentId }}</dd>
            </div>
            <div>
              <dt>title</dt>
              <dd>{{ selected.title || '—' }}</dd>
            </div>
            <div>
              <dt>summary</dt>
              <dd>{{ selected.summary || '—' }}</dd>
            </div>
            <div>
              <dt>image_url</dt>
              <dd>{{ selected.imageUrl || '—' }}</dd>
            </div>
            <div>
              <dt>source_name</dt>
              <dd>{{ selected.sourceName || '—' }}</dd>
            </div>
            <div>
              <dt>source_url</dt>
              <dd>
                <a
                  v-if="selected.sourceUrl"
                  :href="selected.sourceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ selected.sourceUrl }}
                </a>
                <template v-else>—</template>
              </dd>
            </div>
            <div>
              <dt>source_published_at</dt>
              <dd>{{ selected.sourcePublishedAt || '—' }}</dd>
            </div>
            <div>
              <dt>collected_at</dt>
              <dd>{{ selected.collectedAt || '—' }}</dd>
            </div>
            <div>
              <dt>published_at</dt>
              <dd>{{ selected.publishedAt || '—' }}</dd>
            </div>
          </dl>
        </template>

        <form v-else class="admin-form" @submit.prevent="submitEdit">
          <p class="admin-muted">
            원문 URL·출처명·발행 시점은 수정할 수 없습니다. image_url을 비우면 썸네일을 제거합니다.
          </p>
          <label class="admin-field">
            <span>source_url (읽기 전용)</span>
            <input :value="selected.sourceUrl" class="admin-input" disabled />
          </label>
          <label class="admin-field">
            <span>title</span>
            <input v-model="editForm.title" class="admin-input" required />
          </label>
          <label class="admin-field">
            <span>summary</span>
            <textarea v-model="editForm.summary" class="admin-input" rows="6" required />
          </label>
          <label class="admin-field">
            <span>image_url</span>
            <input
              v-model="editForm.imageUrl"
              class="admin-input"
              :disabled="editForm.clearThumbnail"
              placeholder="https://…"
            />
          </label>
          <label class="admin-field admin-field--inline">
            <input v-model="editForm.clearThumbnail" type="checkbox" />
            <span>썸네일 제거 (image_url: null)</span>
          </label>
          <div class="admin-form__actions">
            <button type="button" class="admin-btn" :disabled="saving" @click="closeEdit">
              취소
            </button>
            <button type="submit" class="admin-btn admin-btn--primary" :disabled="saving">
              {{ saving ? '저장 중…' : '저장' }}
            </button>
          </div>
        </form>
      </section>
    </div>

    <div
      v-if="showDeleteConfirm"
      class="admin-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
    >
      <div class="admin-modal__backdrop" @click="closeDelete" />
      <div class="admin-modal__panel">
        <h3 id="delete-title" class="admin-card__title">뉴스 제거</h3>
        <p class="admin-page__desc">
          #{{ selected?.financialNewsId }} 「{{ selected?.title }}」을(를) 목록에서 제거합니다.
        </p>
        <div class="admin-form__actions">
          <button type="button" class="admin-btn" :disabled="removing" @click="closeDelete">
            취소
          </button>
          <button
            type="button"
            class="admin-btn admin-btn--danger"
            :disabled="removing"
            @click="confirmDelete"
          >
            {{ removing ? '제거 중…' : '제거' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-news-list-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.admin-news-list-scroll {
  height: 480px;
  margin-top: 12px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 4px;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: #94a3b8 #e2e8f0;
}

.admin-list--scroll {
  margin-top: 0;
}

.admin-list__item--clickable {
  cursor: pointer;
}

.admin-list__item--clickable.is-selected {
  border-color: var(--admin-accent);
  background: var(--admin-accent-soft);
}

.admin-detail {
  display: grid;
  gap: 10px;
  margin: 0;
}

.admin-detail > div {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 8px;
  font-size: 13px;
}

.admin-detail dt {
  margin: 0;
  color: var(--admin-text-muted);
}

.admin-detail dd {
  margin: 0;
  word-break: break-word;
}

.admin-field--inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-form {
  display: grid;
  gap: 12px;
}

.admin-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.admin-muted {
  margin: 0;
  color: var(--admin-text-muted);
  font-size: 13px;
}

.admin-modal {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
}

.admin-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
}

.admin-modal__panel {
  position: relative;
  z-index: 1;
  width: min(520px, calc(100vw - 32px));
  padding: 20px;
  border-radius: var(--admin-radius);
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
}

.admin-btn--danger {
  color: #fff;
  background: var(--admin-danger);
  border-color: var(--admin-danger);
}
</style>
