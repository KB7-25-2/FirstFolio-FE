/**
 * @typedef {'DEPOSIT_SAVINGS' | 'BOND' | 'STOCK' | 'FUND'} AdminProductAssetType
 * @typedef {'ACTIVE' | 'INACTIVE'} AdminProductStatus
 * @typedef {'LOW' | 'MEDIUM' | 'HIGH'} AdminProductRiskLevel
 *
 * @typedef {object} AdminProduct
 * @property {number} productId
 * @property {string} displayName
 * @property {AdminProductAssetType | string} assetType
 * @property {string | null} description
 * @property {AdminProductRiskLevel | string | null} riskLevel
 * @property {string | null} sourceProvider
 * @property {string | null} sourceProductCode
 * @property {string | null} sourceProductName
 * @property {string | null} sourceReferenceAt
 * @property {object | null} realTerms
 * @property {object | null} simulationTerms
 * @property {AdminProductStatus | string} status
 *
 * @typedef {object} AdminProductPage
 * @property {AdminProduct[]} items
 * @property {string | null} nextCursor
 *
 * @typedef {object} AdminProductImportResult
 * @property {number} importedCount
 * @property {number} skippedCount
 * @property {number[]} productIds
 * @property {string | null} referenceAt
 */

export {}
