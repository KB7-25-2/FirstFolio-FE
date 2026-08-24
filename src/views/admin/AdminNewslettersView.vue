<script setup>
import { onMounted, ref, watch } from 'vue'
import {
  DEFAULT_NEWSLETTER_STATUS,
  NEWSLETTER_STATUS_LABELS,
  NEWSLETTER_STATUS_OPTIONS,
  fetchAdminNewsletterDetail,
  fetchAdminNewsletters,
  formatAdminNewsletterError,
  publishAdminNewsletterService,
  retireAdminNewsletterService,
} from '@/services/adminNewsletterService.js'

const loading = ref(false)
const detailLoading = ref(false)
const publishing = ref(false)
const retiring = ref(false)
const errorMessage = ref('')
const notice = ref('')
/** status 필수 — 전체 조회 API 없음. 기본은 검수 대기 */
const filterStatus = ref(DEFAULT_NEWSLETTER_STATUS)

/** @type {import('vue').Ref<import('@/types/adminNewsletter.js').AdminNewsletter[]>} */
const items = ref([])
/** @type {import('vue').Ref<import('@/types/adminNewsletter.js').AdminNewsletter | null>} */
const selected = ref(null)
const showPublishConfirm = ref(false)
const showRetireConfirm = ref(false)

const flash = (message) => {
  notice.value = message
  window.setTimeout(() => {
    if (notice.value === message) notice.value = ''
  }, 3200)
}

const setError = (error) => {
  errorMessage.value = formatAdminNewsletterError(error)
}

const formatDate = (value) => {
  if (!value) return '—'
  return String(value)
}

const formatDateTime = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('ko-KR')
}

const statusBadgeClass = (status) => {
  if (status === 'PUBLISHED') return 'admin-badge admin-badge--ok'
  if (status === 'RETIRED') return 'admin-badge admin-badge--muted'
  return 'admin-badge admin-badge--accent'
}

const loadList = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    items.value = await fetchAdminNewsletters({
      status: filterStatus.value,
    })
    if (selected.value) {
      const refreshed = items.value.find(
        (item) => item.newsletterId === selected.value.newsletterId,
      )
      if (refreshed) {
        selected.value = { ...selected.value, ...refreshed }
      } else {
        selected.value = null
      }
    }
  } catch (error) {
    setError(error)
    items.value = []
  } finally {
    loading.value = false
  }
}

const selectItem = async (item) => {
  selected.value = item
  errorMessage.value = ''
  detailLoading.value = true
  try {
    selected.value = await fetchAdminNewsletterDetail(item.newsletterId)
  } catch (error) {
    setError(error)
  } finally {
    detailLoading.value = false
  }
}

const openPublish = () => {
  if (!selected.value || selected.value.status !== 'REVIEW') return
  showPublishConfirm.value = true
  errorMessage.value = ''
}

const closePublish = () => {
  showPublishConfirm.value = false
}

const confirmPublish = async () => {
  if (!selected.value) return
  publishing.value = true
  errorMessage.value = ''
  try {
    const result = await publishAdminNewsletterService(selected.value.newsletterId)
    selected.value = {
      ...selected.value,
      status: result.status,
      publishedAt: result.publishedAt,
    }
    items.value = items.value.map((item) =>
      item.newsletterId === result.newsletterId
        ? { ...item, status: result.status, publishedAt: result.publishedAt }
        : item,
    )
    closePublish()
    flash(`#${result.newsletterId} 게시 완료`)
    // 목록은 status별 조회라 게시 후 REVIEW 필터에서는 사라진다.
    if (filterStatus.value === 'REVIEW') {
      await loadList()
      selected.value = null
    } else {
      filterStatus.value = 'PUBLISHED'
    }
  } catch (error) {
    setError(error)
  } finally {
    publishing.value = false
  }
}

const openRetire = () => {
  if (!selected.value || selected.value.status !== 'PUBLISHED') return
  showRetireConfirm.value = true
  errorMessage.value = ''
}

const closeRetire = () => {
  showRetireConfirm.value = false
}

const confirmRetire = async () => {
  if (!selected.value) return
  retiring.value = true
  errorMessage.value = ''
  try {
    const result = await retireAdminNewsletterService(selected.value.newsletterId)
    selected.value = {
      ...selected.value,
      status: result.status,
      publishedAt: result.publishedAt,
    }
    items.value = items.value.map((item) =>
      item.newsletterId === result.newsletterId
        ? { ...item, status: result.status, publishedAt: result.publishedAt }
        : item,
    )
    closeRetire()
    flash(`#${result.newsletterId} 폐기 완료`)
    if (filterStatus.value === 'PUBLISHED') {
      await loadList()
      selected.value = null
    } else {
      filterStatus.value = 'RETIRED'
    }
  } catch (error) {
    setError(error)
  } finally {
    retiring.value = false
  }
}

watch(filterStatus, () => {
  selected.value = null
  loadList()
})

onMounted(() => {
  loadList()
})
</script>

<template>
  <div class="admin-page admin-page--wide">
    <div class="admin-page__header">
      <div>
        <p class="admin-page__kicker">Newsletter Review</p>
        <h2 class="admin-page__title">뉴스레터 검수</h2>
        <p class="admin-page__desc">
          AI가 생성한 주간 뉴스레터를 상태별로 조회하고 게시·폐기합니다. 목록 API는 status가
          필수이며(REVIEW / PUBLISHED / RETIRED) 전체 조회는 지원하지 않습니다.
        </p>
      </div>
    </div>

    <p v-if="notice" class="admin-alert admin-alert--ok" role="status">{{ notice }}</p>
    <pre v-if="errorMessage" class="admin-alert admin-alert--error" role="alert">{{
      errorMessage
    }}</pre>

    <section class="admin-card">
      <div class="admin-filters">
        <label class="admin-field">
          <span>status</span>
          <select v-model="filterStatus" class="admin-input">
            <option v-for="opt in NEWSLETTER_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
        <button type="button" class="admin-btn" :disabled="loading" @click="loadList">
          새로고침
        </button>
      </div>
    </section>

    <div class="admin-split">
      <section class="admin-card admin-card--flush admin-nl-list-panel">
        <h3 class="admin-card__title">뉴스레터 목록</h3>
        <div class="admin-nl-list-scroll" role="region" aria-label="뉴스레터 목록">
          <p v-if="loading" class="admin-muted">불러오는 중…</p>
          <p v-else-if="!items.length" class="admin-muted">뉴스레터가 없습니다.</p>
          <ul v-else class="admin-list admin-list--scroll">
            <li
              v-for="item in items"
              :key="item.newsletterId"
              class="admin-list__item admin-list__item--clickable"
              :class="{ 'is-selected': selected?.newsletterId === item.newsletterId }"
              @click="selectItem(item)"
            >
              <div>
                <p class="admin-list__label">
                  {{ item.headline || '(헤드라인 없음)' }}
                  <span class="admin-code">#{{ item.newsletterId }}</span>
                </p>
                <p class="admin-list__meta">
                  <span :class="statusBadgeClass(item.status)">
                    {{ NEWSLETTER_STATUS_LABELS[item.status] || item.status }}
                  </span>
                  주간 {{ formatDate(item.weekStartDate) }}
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section class="admin-card admin-card--flush">
        <div class="admin-page__header" style="margin-bottom: 12px">
          <h3 class="admin-card__title" style="margin: 0">상세</h3>
          <div v-if="selected" class="admin-form__actions">
            <button
              v-if="selected.status === 'REVIEW'"
              type="button"
              class="admin-btn admin-btn--primary"
              :disabled="publishing || retiring || detailLoading"
              @click="openPublish"
            >
              게시
            </button>
            <button
              v-if="selected.status === 'PUBLISHED'"
              type="button"
              class="admin-btn admin-btn--danger"
              :disabled="publishing || retiring || detailLoading"
              @click="openRetire"
            >
              폐기
            </button>
          </div>
        </div>

        <p v-if="!selected" class="admin-muted">왼쪽에서 뉴스레터를 선택하세요.</p>
        <p v-else-if="detailLoading" class="admin-muted">상세 불러오는 중…</p>

        <template v-else>
          <dl class="admin-detail">
            <div>
              <dt>newsletter_id</dt>
              <dd>{{ selected.newsletterId }}</dd>
            </div>
            <div>
              <dt>status</dt>
              <dd>
                <span :class="statusBadgeClass(selected.status)">
                  {{ NEWSLETTER_STATUS_LABELS[selected.status] || selected.status }}
                </span>
              </dd>
            </div>
            <div>
              <dt>week_start_date</dt>
              <dd>{{ formatDate(selected.weekStartDate) }}</dd>
            </div>
            <div>
              <dt>headline</dt>
              <dd>{{ selected.headline || '—' }}</dd>
            </div>
            <div>
              <dt>generation_type</dt>
              <dd>{{ selected.generationType || '—' }}</dd>
            </div>
            <div>
              <dt>published_at</dt>
              <dd>{{ formatDateTime(selected.publishedAt) }}</dd>
            </div>
            <div>
              <dt>created_at</dt>
              <dd>{{ formatDateTime(selected.createdAt) }}</dd>
            </div>
          </dl>

          <section class="admin-nl-block">
            <h4 class="admin-nl-block__title">금융 용어</h4>
            <p v-if="!selected.financialWords.length" class="admin-muted">없음</p>
            <ul v-else class="admin-nl-words">
              <li v-for="(word, index) in selected.financialWords" :key="`w-${index}`">
                <p class="admin-nl-words__term">{{ word.term }}</p>
                <p class="admin-nl-words__def">{{ word.definition }}</p>
              </li>
            </ul>
          </section>

          <section class="admin-nl-block">
            <h4 class="admin-nl-block__title">이슈</h4>
            <p v-if="!selected.issues.length" class="admin-muted">없음</p>
            <ul v-else class="admin-nl-issues">
              <li
                v-for="(issue, index) in selected.issues"
                :key="`i-${index}`"
                class="admin-nl-issue"
              >
                <p class="admin-nl-issue__title">{{ issue.title }}</p>
                <p class="admin-nl-issue__summary">{{ issue.summary }}</p>
                <p v-if="issue.relatedTerm" class="admin-list__meta">
                  related_term: {{ issue.relatedTerm }}
                </p>
                <ul v-if="issue.sources.length" class="admin-nl-sources">
                  <li v-for="(src, sIndex) in issue.sources" :key="`s-${index}-${sIndex}`">
                    <a
                      v-if="src.sourceUrl"
                      :href="src.sourceUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {{ src.sourceUrl }}
                    </a>
                    <span v-else>출처 없음</span>
                    <p v-if="src.evidenceText" class="admin-nl-sources__evidence">
                      {{ src.evidenceText }}
                    </p>
                  </li>
                </ul>
              </li>
            </ul>
          </section>

          <section class="admin-nl-block">
            <h4 class="admin-nl-block__title">통계</h4>
            <p v-if="!selected.stats.length" class="admin-muted">없음</p>
            <dl v-else class="admin-nl-stats">
              <div v-for="(stat, index) in selected.stats" :key="`st-${index}`">
                <dt>{{ stat.label }}</dt>
                <dd>{{ stat.value }}</dd>
              </div>
            </dl>
          </section>
        </template>
      </section>
    </div>

    <div
      v-if="showPublishConfirm"
      class="admin-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-title"
    >
      <div class="admin-modal__backdrop" @click="closePublish" />
      <div class="admin-modal__panel">
        <h3 id="publish-title" class="admin-card__title">뉴스레터 게시</h3>
        <p class="admin-page__desc">
          #{{ selected?.newsletterId }} 「{{ selected?.headline }}」을(를) PUBLISHED로 전환합니다.
        </p>
        <div class="admin-form__actions">
          <button type="button" class="admin-btn" :disabled="publishing" @click="closePublish">
            취소
          </button>
          <button
            type="button"
            class="admin-btn admin-btn--primary"
            :disabled="publishing"
            @click="confirmPublish"
          >
            {{ publishing ? '게시 중…' : '게시' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showRetireConfirm"
      class="admin-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="retire-title"
    >
      <div class="admin-modal__backdrop" @click="closeRetire" />
      <div class="admin-modal__panel">
        <h3 id="retire-title" class="admin-card__title">뉴스레터 폐기</h3>
        <p class="admin-page__desc">
          #{{ selected?.newsletterId }} 「{{ selected?.headline }}」을(를) RETIRED로 전환합니다.
          사용자에게 더 이상 노출되지 않습니다.
        </p>
        <div class="admin-form__actions">
          <button type="button" class="admin-btn" :disabled="retiring" @click="closeRetire">
            취소
          </button>
          <button
            type="button"
            class="admin-btn admin-btn--danger"
            :disabled="retiring"
            @click="confirmRetire"
          >
            {{ retiring ? '폐기 중…' : '폐기' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
}

.admin-nl-list-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.admin-nl-list-scroll {
  height: 520px;
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
  grid-template-columns: 140px 1fr;
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

.admin-nl-block {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--admin-border);
}

.admin-nl-block__title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
}

.admin-nl-words,
.admin-nl-issues,
.admin-nl-sources {
  margin: 0;
  padding: 0;
  list-style: none;
}

.admin-nl-words {
  display: grid;
  gap: 10px;
}

.admin-nl-words__term {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}

.admin-nl-words__def {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--admin-text-secondary);
  line-height: 1.5;
}

.admin-nl-issues {
  display: grid;
  gap: 12px;
}

.admin-nl-issue {
  padding: 12px;
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  background: #fafafa;
}

.admin-nl-issue__title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}

.admin-nl-issue__summary {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--admin-text-secondary);
  line-height: 1.5;
  white-space: pre-wrap;
}

.admin-nl-sources {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.admin-nl-sources a {
  color: #1d4ed8;
  font-size: 12px;
  word-break: break-all;
}

.admin-nl-sources__evidence {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--admin-text-muted);
  line-height: 1.45;
}

.admin-nl-stats {
  display: grid;
  gap: 8px;
  margin: 0;
}

.admin-nl-stats > div {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 8px;
  font-size: 13px;
}

.admin-nl-stats dt {
  margin: 0;
  color: var(--admin-text-muted);
}

.admin-nl-stats dd {
  margin: 0;
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
