import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getUserProfileApiMock, updateUserProfileApiMock } = vi.hoisted(() => ({
  getUserProfileApiMock: vi.fn(),
  updateUserProfileApiMock: vi.fn(),
}))

vi.mock('@/api/user/userApi.js', () => ({
  getUserProfile: getUserProfileApiMock,
  updateUserProfile: updateUserProfileApiMock,
}))

import { ApiError } from '@/api/user/errorHandler.js'
import {
  __resetUserProfileCache,
  applyPointBalanceDelta,
  getUserProfile,
  updateUserProfile,
  UserApiError,
} from '@/services/userService.js'

const seedProfile = async () => {
  getUserProfileApiMock.mockResolvedValue({
    data: {
      data: {
        user_id: 101,
        email: 'student@example.com',
        nickname: '새싹투자자',
        role_code: 'USER',
        newsletter_opt_in: true,
        point_balance: 4200,
        created_at: '2026-07-29T01:00:00Z',
      },
    },
  })
  await getUserProfile()
}

describe('userService.getUserProfile (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __resetUserProfileCache()
  })

  it('GET /users/me 응답을 camelCase 프로필로 매핑한다', async () => {
    await seedProfile()

    expect(getUserProfileApiMock).toHaveBeenCalledTimes(1)
    const { data } = await getUserProfile()
    expect(data).toEqual({
      userId: 101,
      email: 'student@example.com',
      nickname: '새싹투자자',
      roleCode: 'USER',
      newsletterOptIn: true,
      pointBalance: 4200,
      createdAt: '2026-07-29T01:00:00Z',
    })
  })

  it('UNAUTHORIZED를 UserApiError로 매핑한다', async () => {
    getUserProfileApiMock.mockRejectedValue(
      new ApiError('인증이 필요합니다.', 401, null, 'UNAUTHORIZED'),
    )

    await expect(getUserProfile()).rejects.toMatchObject({
      name: 'UserApiError',
      code: 'UNAUTHORIZED',
      status: 401,
      message: '인증이 필요합니다. 다시 로그인해 주세요.',
    })
  })

  it('조회 후 포인트 목업 가산이 캐시 기준으로 동작한다', async () => {
    getUserProfileApiMock.mockResolvedValue({
      data: {
        data: {
          user_id: 1,
          email: 'a@b.com',
          nickname: '테스트',
          role_code: 'USER',
          newsletter_opt_in: false,
          point_balance: 100,
          created_at: '2026-07-29T01:00:00Z',
        },
      },
    })

    await getUserProfile()
    const { data } = await applyPointBalanceDelta(50)

    expect(data.pointBalance).toBe(150)
  })

  it('프로필 캐시가 없으면 포인트 가산은 UNAUTHORIZED다', async () => {
    await expect(applyPointBalanceDelta(10)).rejects.toBeInstanceOf(UserApiError)
  })
})

describe('userService.updateUserProfile (unit)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    __resetUserProfileCache()
    await seedProfile()
  })

  it('변경된 필드만 snake_case로 PATCH한다', async () => {
    updateUserProfileApiMock.mockResolvedValue({
      data: {
        data: {
          user_id: 101,
          nickname: '채권꿈나무',
          newsletter_opt_in: false,
          updated_at: '2026-07-29T02:00:00Z',
        },
      },
    })

    const { data } = await updateUserProfile({
      nickname: '채권꿈나무',
      newsletterOptIn: false,
    })

    expect(updateUserProfileApiMock).toHaveBeenCalledWith({
      nickname: '채권꿈나무',
      newsletter_opt_in: false,
    })
    expect(data.nickname).toBe('채권꿈나무')
    expect(data.newsletterOptIn).toBe(false)
    expect(data.email).toBe('student@example.com')
    expect(data.pointBalance).toBe(4200)
  })

  it('변경 필드가 없으면 NO_PATCH_FIELDS를 던진다', async () => {
    await expect(updateUserProfile({})).rejects.toMatchObject({
      code: 'NO_PATCH_FIELDS',
      status: 400,
    })
    expect(updateUserProfileApiMock).not.toHaveBeenCalled()
  })

  it('NICKNAME_CONFLICT를 UserApiError로 매핑한다', async () => {
    updateUserProfileApiMock.mockRejectedValue(
      new ApiError('닉네임 중복', 409, null, 'NICKNAME_CONFLICT'),
    )

    await expect(updateUserProfile({ nickname: '이미있음' })).rejects.toMatchObject({
      code: 'NICKNAME_CONFLICT',
      status: 409,
      message: '이미 사용 중인 닉네임입니다.',
    })
  })
})
