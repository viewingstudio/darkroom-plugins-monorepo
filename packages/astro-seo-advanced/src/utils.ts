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
  disableSiteName?: boolean
  metaTitle?: string
  separator?: string
  siteName?: string
  titleDefault?: string
  titleTemplate?: string
}): string {
  const {
    disableSiteName,
    metaTitle,
    separator,
    siteName,
    titleDefault,
    titleTemplate,
  } = options

  const baseTitle = metaTitle || titleDefault || ''

  if (!baseTitle) return ''

  if (titleTemplate) {
    return titleTemplate.replace('%s', baseTitle)
  }

  if (!disableSiteName && siteName && separator !== undefined) {
    const sep = separator === '' ? '' : ` ${separator} `
    return separator === '' ? baseTitle : `${baseTitle}${sep}${siteName}`
  }

  return baseTitle
}

/**
 * Resolve a MetaImage (string | MediaObject | null) into structured parts.
 */
export function resolveImage(
  image: MetaImage,
  fallbackImage?: MetaImage,
): MediaObject | null {
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
  extras?: string
  globalNoindex?: boolean
  robotsMeta?: string
}): string | null {
  const { extras, globalNoindex, robotsMeta } = options

  const directives: string[] = []

  if (robotsMeta) {
    directives.push(
      ...robotsMeta.split(',').map((d) => d.trim()).filter(Boolean),
    )
  }

  if (globalNoindex && !directives.includes('noindex')) {
    directives.push('noindex')
  }

  if (extras) {
    directives.push(
      ...extras.split(',').map((d) => d.trim()).filter(Boolean),
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
