export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export const parseApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response
    const message = data?.message || data?.error || getDefaultMessage(status)

    return new ApiError(message, status, data)
  }

  if (error.request) {
    return new ApiError('서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.', 0)
  }

  return new ApiError(error.message || '알 수 없는 오류가 발생했습니다.', -1)
}

const getDefaultMessage = (status) => {
  const messages = {
    400: '잘못된 요청입니다.',
    401: '인증이 필요합니다. 다시 로그인해 주세요.',
    403: '접근 권한이 없습니다.',
    404: '요청한 리소스를 찾을 수 없습니다.',
    500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  }

  return messages[status] || `요청 처리 중 오류가 발생했습니다. (${status})`
}
