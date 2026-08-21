<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import TransactionListItem from '@/components/portfolio/TransactionListItem.vue'
import ScrollReveal from '@/components/ScrollReveal.vue'
import PortfolioModal from '@/components/portfolio/PortfolioModal.vue'
import TransactionDetailModal from '@/components/portfolio/TransactionDetailModal.vue'

const store = usePortfolioStore()

// "맨 위로" 버튼. 이 화면의 루트가 스크롤 컨테이너라, 버튼을 그 안의 평범한 자식으로 두면
// 스크롤할 때 같이 흘러가버린다. 그래서 바깥에 position:absolute인 비스크롤 래퍼를 하나
// 더 두고, 그 안에 스크롤 컨테이너(ref로 잡음)와 버튼을 형제로 배치한다.
const scrollContainer = ref(null)
const showScrollTopButton = ref(false)
const SCROLL_TOP_THRESHOLD = 150 // 이 px만큼 내려가야 버튼이 나타난다.

const handleScroll = () => {
  const el = scrollContainer.value
  if (!el) return
  showScrollTopButton.value = el.scrollTop > SCROLL_TOP_THRESHOLD
}

const scrollToTop = () => {
  scrollContainer.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

// value: undefined = 필터 없음(전체). GET /transactions의 type 쿼리와 1:1 대응.
const FILTERS = [
  { value: undefined, label: '전체' },
  { value: 'BUY', label: '매수' },
  { value: 'SELL', label: '매도' },
  { value: 'INTEREST', label: '이자' },
  { value: 'MATURITY', label: '만기' },
]

const activeFilter = ref(FILTERS[0])
const isLoadingMore = ref(false)

onMounted(() => {
  store.fetchTransactions({ type: activeFilter.value.value })
})

const selectFilter = (filter) => {
  if (filter.value === activeFilter.value.value) return
  activeFilter.value = filter
  store.fetchTransactions({ type: filter.value })
}

// next_cursor가 있는 동안만 "더 보기"를 보여준다(문서 기준: 다음 페이지 없으면 null).
const canLoadMore = computed(() => Boolean(store.transactionsNextCursor))

const loadMore = async () => {
  if (!canLoadMore.value || isLoadingMore.value) return
  isLoadingMore.value = true
  try {
    await store.fetchTransactions({
      type: activeFilter.value.value,
      cursor: store.transactionsNextCursor,
      append: true,
    })
  } finally {
    isLoadingMore.value = false
  }
}

const transactionDate = (transaction) => {
  const raw = transaction.isScheduled ? transaction.scheduledAt : transaction.processedAt
  return raw ? new Date(raw) : null
}

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

// 매수만 현금이 나가고 나머지(매도·이자·만기 등)는 들어온다 — TransactionListItem.vue의
// OUTFLOW_TYPES와 동일한 기준. 캘린더 점 색을 매수(빨강)/매도 등 유입(초록)으로 구분하는 데 쓴다.
const OUTFLOW_TYPES = new Set(['BUY'])

// --- 캘린더(주 단위 고정) ---
// 서버 API(GET /portfolios/current/transactions)엔 날짜 범위 파라미터가 없어서(type/cursor/size만
// 지원) 특정 날짜를 서버에 바로 물어볼 수 없다. 대신 이미 불러온 목록 안에서 달력을 그리고,
// 이전 주로 넘어갈 때 그 주 시작일 이전 데이터가 아직 없으면 "더 보기"를 자동으로 몇 번 더
// 당겨서 채운다(무한 로딩 방지용 안전장치 있음).
const anchorDate = ref(new Date()) // 지금 보고 있는 주 안의 아무 날짜나(기준점)
const selectedDate = ref(null) // Date | null — 모달에 띄울 날짜
const isCalendarLoading = ref(false)

function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - d.getDay()) // 일요일 시작
  return d
}

const periodLabel = computed(() => {
  const start = startOfWeek(anchorDate.value)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = (d) => `${d.getMonth() + 1}.${d.getDate()}`
  return `${fmt(start)} - ${fmt(end)}`
})

// 요일 헤더는 일요일 시작 고정.
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

// 날짜별 거래 요약 — 개수(hasTransactions)와 유형별 색(hasOutflow=매수/빨강, hasInflow=매도·이자
// 등/초록, hasNeutral=포트폴리오 초기화 같은 중립 이벤트/회색).
const daySummary = computed(() => {
  const map = new Map()
  for (const transaction of store.transactions) {
    const date = transactionDate(transaction)
    if (!date) continue
    const key = dayKey(date)
    const entry = map.get(key) ?? { hasOutflow: false, hasInflow: false, hasNeutral: false }
    if (transaction.transactionType === 'RESET') entry.hasNeutral = true
    else if (OUTFLOW_TYPES.has(transaction.transactionType)) entry.hasOutflow = true
    else entry.hasInflow = true
    map.set(key, entry)
  }
  return map
})

const dayKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

const buildCell = (date, today) => ({
  date,
  day: date.getDate(),
  summary: daySummary.value.get(dayKey(date)) ?? null,
  isToday: isSameDay(date, today),
})

const calendarCells = computed(() => {
  const today = new Date()
  const start = startOfWeek(anchorDate.value)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return buildCell(date, today)
  })
})

// 대상 기간의 시작일보다 오래된 거래가 아직 하나도 안 불려왔으면, canLoadMore인 동안 몇 번 더
// 당겨온다. 최대 10페이지까지만(무한 로딩 방지) — 그래도 부족하면 "더 보기"를 눌러야 한다.
const ensurePeriodLoaded = async (periodStart) => {
  isCalendarLoading.value = true
  try {
    let guard = 0
    while (canLoadMore.value && guard < 10) {
      const oldest = store.transactions[store.transactions.length - 1]
      const oldestDate = oldest ? transactionDate(oldest) : null
      if (oldestDate && oldestDate <= periodStart) break
      await loadMore()
      guard += 1
    }
  } finally {
    isCalendarLoading.value = false
  }
}

const goToPeriod = async (offset) => {
  const next = new Date(anchorDate.value)
  next.setDate(next.getDate() + offset * 7)
  anchorDate.value = next
  if (offset < 0) await ensurePeriodLoaded(startOfWeek(next))
}

const selectDay = (cell) => {
  if (!cell) return
  selectedDate.value = cell.date
}

const closeDayModal = () => {
  selectedDate.value = null
}

// 상세 모달은 화면당 딱 하나만 관리한다(전체 목록 카드든, 날짜 모달 안 카드든 전부 이걸로 연결).
// 날짜 모달이 열려있는 상태에서 카드를 누르면, 그 위에 또 모달을 쌓는 대신 날짜 모달을 닫고
// 상세 모달로 바꿔준다 — 안 그러면 모달이 두 겹으로 겹쳐서 "두 번 뜨는" 것처럼 보인다.
const selectedTransaction = ref(null)
const openTransactionDetail = (transaction) => {
  selectedDate.value = null
  selectedTransaction.value = transaction
}
const closeTransactionDetail = () => {
  selectedTransaction.value = null
}

// 선택한 날짜의 거래만 모달에 보여준다.
const selectedDayTransactions = computed(() => {
  if (!selectedDate.value) return []
  return store.transactions.filter((transaction) => {
    const date = transactionDate(transaction)
    return date && isSameDay(date, selectedDate.value)
  })
})

// 날짜별로 묶어서 섹션 헤더("오늘"/"8월 21일")를 붙인다 — 기간 단위로 훑어보기 쉽게.
// store.transactions는 이미 최신순으로 오므로, 순서를 유지하며 날짜가 바뀔 때만 새 그룹을 연다.
const dateSectionLabel = (date) => {
  const now = new Date()
  if (isSameDay(date, now)) return '오늘'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameDay(date, yesterday)) return '어제'
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
}

const groupedTransactions = computed(() => {
  const groups = []
  let currentKey = null

  for (const transaction of store.transactions) {
    const date = transactionDate(transaction)
    const key = date ? dayKey(date) : 'unknown'

    if (key !== currentKey) {
      groups.push({
        key,
        label: date ? dateSectionLabel(date) : '날짜 미정',
        items: [],
      })
      currentKey = key
    }
    groups[groups.length - 1].items.push(transaction)
  }

  return groups
})
</script>

<template>
  <div class="absolute inset-0">
    <div
      ref="scrollContainer"
      data-scroll-reveal-root
      class="nav-scroll-pad absolute inset-0 flex flex-col gap-3 overflow-y-auto overscroll-contain"
      @scroll="handleScroll"
    >
      <!-- ScrollReveal 밖에 둔다 — ScrollReveal이 인라인 transform을 걸어서, 그 안에서는
           position: sticky가 스크롤 컨테이너 기준이 아니라 transform이 만든 새 컨테이닝 블록
           기준으로 깨진다. -->
      <div class="cork-board-patch sticky top-0 z-10 py-1">
        <div class="flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="filter in FILTERS"
            :key="filter.label"
            type="button"
            class="shrink-0 rounded-full px-3 py-1.5 font-serif text-xs font-bold transition-colors"
            :class="
              activeFilter.value === filter.value
                ? 'bg-[#c17f24] text-[#fff8ec]'
                : 'border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] text-[rgba(44,24,16,0.55)]'
            "
            @click="selectFilter(filter)"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <ScrollReveal>
        <div class="rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] p-3">
          <div class="flex items-center justify-between">
            <button
              type="button"
              class="rounded-full px-2 py-1 font-serif text-sm text-[#c17f24]"
              aria-label="이전 주"
              @click="goToPeriod(-1)"
            >
              ‹
            </button>
            <p class="font-serif text-sm font-bold text-[#2c1810]">
              {{ periodLabel }}
              <span
                v-if="isCalendarLoading"
                class="font-serif text-[10px] font-normal text-[rgba(41,33,26,0.4)]"
              >
                불러오는 중…
              </span>
            </p>
            <button
              type="button"
              class="rounded-full px-2 py-1 font-serif text-sm text-[#c17f24]"
              aria-label="다음 주"
              @click="goToPeriod(1)"
            >
              ›
            </button>
          </div>

          <div class="mt-2 grid grid-cols-7 gap-1">
            <p
              v-for="label in WEEKDAY_LABELS"
              :key="label"
              class="py-1 text-center font-serif text-[10px] font-bold text-[rgba(41,33,26,0.4)]"
            >
              {{ label }}
            </p>

            <button
              v-for="(cell, index) in calendarCells"
              :key="index"
              type="button"
              class="relative aspect-square rounded-[3px] font-serif text-[11px] transition-colors"
              :class="
                cell.isToday
                  ? 'border-[1px] border-[#c17f24] text-[#2c1810]'
                  : 'text-[#2c1810] hover:bg-[rgba(193,127,36,0.1)]'
              "
              @click="selectDay(cell)"
            >
              {{ cell.day }}
              <span
                v-if="cell.summary"
                class="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 gap-[3px]"
              >
                <span v-if="cell.summary.hasOutflow" class="size-1 rounded-full bg-[#c0433f]" />
                <span v-if="cell.summary.hasInflow" class="size-1 rounded-full bg-[#1D9E75]" />
                <span
                  v-if="cell.summary.hasNeutral"
                  class="size-1 rounded-full bg-[rgba(41,33,26,0.4)]"
                />
              </span>
            </button>
          </div>

          <div
            class="mt-2 flex items-center gap-3 font-serif text-[10px] text-[rgba(41,33,26,0.45)]"
          >
            <span class="flex items-center gap-1"
              ><span class="size-1.5 rounded-full bg-[#c0433f]" />매수</span
            >
            <span class="flex items-center gap-1"
              ><span class="size-1.5 rounded-full bg-[#1D9E75]" />매도·이자·만기 등</span
            >
          </div>
        </div>
      </ScrollReveal>

      <p v-if="store.error" class="font-serif text-sm text-[#c0433f]">{{ store.error }}</p>

      <template v-if="groupedTransactions.length">
        <div v-for="group in groupedTransactions" :key="group.key">
          <p class="mb-1.5 px-1 font-serif text-[11px] font-bold text-[rgba(41,33,26,0.45)]">
            {{ group.label }}
          </p>
          <div
            class="rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] p-4 shadow-[0_4px_12px_rgba(44,24,16,0.1)]"
          >
            <ul class="flex flex-col gap-2.5">
              <TransactionListItem
                v-for="transaction in group.items"
                :key="transaction.transactionId"
                :transaction="transaction"
                @select="openTransactionDetail"
              />
            </ul>
          </div>
        </div>
      </template>

      <p v-else-if="store.isLoading" class="font-serif text-sm text-[rgba(41,33,26,0.45)]">
        불러오는 중…
      </p>
      <div v-else class="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <p class="font-serif text-base text-[rgba(41,33,26,0.5)]">해당 조건의 이력이 없어요.</p>
      </div>

      <button
        v-if="canLoadMore"
        type="button"
        class="rounded-xl border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] py-2.5 font-serif text-xs font-bold text-[#c17f24] disabled:opacity-40"
        :disabled="isLoadingMore"
        @click="loadMore"
      >
        {{ isLoadingMore ? '불러오는 중…' : '더 보기' }}
      </button>
    </div>

    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <button
        v-if="showScrollTopButton"
        type="button"
        class="absolute right-4 z-20 flex size-11 items-center justify-center rounded-full border-[0.5px] border-[rgba(193,127,36,0.35)] bg-[#c17f24] text-[#fff8ec] shadow-[0_4px_12px_rgba(44,24,16,0.25)]"
        style="bottom: calc(clamp(52px, 8dvh, 72px) + 16px)"
        aria-label="맨 위로"
        @click="scrollToTop"
      >
        <span class="text-lg leading-none">↑</span>
      </button>
    </Transition>

    <PortfolioModal
      v-if="selectedDate"
      variant="light"
      :title="
        selectedDate.toLocaleDateString('ko-KR', {
          month: 'long',
          day: 'numeric',
          weekday: 'short',
        })
      "
      @close="closeDayModal"
    >
      <ul
        v-if="selectedDayTransactions.length"
        class="flex max-h-[60vh] flex-col gap-2.5 overflow-y-auto"
      >
        <TransactionListItem
          v-for="transaction in selectedDayTransactions"
          :key="transaction.transactionId"
          :transaction="transaction"
          @select="openTransactionDetail"
        />
      </ul>
      <p v-else class="py-8 text-center font-serif text-base text-[rgba(41,33,26,0.5)]">
        이 날은 거래 내역이 없어요.
      </p>
    </PortfolioModal>

    <TransactionDetailModal
      v-if="selectedTransaction"
      :transaction="selectedTransaction"
      @close="closeTransactionDetail"
    />
  </div>
</template>
