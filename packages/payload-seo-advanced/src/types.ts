import type { DocumentInfoContext } from '@payloadcms/ui'
import type {
  CollectionConfig,
  CollectionSlug,
  Field,
  GlobalConfig,
  GlobalSlug,
  PayloadRequest,
  UploadCollectionSlug,
} from 'payload'

export type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]

export type PartialDocumentInfoContext = Pick<
  DocumentInfoContext,
  | 'collectionSlug'
  | 'docPermissions'
  | 'globalSlug'
  | 'hasPublishedDoc'
  | 'hasPublishPermission'
  | 'hasSavePermission'
  | 'id'
  | 'initialData'
  | 'initialState'
  | 'preferencesKey'
  | 'title'
  | 'versionCount'
>

export type GenerateTitle<T = any> = (
  args: {
    collectionConfig?: CollectionConfig
    doc: T
    globalConfig?: GlobalConfig
    locale?: string
    req: PayloadRequest
  } & PartialDocumentInfoContext,
) => Promise<string> | string

export type GenerateDescription<T = any> = (
  args: {
    collectionConfig?: CollectionConfig
    doc: T
    globalConfig?: GlobalConfig
    locale?: string
    req: PayloadRequest
  } & PartialDocumentInfoContext,
) => Promise<string> | string

export type GenerateImage<T = any> = (
  args: {
    collectionConfig?: CollectionConfig
    doc: T
    globalConfig?: GlobalConfig
    locale?: string
    req: PayloadRequest
  } & PartialDocumentInfoContext,
) => { id: number | string } | number | Promise<{ id: number | string } | number | string> | string

export type GenerateURL<T = any> = (
  args: {
    collectionConfig?: CollectionConfig
    doc: T
    globalConfig?: GlobalConfig
    locale?: string
    req: PayloadRequest
  } & PartialDocumentInfoContext,
) => Promise<string> | string

export type GlobalSettingsConfig = {
  access?: GlobalConfig['access']
  adminGroup?: string
  fieldsOverride?: FieldsOverride
  slug?: string
}

export type AdvancedFieldsConfig = {
  canonicalUrl?: boolean
  focusKeyword?: boolean
  robotsMeta?: boolean
}

export type SchemaType = 'article' | 'event' | 'localBusiness' | 'product' | 'service'

export type StructuredDataConfig = {
  fieldsOverride?: FieldsOverride
  schemaTypes?: SchemaType[]
}

export type SEOPluginConfig = {
  advancedFields?: AdvancedFieldsConfig | boolean
  collections?: ({} | CollectionSlug)[]
  fieldsOverride?: FieldsOverride
  generateDescription?: GenerateDescription
  generateImage?: GenerateImage
  generateTitle?: GenerateTitle
  generateURL?: GenerateURL
  globals?: ({} | GlobalSlug)[]
  globalSettings?: GlobalSettingsConfig | boolean
  interfaceName?: string
  structuredData?: StructuredDataConfig | boolean
  tabbedUI?: boolean
  uploadsCollection?: {} | UploadCollectionSlug
}

/**
 * Convenience type for the meta field shape.
 * For full generated types, use the `Meta` type from your project's `payload-types.ts`.
 *
 * String fields accept `null` because Payload CMS stores empty optional fields as `null`
 * rather than `undefined`. This ensures data from Payload passes through without type errors.
 */
export type Meta = {
  canonicalUrl?: string | null
  description?: string | null
  disableSiteName?: boolean | null
  focusKeyword?: string | null
  image?: any
  keywords?: string | null
  robotsMeta?: string | null
  structuredData?: Record<string, any> | null
  title?: string | null
}

/**
 * Sanitize a Payload CMS `Meta` object by coercing `null` values to `undefined`.
 * Use this at the boundary between your CMS data and frontend components
 * so downstream code only needs to handle `string | undefined`.
 *
 * Returns `undefined` if the input is nullish.
 *
 * @example
 * ```ts
 * import { sanitizeSeo } from '@kurto/payload-seo-advanced/types'
 * const meta = sanitizeSeo(page.meta) // Meta (with null stripped) | undefined
 * ```
 */
export function sanitizeSeo(meta: Meta | null | undefined): SanitizedMeta | undefined {
  if (meta == null) return undefined

  return {
    canonicalUrl: meta.canonicalUrl ?? undefined,
    description: meta.description ?? undefined,
    disableSiteName: meta.disableSiteName ?? undefined,
    focusKeyword: meta.focusKeyword ?? undefined,
    image: meta.image ?? undefined,
    keywords: meta.keywords ?? undefined,
    robotsMeta: meta.robotsMeta ?? undefined,
    structuredData: meta.structuredData ?? undefined,
    title: meta.title ?? undefined,
  }
}

/**
 * A sanitized version of `Meta` where `null` has been coerced to `undefined`.
 * This is the return type of `sanitizeSeo()`.
 */
export type SanitizedMeta = {
  canonicalUrl?: string
  description?: string
  disableSiteName?: boolean
  focusKeyword?: string
  image?: any
  keywords?: string
  robotsMeta?: string
  structuredData?: Record<string, any>
  title?: string
}
