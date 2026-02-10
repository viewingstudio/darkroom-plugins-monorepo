import type { Meta } from '@kurto/payload-seo-advanced/types'

export type { Meta }

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
  description?: string
  keywords?: string
  title: string
}

export interface OpenGraphProps {
  articleAuthor?: string
  articlePublishedTime?: string
  description?: string
  image?: MetaImage
  locale?: string
  localeAlternates?: string[]
  ogType?: string
  siteName?: string
  title: string
  url: string
}

export interface TwitterCardProps {
  card?: 'summary' | 'summary_large_image'
  creator?: string
  description?: string
  image?: MetaImage
  site?: string
  title: string
}

export interface RobotsProps {
  extras?: string
  globalNoindex?: boolean
  robotsMeta?: string
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
