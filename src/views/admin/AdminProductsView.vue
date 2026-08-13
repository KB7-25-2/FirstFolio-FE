<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  ASSET_TYPE_OPTIONS,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_OPTIONS,
  SOURCE_PROVIDER_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
  assetTypeLabel,
  fetchAdminProducts,
  formatAdminProductError,
  importAdminProducts,
  updateAdminProduct,
} from '@/services/adminProductService.js'

const loading = ref(false)
const loadingMore = ref(false)
const saving = ref(false)
const importing = ref(false)
const errorMessage = ref('')
const notice = ref('')
const products = ref([])
const nextCursor = ref(null)

const filterAssetType = ref('')
const filterStatus = ref('')

/** @type {import('vue').Ref<import('@/types/adminProduct.js').AdminProduct | null>} */
const selected = ref(null)
const showImport = ref(false)
const showEdit = ref(false)

const importForm = ref({
  sourceProvider: 'FSS_FINLIFE',
  referenceAt: '',
})

const editForm = ref(emptyEditForm())

function emptyEditForm() {
  return {
    displayName: '',
    description: '',
    riskLevel: '',
    status: 'INACTIVE',
    simulationTermsText: '',
  }
}

const flash = (message) => {
  notice.value = message
  window.setTimeout(() => {
    if (notice.value === message) notice.value = ''
  }, 3200)
}

const setError = (error) => {
  errorMessage.value = formatAdminProductError(error)
}

const buildListFilters = (cursor = null) => ({
  assetType: filterAssetType.value || undefined,
  status: filterStatus.value || undefined,
  cursor: cursor || undefined,
  size: 20,
})

const loadProducts = async () => {
  loading.value = true
  errorMessage.value = ''
  nextCursor.value = null
  try {
    const result = await fetchAdminProducts(buildListFilters())
    products.value = result.items
    nextCursor.value = result.nextCursor
    if (selected.value) {
      const refreshed = result.items.find((p) => p.productId === selected.value.productId)
      if (refreshed) selected.value = refreshed
    }
  } catch (error) {
    setError(error)
    products.value = []
    nextCursor.value = null
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (!nextCursor.value || loadingMore.value) return
  loadingMore.value = true
  errorMessage.value = ''
  try {
    const result = await fetchAdminProducts(buildListFilters(nextCursor.value))
    const seen = new Set(products.value.map((p) => p.productId))
    products.value = [...products.value, ...result.items.filter((p) => !seen.has(p.productId))]
    nextCursor.value = result.nextCursor
  } catch (error) {
    setError(error)
  } finally {
    loadingMore.value = false
  }
}

const selectProduct = (product) => {
  selected.value = product
  showEdit.value = false
  errorMessage.value = ''
}

const openImport = () => {
  importForm.value = {
    sourceProvider: 'FSS_FINLIFE',
    referenceAt: new Date().toISOString().slice(0, 16),
  }
  showImport.value = true
  errorMessage.value = ''
}

const closeImport = () => {
  showImport.value = false
}

const submitImport = async () => {
  importing.value = true
  errorMessage.value = ''
  try {
    let referenceAt = null
    if (importForm.value.referenceAt) {
      const parsed = new Date(importForm.value.referenceAt)
      if (Number.isNaN(parsed.getTime())) {
        errorMessage.value = '기준 시점(reference_at) 형식이 올바르지 않습니다.'
        return
      }
      referenceAt = parsed.toISOString()
    }
    const result = await importAdminProducts({
      sourceProvider: importForm.value.sourceProvider,
      referenceAt,
    })
    closeImport()
    flash(`가져오기 완료 — 신규 ${result.importedCount}건, 건너뜀 ${result.skippedCount}건`)
    await loadProducts()
  } catch (error) {
    setError(error)
  } finally {
    importing.value = false
  }
}

const openEdit = () => {
  if (!selected.value) return
  editForm.value = {
    displayName: selected.value.displayName ?? '',
    description: selected.value.description ?? '',
    riskLevel: selected.value.riskLevel ?? '',
    status: selected.value.status ?? 'INACTIVE',
    simulationTermsText: selected.value.simulationTerms
      ? JSON.stringify(selected.value.simulationTerms, null, 2)
      : '',
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
    let simulationTerms = undefined
    const rawJson = editForm.value.simulationTermsText.trim()
    if (rawJson) {
      try {
        simulationTerms = JSON.parse(rawJson)
      } catch {
        errorMessage.value = 'simulation_terms JSON 형식이 올바르지 않습니다.'
        return
      }
    } else {
      simulationTerms = null
    }

    const updated = await updateAdminProduct(selected.value.productId, {
      displayName: editForm.value.displayName.trim(),
      description: editForm.value.description.trim() || null,
      riskLevel: editForm.value.riskLevel || null,
      status: editForm.value.status,
      simulationTerms,
    })

    products.value = products.value.map((p) => (p.productId === updated.productId ? updated : p))
    selected.value = updated
    closeEdit()
    flash(`#${updated.productId} 수정 완료`)
  } catch (error) {
    setError(error)
  } finally {
    saving.value = false
  }
}

const termsPreview = computed(() => {
  if (!selected.value?.realTerms && !selected.value?.simulationTerms) return null
  return {
    real: selected.value.realTerms ? JSON.stringify(selected.value.realTerms, null, 2) : null,
    simulation: selected.value.simulationTerms
      ? JSON.stringify(selected.value.simulationTerms, null, 2)
      : null,
  }
})

watch([filterAssetType, filterStatus], () => {
  selected.value = null
  showEdit.value = false
  loadProducts()
})

onMounted(() => {
  loadProducts()
})
</script>

<template>
  <div class="admin-page admin-page--wide">
    <div class="admin-page__header">
      <div>
        <p class="admin-page__kicker">Financial Products</p>
        <h2 class="admin-page__title">모의 금융상품</h2>
        <p class="admin-page__desc">
          원천 상품을 가져온 뒤 가명·위험도·시뮬레이션 조건·공개 상태를 설정합니다.
        </p>
      </div>
      <button
        type="button"
        class="admin-btn admin-btn--primary"
        :disabled="importing || saving"
        @click="openImport"
      >
        원천 가져오기
      </button>
    </div>

    <p v-if="notice" class="admin-alert admin-alert--ok" role="status">{{ notice }}</p>
    <pre v-if="errorMessage" class="admin-alert admin-alert--error" role="alert">{{
      errorMessage
    }}</pre>

    <section class="admin-card">
      <div class="admin-filters">
        <label class="admin-field">
          <span>asset_type</span>
          <select v-model="filterAssetType" class="admin-input">
            <option value="">전체</option>
            <option v-for="opt in ASSET_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
        <label class="admin-field">
          <span>status</span>
          <select v-model="filterStatus" class="admin-input">
            <option value="">전체</option>
            <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
        <button type="button" class="admin-btn" :disabled="loading" @click="loadProducts">
          새로고침
        </button>
      </div>
    </section>

    <div class="admin-split">
      <section class="admin-card admin-card--flush">
        <h3 class="admin-card__title">상품 목록</h3>
        <p v-if="loading" class="admin-muted">불러오는 중…</p>
        <p v-else-if="!products.length" class="admin-muted">상품이 없습니다.</p>
        <ul v-else class="admin-list">
          <li
            v-for="product in products"
            :key="product.productId"
            class="admin-list__item admin-list__item--clickable"
            :class="{ 'is-selected': selected?.productId === product.productId }"
            @click="selectProduct(product)"
          >
            <div>
              <p class="admin-list__label">
                {{ product.displayName || '(가명 미설정)' }}
                <span class="admin-code">#{{ product.productId }}</span>
              </p>
              <p class="admin-list__meta">
                {{ assetTypeLabel(product.assetType) }} ·
                {{ STATUS_LABELS[product.status] || product.status }} ·
                {{ RISK_LEVEL_LABELS[product.riskLevel] || product.riskLevel || '위험도 없음' }}
              </p>
              <p v-if="product.sourceProductName" class="admin-list__meta">
                원상품: {{ product.sourceProductName }}
              </p>
            </div>
          </li>
        </ul>
        <button
          v-if="nextCursor"
          type="button"
          class="admin-btn"
          style="margin-top: 12px"
          :disabled="loadingMore"
          @click="loadMore"
        >
          {{ loadingMore ? '불러오는 중…' : '더 보기' }}
        </button>
      </section>

      <section class="admin-card admin-card--flush">
        <div class="admin-page__header" style="margin-bottom: 12px">
          <h3 class="admin-card__title" style="margin: 0">상세</h3>
          <button
            v-if="selected && !showEdit"
            type="button"
            class="admin-btn"
            :disabled="saving"
            @click="openEdit"
          >
            수정
          </button>
        </div>

        <p v-if="!selected" class="admin-muted">왼쪽에서 상품을 선택하세요.</p>

        <template v-else-if="!showEdit">
          <dl class="admin-detail">
            <div>
              <dt>product_id</dt>
              <dd>{{ selected.productId }}</dd>
            </div>
            <div>
              <dt>display_name</dt>
              <dd>{{ selected.displayName || '—' }}</dd>
            </div>
            <div>
              <dt>asset_type</dt>
              <dd>{{ assetTypeLabel(selected.assetType) }}</dd>
            </div>
            <div>
              <dt>status</dt>
              <dd>{{ STATUS_LABELS[selected.status] || selected.status }}</dd>
            </div>
            <div>
              <dt>risk_level</dt>
              <dd>{{ RISK_LEVEL_LABELS[selected.riskLevel] || selected.riskLevel || '—' }}</dd>
            </div>
            <div>
              <dt>description</dt>
              <dd>{{ selected.description || '—' }}</dd>
            </div>
            <div>
              <dt>source_provider</dt>
              <dd>{{ selected.sourceProvider || '—' }}</dd>
            </div>
            <div>
              <dt>source_product_code</dt>
              <dd>{{ selected.sourceProductCode || '—' }}</dd>
            </div>
            <div>
              <dt>source_product_name</dt>
              <dd>{{ selected.sourceProductName || '—' }}</dd>
            </div>
            <div>
              <dt>source_reference_at</dt>
              <dd>{{ selected.sourceReferenceAt || '—' }}</dd>
            </div>
          </dl>

          <div v-if="termsPreview" class="admin-terms">
            <div v-if="termsPreview.real">
              <p class="admin-field__label">real_terms</p>
              <pre class="admin-code-block">{{ termsPreview.real }}</pre>
            </div>
            <div v-if="termsPreview.simulation">
              <p class="admin-field__label">simulation_terms</p>
              <pre class="admin-code-block">{{ termsPreview.simulation }}</pre>
            </div>
          </div>
        </template>

        <form v-else class="admin-form" @submit.prevent="submitEdit">
          <label class="admin-field">
            <span>display_name</span>
            <input v-model="editForm.displayName" class="admin-input" required />
          </label>
          <label class="admin-field">
            <span>description</span>
            <textarea v-model="editForm.description" class="admin-input" rows="3" />
          </label>
          <label class="admin-field">
            <span>risk_level</span>
            <select v-model="editForm.riskLevel" class="admin-input">
              <option value="">미설정</option>
              <option v-for="opt in RISK_LEVEL_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label class="admin-field">
            <span>status</span>
            <select v-model="editForm.status" class="admin-input">
              <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label class="admin-field">
            <span>simulation_terms (JSON)</span>
            <textarea
              v-model="editForm.simulationTermsText"
              class="admin-input admin-input--mono"
              rows="10"
              spellcheck="false"
            />
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

    <div v-if="showImport" class="admin-modal" role="dialog" aria-modal="true">
      <div class="admin-modal__backdrop" @click="closeImport" />
      <div class="admin-modal__panel">
        <h3 class="admin-card__title">원천 금융상품 가져오기</h3>
        <p class="admin-page__desc">
          서버가 외부 API를 호출해 비공개(INACTIVE) 상태로 등록합니다. 가명·공개는 수정에서
          설정하세요.
        </p>
        <form class="admin-form" @submit.prevent="submitImport">
          <label class="admin-field">
            <span>source_provider</span>
            <select v-model="importForm.sourceProvider" class="admin-input" required>
              <option v-for="opt in SOURCE_PROVIDER_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label class="admin-field">
            <span>reference_at</span>
            <input v-model="importForm.referenceAt" class="admin-input" type="datetime-local" />
          </label>
          <div class="admin-form__actions">
            <button type="button" class="admin-btn" :disabled="importing" @click="closeImport">
              취소
            </button>
            <button type="submit" class="admin-btn admin-btn--primary" :disabled="importing">
              {{ importing ? '가져오는 중…' : '가져오기' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.admin-terms {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.admin-code-block {
  margin: 4px 0 0;
  padding: 10px;
  overflow: auto;
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  background: #f9fafb;
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-wrap;
}

.admin-input--mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
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

.admin-field__label {
  margin: 0;
  font-size: 12px;
  color: var(--admin-text-muted);
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
  width: min(480px, calc(100vw - 32px));
  padding: 20px;
  border-radius: var(--admin-radius);
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
}
</style>
