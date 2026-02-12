import type { Meta, SanitizedMeta } from '@kurto/payload-seo-advanced/types'

export type { Meta, SanitizedMeta }
export { sanitizeSeo } from '@kurto/payload-seo-advanced/types'

export interface MediaObject {
  alt?: string
  height?: number
  mimeType?: string
  url: string
  width?: number
}

export type MetaImage = MediaObject | string | null | undefined

export interface LanguageAlternate {
  href: string
  hrefLang: string
}

export interface ExtendMeta {
  link?: Array<Record<string, string>>
  meta?: Array<Record<string, string>>
}

export interface SEOProps {
  currentPath: string
  doc?: Record<string, any>
  extend?: ExtendMeta
  globalSettings?: Record<string, any>
  languageAlternates?: LanguageAlternate[]
  locale?: string
  localeAlternates?: string[]
  meta: Meta
  ogType?: string
  robotsExtras?: string
  siteUrl: string
  titleDefault?: string
  titleTemplate?: string
  twitterCard?: 'summary' | 'summary_large_image'
  twitterCreator?: string
  twitterSite?: string
}

export interface MetaTagsProps {
  description?: string | null
  keywords?: string | null
  title: string
}

export interface OpenGraphProps {
  articleAuthor?: string | null
  articlePublishedTime?: string | null
  description?: string | null
  image?: MetaImage
  locale?: string | null
  localeAlternates?: string[]
  ogType?: string
  siteName?: string | null
  title: string
  url: string
}

export interface TwitterCardProps {
  card?: 'summary' | 'summary_large_image'
  creator?: string | null
  description?: string | null
  image?: MetaImage
  site?: string | null
  title: string
}

export interface RobotsProps {
  extras?: string | null
  globalNoindex?: boolean
  robotsMeta?: string | null
}

export interface CanonicalUrlProps {
  url: string
}

export interface LanguageAlternatesProps {
  alternates: LanguageAlternate[]
}

export interface JsonLdProps {
  doc: Record<string, any>
  globalSettings?: Record<string, any>
}

export interface FaqItem {
  answer: string
  question: string
}

export interface FaqJsonLdProps {
  items: FaqItem[]
}
