/**
 * @typedef {'CAFE' | 'DELIVERY' | 'CONVENIENCE'} AdminGifticonCategory
 * @typedef {'ON_SALE' | 'STOPPED'} AdminGifticonProductStatus
 * @typedef {'AVAILABLE' | 'SOLD_OUT'} AdminGifticonStockStatus
 * @typedef {'AVAILABLE' | 'ASSIGNED' | 'VOID'} AdminGifticonCodeStatus
 *
 * @typedef {object} AdminGifticonProduct
 * @property {number} gifticonProductId
 * @property {string} name
 * @property {string | null} brandName
 * @property {AdminGifticonCategory | string | null} category
 * @property {number} faceValueKrw
 * @property {number} requiredPoints
 * @property {AdminGifticonProductStatus | string} status
 * @property {AdminGifticonStockStatus | string} stockStatus
 * @property {number} availableCodeCount
 * @property {number} assignedCodeCount
 * @property {number} voidCodeCount
 * @property {string | null} imageUrl
 * @property {string | null} createdAt
 * @property {string | null} updatedAt
 *
 * @typedef {object} AdminGifticonProductPage
 * @property {AdminGifticonProduct[]} items
 * @property {string | null} nextCursor
 *
 * @typedef {object} AdminGifticonProductCreateInput
 * @property {string} name
 * @property {string} [brandName]
 * @property {AdminGifticonCategory | string} category
 * @property {number} faceValueKrw
 * @property {number} requiredPoints
 * @property {string} [imageUrl]
 * @property {AdminGifticonProductStatus | string} [status]
 *
 * @typedef {object} AdminGifticonProductPatchInput
 * @property {string} [name]
 * @property {string | null} [brandName]
 * @property {AdminGifticonCategory | string} [category]
 * @property {number} [faceValueKrw]
 * @property {number} [requiredPoints]
 * @property {string | null} [imageUrl]
 * @property {AdminGifticonProductStatus | string} [status]
 *
 * @typedef {object} AdminGifticonCode
 * @property {number} gifticonCodeId
 * @property {number} gifticonProductId
 * @property {string} codeMasked
 * @property {AdminGifticonCodeStatus | string} status
 * @property {string | null} expiresAt
 * @property {string | null} createdAt
 *
 * @typedef {object} AdminGifticonCodePage
 * @property {AdminGifticonCode[]} items
 * @property {string | null} nextCursor
 *
 * @typedef {object} AdminGifticonCodeCreateItem
 * @property {string} code
 * @property {string} expiresAt
 *
 * @typedef {object} AdminGifticonCodeBatchResult
 * @property {number} createdCount
 * @property {AdminGifticonCode[]} items
 *
 * @typedef {object} AdminGifticonCodeVoidResult
 * @property {number} gifticonCodeId
 * @property {AdminGifticonCodeStatus | string} status
 */

export {}
