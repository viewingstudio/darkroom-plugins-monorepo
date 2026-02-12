export { default as SEO } from './SEO.astro'
export { default as MetaTags } from './MetaTags.astro'
export { default as OpenGraph } from './OpenGraph.astro'
export { default as TwitterCard } from './TwitterCard.astro'
export { default as Robots } from './Robots.astro'
export { default as CanonicalUrl } from './CanonicalUrl.astro'
export { default as LanguageAlternates } from './LanguageAlternates.astro'
export { default as JsonLd } from './JsonLd.astro'
export { default as FaqJsonLd } from './FaqJsonLd.astro'

export { validateSEOProps } from './utils.js'

export type {
  SEOProps,
  MetaTagsProps,
  OpenGraphProps,
  TwitterCardProps,
  RobotsProps,
  CanonicalUrlProps,
  LanguageAlternatesProps,
  JsonLdProps,
  FaqItem,
  FaqJsonLdProps,
  LanguageAlternate,
  ExtendMeta,
  MediaObject,
  MetaImage,
  Meta,
  SanitizedMeta,
} from './types.js'

export { sanitizeSeo } from './types.js'

export { buildTitle, resolveImage, buildRobots, absoluteUrl } from './utils.js'
