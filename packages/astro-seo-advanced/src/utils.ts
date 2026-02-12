import type { MetaImage, MediaObject } from './types.js'

/**
 * Build the final `<title>` string.
 *
 * Priority:
 * 1. titleTemplate (replaces %s with metaTitle)
 * 2. globalSettings-based: metaTitle {separator} siteName
 * 3. metaTitle as-is
 * 4. titleDefault fallback
 */
export function buildTitle(options: {
  disableSiteName?: boolean | null
  metaTitle?: string | null
  separator?: string | null
  siteName?: string | null
  titleDefault?: string | null
  titleTemplate?: string | null
}): string {
  const { disableSiteName, metaTitle, separator, siteName, titleDefault, titleTemplate } = options

  const baseTitle = metaTitle || titleDefault || ''

  if (!baseTitle) return ''

  if (titleTemplate) {
    return titleTemplate.replace('%s', baseTitle)
  }

  if (!disableSiteName && siteName && separator != null) {
    const sep = separator === '' ? '' : ` ${separator} `
    return separator === '' ? baseTitle : `${baseTitle}${sep}${siteName}`
  }

  return baseTitle
}

/**
 * Resolve a MetaImage (string | MediaObject | null) into structured parts.
 */
export function resolveImage(image: MetaImage, fallbackImage?: MetaImage): MediaObject | null {
  const img = image || fallbackImage
  if (!img) return null

  if (typeof img === 'string') {
    return { url: img }
  }

  if (typeof img === 'object' && 'url' in img && img.url) {
    return img
  }

  return null
}

/**
 * Build the robots meta content string.
 */
export function buildRobots(options: {
  extras?: string | null
  globalNoindex?: boolean
  robotsMeta?: string | null
}): string | null {
  const { extras, globalNoindex, robotsMeta } = options

  const directives: string[] = []

  if (robotsMeta) {
    directives.push(
      ...robotsMeta
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean),
    )
  }

  if (globalNoindex && !directives.includes('noindex')) {
    directives.push('noindex')
  }

  if (extras) {
    directives.push(
      ...extras
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean),
    )
  }

  if (directives.length === 0) return null

  const content = directives.join(', ')

  if (content === 'index, follow' || content === 'index' || content === 'follow') {
    return null
  }

  return content
}

/**
 * Validate SEO props and return an array of warning messages for missing or invalid data.
 * Warnings are logged to the console in development mode to aid debugging.
 */
export function validateSEOProps(props: {
  currentPath?: unknown
  meta?: unknown
  siteUrl?: unknown
  titleDefault?: unknown
}): string[] {
  const warnings: string[] = []

  if (!props.meta || typeof props.meta !== 'object') {
    warnings.push(
      '[astro-seo-advanced] "meta" prop is missing or not an object. No SEO tags will be generated correctly.',
    )
  } else {
    const meta = props.meta as Record<string, unknown>
    if (!meta.title && !props.titleDefault) {
      warnings.push(
        '[astro-seo-advanced] "meta.title" is empty and no "titleDefault" was provided. The page will have no <title> tag.',
      )
    }
    if (!meta.description) {
      warnings.push(
        '[astro-seo-advanced] "meta.description" is empty. The page will have no meta description.',
      )
    }
  }

  if (!props.siteUrl || typeof props.siteUrl !== 'string') {
    warnings.push(
      '[astro-seo-advanced] "siteUrl" prop is missing or empty. Canonical URL and og:url will be incorrect.',
    )
  }

  if (!props.currentPath || typeof props.currentPath !== 'string') {
    warnings.push(
      '[astro-seo-advanced] "currentPath" prop is missing or empty. Canonical URL and og:url will be incorrect.',
    )
  }

  return warnings
}

/**
 * Make a URL absolute by prepending siteUrl if needed.
 */
export function absoluteUrl(siteUrl: string, path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const base = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}
