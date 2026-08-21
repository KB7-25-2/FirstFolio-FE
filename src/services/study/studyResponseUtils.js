export const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

export const unwrap = (response) => response?.data?.data ?? response?.data

export const pickField = (obj, ...keys) => {
  if (!obj || typeof obj !== 'object') return undefined
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key]
  }
  return undefined
}
