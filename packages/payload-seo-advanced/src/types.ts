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
 */
export type Meta = {
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
