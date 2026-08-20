let epoch = 0

/** 현재 브라우저 사용자 세션의 세대값 */
export const getSessionEpoch = () => epoch

/** 로그아웃·계정 전환 시 이전 요청 응답을 무효화한다. */
export const advanceSessionEpoch = () => {
  epoch += 1
  return epoch
}

/** @param {number | undefined} requestEpoch */
export const isCurrentSessionEpoch = (requestEpoch) => requestEpoch === epoch
