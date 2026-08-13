import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/admin/productApi.js', () => ({
  getAdminFinancialProducts: vi.fn(),
  importAdminFinancialProducts: vi.fn(),
  patchAdminFinancialProduct: vi.fn(),
}))

import {
  getAdminFinancialProducts,
  importAdminFinancialProducts,
  patchAdminFinancialProduct,
} from '@/api/admin/productApi.js'
import {
  fetchAdminProducts,
  formatAdminProductError,
  importAdminProducts,
  mapAdminProduct,
  updateAdminProduct,
} from '@/services/adminProductService.js'

describe('adminProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('snake_case 목록 응답을 매핑한다', async () => {
    getAdminFinancialProducts.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              product_id: 25,
              display_name: '푸른나무 정기예금',
              asset_type: 'DEPOSIT_SAVINGS',
              description: '설명',
              risk_level: 'LOW',
              source_provider: 'FINLIFE',
              source_product_code: 'FIN-001',
              source_product_name: 'OO은행 정기예금',
              source_reference_at: '2026-08-01T00:00:00Z',
              real_terms: { maturity_months: 6 },
              simulation_terms: { service_maturity_hours: 144 },
              status: 'ACTIVE',
            },
          ],
          next_cursor: 'product-25',
        },
      },
    })

    const page = await fetchAdminProducts({ assetType: 'DEPOSIT_SAVINGS', status: 'ACTIVE' })

    expect(getAdminFinancialProducts).toHaveBeenCalledWith({
      asset_type: 'DEPOSIT_SAVINGS',
      status: 'ACTIVE',
    })
    expect(page.nextCursor).toBe('product-25')
    expect(page.items[0]).toMatchObject({
      productId: 25,
      displayName: '푸른나무 정기예금',
      assetType: 'DEPOSIT_SAVINGS',
      riskLevel: 'LOW',
      sourceProductCode: 'FIN-001',
      status: 'ACTIVE',
    })
  })

  it('camelCase 단건도 매핑한다', () => {
    expect(
      mapAdminProduct({
        productId: 1,
        displayName: 'A',
        assetType: 'STOCK',
        status: 'INACTIVE',
      }),
    ).toMatchObject({ productId: 1, displayName: 'A', assetType: 'STOCK', status: 'INACTIVE' })
  })

  it('import 요청은 live DTO snake_case body를 보낸다', async () => {
    importAdminFinancialProducts.mockResolvedValue({
      data: {
        data: {
          imported_count: 2,
          skipped_count: 1,
          product_ids: [10, 11],
          reference_at: '2026-08-13T00:00:00Z',
        },
      },
    })

    const result = await importAdminProducts({
      sourceProvider: 'FSS_FINLIFE',
      referenceAt: '2026-08-13T00:00:00.000Z',
    })

    expect(importAdminFinancialProducts).toHaveBeenCalledWith({
      source_provider: 'FSS_FINLIFE',
      reference_at: '2026-08-13T00:00:00.000Z',
    })
    expect(result).toEqual({
      importedCount: 2,
      skippedCount: 1,
      productIds: [10, 11],
      referenceAt: '2026-08-13T00:00:00Z',
    })
  })

  it('patch 요청은 live DTO snake_case body를 보낸다', async () => {
    patchAdminFinancialProduct.mockResolvedValue({
      data: {
        data: {
          product_id: 25,
          display_name: '새 이름',
          asset_type: 'BOND',
          status: 'ACTIVE',
          risk_level: 'MEDIUM',
        },
      },
    })

    const updated = await updateAdminProduct(25, {
      displayName: '새 이름',
      riskLevel: 'MEDIUM',
      status: 'ACTIVE',
      simulationTerms: { service_maturity_hours: 72 },
    })

    expect(patchAdminFinancialProduct).toHaveBeenCalledWith(25, {
      display_name: '새 이름',
      risk_level: 'MEDIUM',
      status: 'ACTIVE',
      simulation_terms: { service_maturity_hours: 72 },
    })
    expect(updated.displayName).toBe('새 이름')
    expect(updated.status).toBe('ACTIVE')
  })

  it('INVALID_SOURCE_PRODUCT는 BE 메시지를 우선한다', () => {
    const err = new Error('토스증권 인증 정보가 설정되지 않았습니다 (TOSSINVEST_CLIENT_ID/SECRET).')
    err.code = 'INVALID_SOURCE_PRODUCT'
    expect(formatAdminProductError(err)).toBe(
      '토스증권 인증 정보가 설정되지 않았습니다 (TOSSINVEST_CLIENT_ID/SECRET).',
    )
  })
})
