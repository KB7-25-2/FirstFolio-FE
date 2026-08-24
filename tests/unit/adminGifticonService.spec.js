import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/admin/gifticonApi.js', () => ({
  getAdminGifticonProducts: vi.fn(),
  createAdminGifticonProduct: vi.fn(),
  patchAdminGifticonProduct: vi.fn(),
  getAdminGifticonCodes: vi.fn(),
  createAdminGifticonCodes: vi.fn(),
  voidAdminGifticonCode: vi.fn(),
}))

import {
  getAdminGifticonProducts,
  createAdminGifticonProduct,
  createAdminGifticonCodes,
  patchAdminGifticonProduct,
} from '@/api/admin/gifticonApi.js'
import {
  buildCodeBatchBody,
  buildProductCreateBody,
  buildProductPatchBody,
  createAdminGifticonProductService,
  fetchAdminGifticonProducts,
  formatAdminGifticonError,
  mapAdminGifticonProduct,
  registerAdminGifticonCodes,
  updateAdminGifticonProduct,
} from '@/services/adminGifticonService.js'

describe('adminGifticonService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /admin/gifticons snake_case 목록을 매핑한다', async () => {
    getAdminGifticonProducts.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              gifticon_product_id: 6001,
              name: '아메리카노',
              brand_name: '카페',
              category: 'CAFE',
              face_value_krw: 5000,
              required_points: 7000,
              status: 'ON_SALE',
              stock_status: 'AVAILABLE',
              available_code_count: 3,
              assigned_code_count: 1,
              void_code_count: 0,
              image_url: 'https://cdn.example/gift.png',
            },
          ],
          next_cursor: 'abc',
        },
      },
    })

    const page = await fetchAdminGifticonProducts()

    expect(getAdminGifticonProducts).toHaveBeenCalledWith({
      status: undefined,
      cursor: undefined,
      size: 20,
    })
    expect(page.items[0]).toMatchObject({
      gifticonProductId: 6001,
      name: '아메리카노',
      faceValueKrw: 5000,
      requiredPoints: 7000,
      availableCodeCount: 3,
      imageUrl: 'https://cdn.example/gift.png',
    })
    expect(page.nextCursor).toBe('abc')
  })

  it('mapAdminGifticonProduct는 camelCase도 처리한다', () => {
    expect(
      mapAdminGifticonProduct({
        gifticonProductId: 1,
        name: 'A',
        faceValueKrw: 1000,
        requiredPoints: 1200,
        status: 'STOPPED',
        stockStatus: 'SOLD_OUT',
      }),
    ).toMatchObject({
      gifticonProductId: 1,
      faceValueKrw: 1000,
      requiredPoints: 1200,
      status: 'STOPPED',
      stockStatus: 'SOLD_OUT',
    })
  })

  it('buildProductCreateBody는 face_value_krw와 required_points를 분리한다', () => {
    expect(
      buildProductCreateBody({
        name: '편의점 3천원',
        category: 'CONVENIENCE',
        faceValueKrw: 3000,
        requiredPoints: 3500,
        status: 'ON_SALE',
      }),
    ).toEqual({
      name: '편의점 3천원',
      category: 'CONVENIENCE',
      face_value_krw: 3000,
      required_points: 3500,
      status: 'ON_SALE',
    })
  })

  it('buildProductPatchBody는 전달한 필드만 보낸다', () => {
    expect(
      buildProductPatchBody({
        requiredPoints: 8000,
        status: 'STOPPED',
      }),
    ).toEqual({
      required_points: 8000,
      status: 'STOPPED',
    })
  })

  it('POST /admin/gifticons 상품 생성', async () => {
    createAdminGifticonProduct.mockResolvedValue({
      data: {
        data: {
          gifticon_product_id: 6100,
          name: '신규',
          category: 'CAFE',
          face_value_krw: 5000,
          required_points: 6000,
          status: 'ON_SALE',
          stock_status: 'SOLD_OUT',
          available_code_count: 0,
          assigned_code_count: 0,
          void_code_count: 0,
        },
      },
    })

    const created = await createAdminGifticonProductService({
      name: '신규',
      category: 'CAFE',
      faceValueKrw: 5000,
      requiredPoints: 6000,
    })

    expect(createAdminGifticonProduct).toHaveBeenCalledWith({
      name: '신규',
      category: 'CAFE',
      face_value_krw: 5000,
      required_points: 6000,
      status: 'ON_SALE',
    })
    expect(created.gifticonProductId).toBe(6100)
  })

  it('PATCH /admin/gifticons/{id} 수정', async () => {
    patchAdminGifticonProduct.mockResolvedValue({
      data: {
        data: {
          gifticon_product_id: 6001,
          name: '수정됨',
          category: 'CAFE',
          face_value_krw: 5000,
          required_points: 7500,
          status: 'ON_SALE',
          stock_status: 'AVAILABLE',
          available_code_count: 2,
          assigned_code_count: 0,
          void_code_count: 0,
        },
      },
    })

    const updated = await updateAdminGifticonProduct(6001, { requiredPoints: 7500 })

    expect(patchAdminGifticonProduct).toHaveBeenCalledWith(6001, { required_points: 7500 })
    expect(updated.requiredPoints).toBe(7500)
  })

  it('buildCodeBatchBody는 expires_at ISO 문자열로 변환한다', () => {
    const body = buildCodeBatchBody([{ code: 'ABC123', expiresAt: '2026-12-31T15:00:00.000Z' }])
    expect(body.items[0].code).toBe('ABC123')
    expect(body.items[0].expires_at).toBe('2026-12-31T15:00:00.000Z')
  })

  it('POST /admin/gifticons/{id}/codes 일괄 등록', async () => {
    createAdminGifticonCodes.mockResolvedValue({
      data: {
        data: {
          created_count: 2,
          items: [
            {
              gifticon_code_id: 1,
              gifticon_product_id: 6001,
              code_masked: 'ABC***',
              status: 'AVAILABLE',
              expires_at: '2026-12-31T15:00:00.000Z',
            },
          ],
        },
      },
    })

    const result = await registerAdminGifticonCodes(6001, [
      { code: 'ABC123', expiresAt: '2026-12-31T15:00:00.000Z' },
      { code: 'DEF456', expiresAt: '2026-12-31T15:00:00.000Z' },
    ])

    expect(createAdminGifticonCodes).toHaveBeenCalledWith(6001, {
      items: [
        { code: 'ABC123', expires_at: '2026-12-31T15:00:00.000Z' },
        { code: 'DEF456', expires_at: '2026-12-31T15:00:00.000Z' },
      ],
    })
    expect(result.createdCount).toBe(2)
    expect(result.items[0].codeMasked).toBe('ABC***')
  })

  it('formatAdminGifticonError는 알려진 코드를 한글로 매핑한다', () => {
    expect(
      formatAdminGifticonError({ code: 'GIFTICON_CODE_NOT_VOIDABLE', message: 'raw' }),
    ).toContain('폐기')
  })
})
