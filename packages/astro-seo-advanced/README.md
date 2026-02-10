# @kurto/astro-seo-advanced

Astro components for rendering SEO `<head>` markup from [`@kurto/payload-seo-advanced`](../payload-seo-advanced) data. Handles meta tags, Open Graph, Twitter Cards, robots directives, canonical URLs, hreflang alternates, and JSON-LD structured data.

## Installation

```bash
pnpm add @kurto/astro-seo-advanced
```

**Peer dependencies:** `astro` (>=5.17)

## Quick Start

```astro
---
import { SEO } from '@kurto/astro-seo-advanced'

const page = await getPage() // your Payload fetch
const seoSettings = await getSeoSettings() // optional SEO Settings global
---

<html>
  <head>
    <SEO
      meta={page.meta}
      globalSettings={seoSettings}
      siteUrl="https://example.com"
      currentPath={Astro.url.pathname}
    />
  </head>
  <body>
    <slot />
  </body>
</html>
```

## All-in-One `<SEO />` Props

| Prop                 | Type                                 | Required | Description                                                                      |
| -------------------- | ------------------------------------ | -------- | -------------------------------------------------------------------------------- |
| `meta`               | `Meta`                               | Yes      | The document's `meta` field from Payload                                         |
| `globalSettings`     | `Record<string, any>`                | No       | SEO Settings global data                                                         |
| `siteUrl`            | `string`                             | Yes      | Base site URL (e.g. `https://example.com`)                                       |
| `currentPath`        | `string`                             | Yes      | Current page path (e.g. `/about`)                                                |
| `doc`                | `Record<string, any>`                | No       | Full Payload document (for JSON-LD; falls back to `{ meta, title: meta.title }`) |
| `titleTemplate`      | `string`                             | No       | Title format override, e.g. `"%s — My Site"`                                     |
| `titleDefault`       | `string`                             | No       | Fallback title when `meta.title` is empty                                        |
| `ogType`             | `string`                             | No       | Open Graph type (default: `'website'`, auto-set to `'article'` when applicable)  |
| `locale`             | `string`                             | No       | `og:locale` value, e.g. `'en_US'`                                                |
| `localeAlternates`   | `string[]`                           | No       | `og:locale:alternate` values                                                     |
| `languageAlternates` | `Array<{ href, hrefLang }>`          | No       | Hreflang alternates for i18n                                                     |
| `twitterCard`        | `'summary' \| 'summary_large_image'` | No       | Twitter card type (defaults based on image presence)                             |
| `twitterSite`        | `string`                             | No       | `@handle` for `twitter:site`                                                     |
| `twitterCreator`     | `string`                             | No       | `@handle` for `twitter:creator`                                                  |
| `robotsExtras`       | `string`                             | No       | Extra robots directives, e.g. `"max-snippet:-1"`                                 |
| `extend`             | `{ meta?, link? }`                   | No       | Escape hatch for arbitrary `<meta>` and `<link>` tags                            |

## Composable Sub-Components

Each component can be used independently for granular control:

```astro
---
import { MetaTags, OpenGraph, TwitterCard, Robots, CanonicalUrl, LanguageAlternates, JsonLd } from '@kurto/astro-seo-advanced'
---

<head>
  <MetaTags title="My Page" description="A description" keywords="foo, bar" />
  <OpenGraph title="My Page" description="A description" url="https://example.com/page" />
  <TwitterCard title="My Page" description="A description" />
  <Robots robotsMeta="noindex" />
  <CanonicalUrl url="https://example.com/page" />
  <LanguageAlternates alternates={[{ href: 'https://example.com/de/page', hrefLang: 'de' }]} />
  <JsonLd doc={page} globalSettings={seoSettings} />
</head>
```

### `<MetaTags />`

| Prop          | Type     | Description                 |
| ------------- | -------- | --------------------------- |
| `title`       | `string` | Page `<title>`              |
| `description` | `string` | `<meta name="description">` |
| `keywords`    | `string` | `<meta name="keywords">`    |

### `<OpenGraph />`

| Prop                   | Type                    | Description                                             |
| ---------------------- | ----------------------- | ------------------------------------------------------- |
| `title`                | `string`                | `og:title`                                              |
| `description`          | `string`                | `og:description`                                        |
| `url`                  | `string`                | `og:url`                                                |
| `ogType`               | `string`                | `og:type` (default: `'website'`)                        |
| `siteName`             | `string`                | `og:site_name`                                          |
| `locale`               | `string`                | `og:locale`                                             |
| `localeAlternates`     | `string[]`              | `og:locale:alternate`                                   |
| `image`                | `MediaObject \| string` | OG image (supports full media object or URL string)     |
| `articlePublishedTime` | `string`                | `article:published_time` (when `ogType` is `'article'`) |
| `articleAuthor`        | `string`                | `article:author` (when `ogType` is `'article'`)         |

### `<TwitterCard />`

| Prop          | Type                                 | Description                          |
| ------------- | ------------------------------------ | ------------------------------------ |
| `title`       | `string`                             | `twitter:title`                      |
| `description` | `string`                             | `twitter:description`                |
| `image`       | `MediaObject \| string`              | `twitter:image`                      |
| `card`        | `'summary' \| 'summary_large_image'` | Card type (auto-detected from image) |
| `site`        | `string`                             | `twitter:site`                       |
| `creator`     | `string`                             | `twitter:creator`                    |

### `<Robots />`

| Prop            | Type      | Description                                     |
| --------------- | --------- | ----------------------------------------------- |
| `robotsMeta`    | `string`  | Per-page robots directive                       |
| `globalNoindex` | `boolean` | Force `noindex` (from SEO Settings global)      |
| `extras`        | `string`  | Additional directives (e.g. `"max-snippet:-1"`) |

### `<CanonicalUrl />`

| Prop  | Type     | Description   |
| ----- | -------- | ------------- |
| `url` | `string` | Canonical URL |

### `<LanguageAlternates />`

| Prop         | Type                        | Description            |
| ------------ | --------------------------- | ---------------------- |
| `alternates` | `Array<{ href, hrefLang }>` | Hreflang link elements |

### `<JsonLd />`

| Prop             | Type                  | Description                                               |
| ---------------- | --------------------- | --------------------------------------------------------- |
| `doc`            | `Record<string, any>` | Full Payload document (needs `meta` and `title`)          |
| `globalSettings` | `Record<string, any>` | SEO Settings global (for Local Business address fallback) |

Uses `generateSchema()` from `@kurto/payload-seo-advanced/utilities` under the hood.

### `<FaqJsonLd />`

Renders [FAQPage](https://schema.org/FAQPage) structured data. Can be placed anywhere on the page — `<head>` or `<body>`.

| Prop    | Type                          | Description                      |
| ------- | ----------------------------- | -------------------------------- |
| `items` | `Array<{ question, answer }>` | FAQ entries to render as JSON-LD |

```astro
---
import { FaqJsonLd } from '@kurto/astro-seo-advanced'

const faqs = [
  { question: 'What is Astro?', answer: 'A web framework for content-driven websites.' },
  { question: 'What is Payload?', answer: 'A headless CMS built with TypeScript.' },
]
---

<section>
  <h2>FAQ</h2>
  {faqs.map(({ question, answer }) => (
    <details>
      <summary>{question}</summary>
      <p>{answer}</p>
    </details>
  ))}
  <FaqJsonLd items={faqs} />
</section>
```

Renders nothing when `items` is empty.

## Title Construction

Priority order:

1. `titleTemplate` — replaces `%s` with `meta.title`
2. globalSettings — `meta.title {separator} siteName` (skipped if `meta.disableSiteName`)
3. `meta.title` as-is
4. `titleDefault` fallback

## Image Handling

The `meta.image` field accepts:

- **Full media object** `{ url, width?, height?, alt?, mimeType? }` — renders all OG image sub-properties
- **Plain URL string** — renders `og:image` only

Falls back to `globalSettings.defaults.ogImage` when no per-page image is set.

## Utilities

The package also exports utility functions for advanced use:

```ts
import { buildTitle, resolveImage, buildRobots, absoluteUrl } from '@kurto/astro-seo-advanced'
```

## License

MIT
