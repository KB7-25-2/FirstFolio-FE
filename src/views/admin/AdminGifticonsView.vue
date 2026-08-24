<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  CATEGORY_OPTIONS,
  CODE_STATUS_LABELS,
  CODE_STATUS_OPTIONS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUS_OPTIONS,
  STOCK_STATUS_LABELS,
  categoryLabel,
  createAdminGifticonProductService,
  fetchAdminGifticonCodes,
  fetchAdminGifticonProducts,
  formatAdminGifticonError,
  registerAdminGifticonCodes,
  updateAdminGifticonProduct,
  voidAdminGifticonCodeService,
} from '@/services/adminGifticonService.js'

const loading = ref(false)
const loadingMore = ref(false)
const saving = ref(false)
const creating = ref(false)
const codesLoading = ref(false)
const codesLoadingMore = ref(false)
const registeringCodes = ref(false)
const voidingCodeId = ref(null)
const errorMessage = ref('')
const notice = ref('')

const products = ref([])
const nextCursor = ref(null)
const filterStatus = ref('')

/** @type {import('vue').Ref<import('@/types/adminGifticon.js').AdminGifticonProduct | null>} */
const selected = ref(null)
const showCreate = ref(false)
const showEdit = ref(false)
const showRegisterCodes = ref(false)

const codes = ref([])
const codesNextCursor = ref(null)
const filterCodeStatus = ref('')

const createForm = ref(emptyProductForm())
const editForm = ref(emptyProductForm())
const registerForm = ref({ codesText: '', expiresAt: '' })

function emptyProductForm() {
  return {
    name: '',
    brandName: '',
    category: 'CAFE',
    faceValueKrw: 5000,
    requiredPoints: 5000,
    imageUrl: '',
    status: 'ON_SALE',
  }
}

const flash = (message) => {
  notice.value = message
  window.setTimeout(() => {
    if (notice.value === message) notice.value = ''
  }, 3200)
}

const setError = (error) => {
  errorMessage.value = formatAdminGifticonError(error)
}

const buildListFilters = (cursor = null) => ({
  status: filterStatus.value || undefined,
  cursor: cursor || undefined,
})

const loadProducts = async () => {
  loading.value = true
  errorMessage.value = ''
  nextCursor.value = null
  try {
    const result = await fetchAdminGifticonProducts(buildListFilters())
    products.value = result.items
    nextCursor.value = result.nextCursor
    if (selected.value) {
      const refreshed = result.items.find(
        (item) => item.gifticonProductId === selected.value.gifticonProductId,
      )
      selected.value = refreshed ?? selected.value
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
    const result = await fetchAdminGifticonProducts(buildListFilters(nextCursor.value))
    const seen = new Set(products.value.map((item) => item.gifticonProductId))
    products.value = [
      ...products.value,
      ...result.items.filter((item) => !seen.has(item.gifticonProductId)),
    ]
    nextCursor.value = result.nextCursor
  } catch (error) {
    setError(error)
  } finally {
    loadingMore.value = false
  }
}

const loadCodes = async () => {
  if (!selected.value) return
  codesLoading.value = true
  errorMessage.value = ''
  codesNextCursor.value = null
  try {
    const result = await fetchAdminGifticonCodes(selected.value.gifticonProductId, {
      status: filterCodeStatus.value || undefined,
    })
    codes.value = result.items
    codesNextCursor.value = result.nextCursor
  } catch (error) {
    setError(error)
    codes.value = []
    codesNextCursor.value = null
  } finally {
    codesLoading.value = false
  }
}

const loadMoreCodes = async () => {
  if (!selected.value || !codesNextCursor.value || codesLoadingMore.value) return
  codesLoadingMore.value = true
  errorMessage.value = ''
  try {
    const result = await fetchAdminGifticonCodes(selected.value.gifticonProductId, {
      status: filterCodeStatus.value || undefined,
      cursor: codesNextCursor.value,
    })
    const seen = new Set(codes.value.map((item) => item.gifticonCodeId))
    codes.value = [...codes.value, ...result.items.filter((item) => !seen.has(item.gifticonCodeId))]
    codesNextCursor.value = result.nextCursor
  } catch (error) {
    setError(error)
  } finally {
    codesLoadingMore.value = false
  }
}

const selectProduct = (product) => {
  selected.value = product
  showEdit.value = false
  errorMessage.value = ''
  loadCodes()
}

const openCreate = () => {
  createForm.value = emptyProductForm()
  showCreate.value = true
  errorMessage.value = ''
}

const closeCreate = () => {
  showCreate.value = false
}

const submitCreate = async () => {
  creating.value = true
  errorMessage.value = ''
  try {
    const created = await createAdminGifticonProductService({
      name: createForm.value.name,
      brandName: createForm.value.brandName || undefined,
      category: createForm.value.category,
      faceValueKrw: Number(createForm.value.faceValueKrw),
      requiredPoints: Number(createForm.value.requiredPoints),
      imageUrl: createForm.value.imageUrl || undefined,
      status: createForm.value.status,
    })
    products.value = [
      created,
      ...products.value.filter((p) => p.gifticonProductId !== created.gifticonProductId),
    ]
    selected.value = created
    closeCreate()
    flash(`#${created.gifticonProductId} 상품 등록 완료`)
    await loadCodes()
  } catch (error) {
    setError(error)
  } finally {
    creating.value = false
  }
}

const openEdit = () => {
  if (!selected.value) return
  editForm.value = {
    name: selected.value.name ?? '',
    brandName: selected.value.brandName ?? '',
    category: selected.value.category ?? 'CAFE',
    faceValueKrw: selected.value.faceValueKrw ?? 0,
    requiredPoints: selected.value.requiredPoints ?? 0,
    imageUrl: selected.value.imageUrl ?? '',
    status: selected.value.status ?? 'ON_SALE',
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
    const updated = await updateAdminGifticonProduct(selected.value.gifticonProductId, {
      name: editForm.value.name.trim(),
      brandName: editForm.value.brandName.trim() || null,
      category: editForm.value.category,
      faceValueKrw: Number(editForm.value.faceValueKrw),
      requiredPoints: Number(editForm.value.requiredPoints),
      imageUrl: editForm.value.imageUrl.trim() || null,
      status: editForm.value.status,
    })
    products.value = products.value.map((item) =>
      item.gifticonProductId === updated.gifticonProductId ? updated : item,
    )
    selected.value = updated
    closeEdit()
    flash(`#${updated.gifticonProductId} 수정 완료`)
  } catch (error) {
    setError(error)
  } finally {
    saving.value = false
  }
}

const openRegisterCodes = () => {
  registerForm.value = {
    codesText: '',
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  }
  showRegisterCodes.value = true
  errorMessage.value = ''
}

const closeRegisterCodes = () => {
  showRegisterCodes.value = false
}

const submitRegisterCodes = async () => {
  if (!selected.value) return
  registeringCodes.value = true
  errorMessage.value = ''
  try {
    const lines = registerForm.value.codesText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
    if (!lines.length) {
      errorMessage.value = '등록할 코드를 한 줄에 하나씩 입력하세요.'
      return
    }
    const expiresAt = registerForm.value.expiresAt
    if (!expiresAt) {
      errorMessage.value = '만료 시각(expires_at)을 입력하세요.'
      return
    }
    const parsed = new Date(expiresAt)
    if (Number.isNaN(parsed.getTime())) {
      errorMessage.value = '만료 시각 형식이 올바르지 않습니다.'
      return
    }
    const isoExpires = parsed.toISOString()
    const result = await registerAdminGifticonCodes(
      selected.value.gifticonProductId,
      lines.map((code) => ({ code, expiresAt: isoExpires })),
    )
    closeRegisterCodes()
    flash(`${result.createdCount}개 코드 등록 완료`)
    await Promise.all([loadProducts(), loadCodes()])
    if (selected.value) {
      const refreshed = products.value.find(
        (item) => item.gifticonProductId === selected.value.gifticonProductId,
      )
      if (refreshed) selected.value = refreshed
    }
  } catch (error) {
    setError(error)
  } finally {
    registeringCodes.value = false
  }
}

const voidCode = async (code) => {
  if (code.status !== 'AVAILABLE') return
  if (!window.confirm(`코드 ${code.codeMasked}을(를) 폐기할까요?`)) return
  voidingCodeId.value = code.gifticonCodeId
  errorMessage.value = ''
  try {
    await voidAdminGifticonCodeService(code.gifticonCodeId, '관리자 폐기')
    flash(`#${code.gifticonCodeId} 코드 폐기 완료`)
    await Promise.all([loadProducts(), loadCodes()])
    if (selected.value) {
      const refreshed = products.value.find(
        (item) => item.gifticonProductId === selected.value.gifticonProductId,
      )
      if (refreshed) selected.value = refreshed
    }
  } catch (error) {
    setError(error)
  } finally {
    voidingCodeId.value = null
  }
}

const formatDateTime = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('ko-KR')
}

const selectedSummary = computed(() => {
  if (!selected.value) return null
  return `${categoryLabel(selected.value.category)} · ${selected.value.faceValueKrw.toLocaleString('ko-KR')}원 · ${selected.value.requiredPoints.toLocaleString('ko-KR')}P`
})

watch(filterStatus, () => {
  selected.value = null
  showEdit.value = false
  codes.value = []
  loadProducts()
})

watch(filterCodeStatus, () => {
  if (selected.value) loadCodes()
})

onMounted(() => {
  loadProducts()
})
</script>

<template>
  <div class="admin-page admin-page--wide">
    <div class="admin-page__header">
      <div>
        <p class="admin-page__kicker">Gifticon Market</p>
        <h2 class="admin-page__title">기프티콘 관리</h2>
        <p class="admin-page__desc">
          상품 메타(액면가·교환 포인트·판매 상태)를 관리하고, 교환 코드를 등록·폐기합니다. 액면가
          (face_value_krw)와 교환 포인트(required_points)는 별도 필드입니다.
        </p>
      </div>
      <button
        type="button"
        class="admin-btn admin-btn--primary"
        :disabled="creating || saving"
        @click="openCreate"
      >
        상품 등록
      </button>
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
            <option value="">전체</option>
            <option v-for="opt in PRODUCT_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
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
      <section class="admin-card admin-card--flush admin-gifticon-list-panel">
        <h3 class="admin-card__title">상품 목록</h3>
        <div class="admin-gifticon-list-scroll" role="region" aria-label="기프티콘 상품 목록">
          <p v-if="loading" class="admin-muted">불러오는 중…</p>
          <p v-else-if="!products.length" class="admin-muted">등록된 상품이 없습니다.</p>
          <ul v-else class="admin-list admin-list--scroll">
            <li
              v-for="product in products"
              :key="product.gifticonProductId"
              class="admin-list__item admin-list__item--clickable"
              :class="{ 'is-selected': selected?.gifticonProductId === product.gifticonProductId }"
              @click="selectProduct(product)"
            >
              <div>
                <p class="admin-list__label">
                  {{ product.name || '(이름 없음)' }}
                  <span class="admin-code">#{{ product.gifticonProductId }}</span>
                </p>
                <p class="admin-list__meta">
                  {{ categoryLabel(product.category) }} ·
                  {{ PRODUCT_STATUS_LABELS[product.status] || product.status }} ·
                  {{ STOCK_STATUS_LABELS[product.stockStatus] || product.stockStatus }}
                </p>
                <p class="admin-list__meta">
                  {{ product.faceValueKrw.toLocaleString('ko-KR') }}원 ·
                  {{ product.requiredPoints.toLocaleString('ko-KR') }}P · 재고
                  {{ product.availableCodeCount }}
                </p>
              </div>
            </li>
          </ul>
        </div>
        <button
          v-if="nextCursor && products.length"
          type="button"
          class="admin-btn admin-gifticon-list-more"
          :disabled="loadingMore"
          @click="loadMore"
        >
          {{ loadingMore ? '불러오는 중…' : '더 보기' }}
        </button>
      </section>

      <section class="admin-card admin-card--flush">
        <div class="admin-page__header" style="margin-bottom: 12px">
          <h3 class="admin-card__title" style="margin: 0">상품 상세</h3>
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
              <dt>gifticon_product_id</dt>
              <dd>{{ selected.gifticonProductId }}</dd>
            </div>
            <div>
              <dt>name</dt>
              <dd>{{ selected.name || '—' }}</dd>
            </div>
            <div>
              <dt>brand_name</dt>
              <dd>{{ selected.brandName || '—' }}</dd>
            </div>
            <div>
              <dt>category</dt>
              <dd>{{ categoryLabel(selected.category) }}</dd>
            </div>
            <div>
              <dt>face_value_krw</dt>
              <dd>{{ selected.faceValueKrw.toLocaleString('ko-KR') }}원</dd>
            </div>
            <div>
              <dt>required_points</dt>
              <dd>{{ selected.requiredPoints.toLocaleString('ko-KR') }}P</dd>
            </div>
            <div>
              <dt>status</dt>
              <dd>{{ PRODUCT_STATUS_LABELS[selected.status] || selected.status }}</dd>
            </div>
            <div>
              <dt>stock_status</dt>
              <dd>{{ STOCK_STATUS_LABELS[selected.stockStatus] || selected.stockStatus }}</dd>
            </div>
            <div>
              <dt>available / assigned / void</dt>
              <dd>
                {{ selected.availableCodeCount }} / {{ selected.assignedCodeCount }} /
                {{ selected.voidCodeCount }}
              </dd>
            </div>
            <div>
              <dt>image_url</dt>
              <dd>{{ selected.imageUrl || '—' }}</dd>
            </div>
            <div>
              <dt>created_at</dt>
              <dd>{{ formatDateTime(selected.createdAt) }}</dd>
            </div>
            <div>
              <dt>updated_at</dt>
              <dd>{{ formatDateTime(selected.updatedAt) }}</dd>
            </div>
          </dl>

          <div class="admin-codes-section">
            <div class="admin-page__header" style="margin: 20px 0 12px">
              <div>
                <h4 class="admin-card__title" style="margin: 0">교환 코드</h4>
                <p v-if="selectedSummary" class="admin-muted">{{ selectedSummary }}</p>
              </div>
              <button
                type="button"
                class="admin-btn admin-btn--primary"
                :disabled="registeringCodes"
                @click="openRegisterCodes"
              >
                코드 등록
              </button>
            </div>

            <div class="admin-filters">
              <label class="admin-field">
                <span>code status</span>
                <select v-model="filterCodeStatus" class="admin-input">
                  <option v-for="opt in CODE_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </label>
              <button type="button" class="admin-btn" :disabled="codesLoading" @click="loadCodes">
                새로고침
              </button>
            </div>

            <p v-if="codesLoading" class="admin-muted">코드 불러오는 중…</p>
            <p v-else-if="!codes.length" class="admin-muted">등록된 코드가 없습니다.</p>
            <ul v-else class="admin-code-list">
              <li v-for="code in codes" :key="code.gifticonCodeId" class="admin-code-list__item">
                <div>
                  <p class="admin-list__label">
                    {{ code.codeMasked }}
                    <span class="admin-code">#{{ code.gifticonCodeId }}</span>
                  </p>
                  <p class="admin-list__meta">
                    {{ CODE_STATUS_LABELS[code.status] || code.status }} · 만료
                    {{ formatDateTime(code.expiresAt) }}
                  </p>
                </div>
                <button
                  v-if="code.status === 'AVAILABLE'"
                  type="button"
                  class="admin-btn admin-btn--danger admin-btn--sm"
                  :disabled="voidingCodeId === code.gifticonCodeId"
                  @click="voidCode(code)"
                >
                  {{ voidingCodeId === code.gifticonCodeId ? '폐기 중…' : '폐기' }}
                </button>
              </li>
            </ul>
            <button
              v-if="codesNextCursor && codes.length"
              type="button"
              class="admin-btn"
              :disabled="codesLoadingMore"
              @click="loadMoreCodes"
            >
              {{ codesLoadingMore ? '불러오는 중…' : '코드 더 보기' }}
            </button>
          </div>
        </template>

        <form v-else class="admin-form" @submit.prevent="submitEdit">
          <label class="admin-field">
            <span>name</span>
            <input v-model="editForm.name" class="admin-input" required />
          </label>
          <label class="admin-field">
            <span>brand_name</span>
            <input v-model="editForm.brandName" class="admin-input" />
          </label>
          <label class="admin-field">
            <span>category</span>
            <select v-model="editForm.category" class="admin-input">
              <option v-for="opt in CATEGORY_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label class="admin-field">
            <span>face_value_krw (원화 액면)</span>
            <input
              v-model.number="editForm.faceValueKrw"
              type="number"
              min="1"
              class="admin-input"
              required
            />
          </label>
          <label class="admin-field">
            <span>required_points (교환 포인트)</span>
            <input
              v-model.number="editForm.requiredPoints"
              type="number"
              min="1"
              class="admin-input"
              required
            />
          </label>
          <label class="admin-field">
            <span>image_url</span>
            <input v-model="editForm.imageUrl" class="admin-input" placeholder="https://…" />
          </label>
          <label class="admin-field">
            <span>status</span>
            <select v-model="editForm.status" class="admin-input">
              <option v-for="opt in PRODUCT_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
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

    <div v-if="showCreate" class="admin-modal" role="dialog" aria-modal="true">
      <div class="admin-modal__backdrop" @click="closeCreate" />
      <div class="admin-modal__panel admin-modal__panel--wide">
        <h3 class="admin-card__title">기프티콘 상품 등록</h3>
        <p class="admin-page__desc">
          액면가와 교환 포인트는 별도로 입력합니다. 코드는 상품 생성 후 상세 화면에서 등록하세요.
        </p>
        <form class="admin-form" @submit.prevent="submitCreate">
          <label class="admin-field">
            <span>name</span>
            <input v-model="createForm.name" class="admin-input" required />
          </label>
          <label class="admin-field">
            <span>brand_name</span>
            <input v-model="createForm.brandName" class="admin-input" />
          </label>
          <label class="admin-field">
            <span>category</span>
            <select v-model="createForm.category" class="admin-input">
              <option v-for="opt in CATEGORY_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label class="admin-field">
            <span>face_value_krw (원화 액면)</span>
            <input
              v-model.number="createForm.faceValueKrw"
              type="number"
              min="1"
              class="admin-input"
              required
            />
          </label>
          <label class="admin-field">
            <span>required_points (교환 포인트)</span>
            <input
              v-model.number="createForm.requiredPoints"
              type="number"
              min="1"
              class="admin-input"
              required
            />
          </label>
          <label class="admin-field">
            <span>image_url</span>
            <input v-model="createForm.imageUrl" class="admin-input" placeholder="https://…" />
          </label>
          <label class="admin-field">
            <span>status</span>
            <select v-model="createForm.status" class="admin-input">
              <option v-for="opt in PRODUCT_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
          <div class="admin-form__actions">
            <button type="button" class="admin-btn" :disabled="creating" @click="closeCreate">
              취소
            </button>
            <button type="submit" class="admin-btn admin-btn--primary" :disabled="creating">
              {{ creating ? '등록 중…' : '등록' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showRegisterCodes" class="admin-modal" role="dialog" aria-modal="true">
      <div class="admin-modal__backdrop" @click="closeRegisterCodes" />
      <div class="admin-modal__panel admin-modal__panel--wide">
        <h3 class="admin-card__title">교환 코드 일괄 등록</h3>
        <p class="admin-page__desc">
          한 줄에 코드 하나씩 입력하세요. 최대 100개. 만료 시각은 등록하는 모든 코드에 동일하게
          적용됩니다.
        </p>
        <form class="admin-form" @submit.prevent="submitRegisterCodes">
          <label class="admin-field">
            <span>codes (한 줄에 하나)</span>
            <textarea
              v-model="registerForm.codesText"
              class="admin-input admin-input--mono"
              rows="10"
              spellcheck="false"
              placeholder="ABC123456789&#10;DEF987654321"
              required
            />
          </label>
          <label class="admin-field">
            <span>expires_at (전체 코드 공통)</span>
            <input
              v-model="registerForm.expiresAt"
              type="datetime-local"
              class="admin-input"
              required
            />
          </label>
          <div class="admin-form__actions">
            <button
              type="button"
              class="admin-btn"
              :disabled="registeringCodes"
              @click="closeRegisterCodes"
            >
              취소
            </button>
            <button type="submit" class="admin-btn admin-btn--primary" :disabled="registeringCodes">
              {{ registeringCodes ? '등록 중…' : '등록' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-gifticon-list-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.admin-gifticon-list-scroll {
  height: 480px;
  margin-top: 12px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 4px;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: #94a3b8 #e2e8f0;
}

.admin-gifticon-list-more {
  margin-top: 12px;
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

.admin-codes-section {
  border-top: 1px solid var(--admin-border);
  padding-top: 4px;
}

.admin-code-list {
  display: grid;
  gap: 8px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.admin-code-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  background: var(--admin-surface-muted, #f8fafc);
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

.admin-modal__panel--wide {
  width: min(640px, calc(100vw - 32px));
}

.admin-btn--danger {
  color: #fff;
  background: var(--admin-danger);
  border-color: var(--admin-danger);
}

.admin-btn--sm {
  padding: 6px 10px;
  font-size: 12px;
}
</style>
