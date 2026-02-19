# @kurto/payload-seo-advanced

Advanced SEO plugin for Payload CMS. Extends the core `@payloadcms/plugin-seo` with global SEO settings, advanced per-page fields, and Schema.org structured data.

## Installation

```bash
pnpm add @kurto/payload-seo-advanced
```

**Peer dependencies:** `payload`, `@payloadcms/ui`, `@payloadcms/translations` (all `^3.74.0`)

## Quick Start

```ts
// payload.config.ts
import { payloadSeoAdvanced } from '@kurto/payload-seo-advanced'

export default buildConfig({
  plugins: [
    payloadSeoAdvanced({
      collections: ['pages', 'posts'],
      uploadsCollection: 'media',
      tabbedUI: true,
      globalSettings: true,
      advancedFields: true,
      structuredData: true,
      generateTitle: ({ doc }) => doc?.title ?? '',
      generateDescription: ({ doc }) => doc?.excerpt ?? '',
      generateURL: ({ doc, collectionConfig }) =>
        `https://example.com/${collectionConfig?.slug}/${doc?.slug}`,
    }),
  ],
})
```

All features beyond the base meta fields are opt-in. Pass `true` for defaults or an object for fine-grained control.

## Config Reference

### Top-Level Options

| Option                | Type                              | Description                                                                      |
| --------------------- | --------------------------------- | -------------------------------------------------------------------------------- |
| `collections`         | `CollectionSlug[]`                | Collections to add SEO fields to                                                 |
| `globals`             | `GlobalSlug[]`                    | Globals to add SEO fields to                                                     |
| `uploadsCollection`   | `UploadCollectionSlug`            | Collection used for image uploads (enables meta image field and global OG image) |
| `tabbedUI`            | `boolean`                         | Wrap content and SEO fields in a tabbed layout                                   |
| `interfaceName`       | `string`                          | Custom interface name for the `meta` group field                                 |
| `generateTitle`       | `(args) => string`                | Function to auto-generate meta titles                                            |
| `generateDescription` | `(args) => string`                | Function to auto-generate meta descriptions                                      |
| `generateImage`       | `(args) => string \| number`      | Function to auto-generate meta images                                            |
| `generateURL`         | `(args) => string`                | Function to auto-generate preview URLs                                           |
| `fieldsOverride`      | `FieldsOverride`                  | Override the default meta fields array                                           |
| `globalSettings`      | `boolean \| GlobalSettingsConfig` | Enable the SEO Settings global                                                   |
| `advancedFields`      | `boolean \| AdvancedFieldsConfig` | Enable advanced per-page fields                                                  |
| `structuredData`      | `boolean \| StructuredDataConfig` | Enable Schema.org structured data fields                                         |

### `globalSettings`

Creates an **SEO Settings** global in the admin panel for site-wide configuration.

Pass `true` for defaults, or an object:

```ts
payloadSeoAdvanced({
  globalSettings: {
    slug: 'seo-settings', // default: 'seo-settings'
    adminGroup: 'SEO', // default: 'SEO'
    access: { read: () => true }, // default: { read: () => true }
    fieldsOverride: ({ defaultFields }) => defaultFields,
  },
})
```

| Option           | Type                     | Default                | Description                  |
| ---------------- | ------------------------ | ---------------------- | ---------------------------- |
| `slug`           | `string`                 | `'seo-settings'`       | Global slug                  |
| `adminGroup`     | `string`                 | `'SEO'`                | Admin sidebar group          |
| `access`         | `GlobalConfig['access']` | `{ read: () => true }` | Access control               |
| `fieldsOverride` | `FieldsOverride`         | —                      | Override the global's fields |

**Fields created in the global:**

| Field                          | Type                 | Description                                                 |
| ------------------------------ | -------------------- | ----------------------------------------------------------- |
| `siteName`                     | text (localized)     | Appended to meta titles via the title separator             |
| `titleSeparator`               | select               | Character between page title and site name (`-`, `\|`, `•`) |
| `defaults.ogImage`             | upload               | Fallback OG image (requires `uploadsCollection`)            |
| `defaults.fallbackDescription` | textarea (localized) | Fallback meta description                                   |
| `knowledgeGraph`               | blocks (maxRows: 1)  | Organization or Person block (see below)                    |
| `indexing.noindex`             | checkbox             | Site-wide noindex toggle for staging environments           |

**Knowledge Graph blocks:**

The `knowledgeGraph` field is a blocks field with `maxRows: 1`, supporting two block types:

**Organization block:**

- `name` (text, localized)
- `logo` (upload, requires `uploadsCollection`)
- `contactEmail` (email)
- `contactPhone` (text)
- `address` (group: streetAddress, city, state, postalCode, country)
- `socialLinks` (array of platform + URL pairs)

**Person block:**

- `name` (text, localized)
- `contactEmail` (email)
- `contactPhone` (text)
- `socialLinks` (array of platform + URL pairs)

When `globalSettings` is enabled, the auto-generate title endpoint automatically appends the site name from the global using the configured separator.

### `advancedFields`

Adds per-page SEO fields after the SERP preview.

Pass `true` for all fields, or an object to toggle individually:

```ts
payloadSeoAdvanced({
  advancedFields: {
    canonicalUrl: true, // default: true
    robotsMeta: true, // default: true
    focusKeyword: true, // default: true
  },
})
```

| Option         | Type      | Default | Description                                                      |
| -------------- | --------- | ------- | ---------------------------------------------------------------- |
| `canonicalUrl` | `boolean` | `true`  | Canonical URL field with auto-population via `beforeChange` hook |
| `robotsMeta`   | `boolean` | `true`  | Robots meta directive select (index/noindex, follow/nofollow)    |
| `focusKeyword` | `boolean` | `true`  | Focus keyword text field (localized) for content analysis        |

**Canonical URL auto-population:** When left empty, the `beforeChange` hook populates it using `generateURL` if provided, or falls back to `{serverURL}/{collection.slug}/{doc.slug}`.

### `structuredData`

Adds Schema.org structured data using a Payload `blocks` field with `maxRows: 1`. Each schema type is its own block with flat fields. With the Postgres adapter's `blocksAsJSON: true` option (user-configured), blocks store as JSON columns rather than proliferating database columns.

Pass `true` for all schema types, or an object:

```ts
payloadSeoAdvanced({
  structuredData: {
    schemaTypes: ['article', 'product', 'localBusiness'],
    fieldsOverride: ({ defaultFields }) => defaultFields,
  },
})
```

| Option           | Type             | Default   | Description                               |
| ---------------- | ---------------- | --------- | ----------------------------------------- |
| `schemaTypes`    | `SchemaType[]`   | all types | Which schema types to include as blocks   |
| `fieldsOverride` | `FieldsOverride` | —         | Override the structured data blocks field |

**Available block types:** `article`, `product`, `service`, `event`, `localBusiness`

**Fields per block type:**

| Block Type     | Fields                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------- |
| article        | `author` (text), `publishDate` (date)                                                        |
| product        | `price` (number), `currency` (text), `inStock` (checkbox)                                    |
| service        | `serviceType` (text), `provider` (text), `areaServed` (text)                                 |
| event          | `startDate` (date), `endDate` (date), `locationName` (text), `locationAddress` (text)        |
| localBusiness  | `businessType` (text), `priceRange` (text), `useGlobalAddress` (checkbox), `address` (group) |

**Data shape:** `meta.structuredData` is an array containing a single block:

```ts
meta.structuredData = [
  {
    blockType: 'article',
    id: 'abc123',
    author: 'John Doe',
    publishDate: '2024-01-01',
  },
]
```

**Local Business address fallback:** When `useGlobalAddress` is checked, the address is pulled from the first knowledge graph block in SEO Settings (`seoSettings.knowledgeGraph[0].address`).

**Postgres optimization:** Enable `blocksAsJSON: true` in your Postgres adapter configuration to store blocks as single JSON columns rather than creating separate tables. This significantly improves schema flexibility and reduces migration complexity when adding new Schema.org properties.

## `fieldsOverride` Pattern

Every feature area that defines fields exposes a `fieldsOverride` callback. This receives the default fields array and returns the final array, giving full programmatic control.

```ts
type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]
```

**Top-level meta fields:**

```ts
payloadSeoAdvanced({
  collections: ['pages'],
  fieldsOverride: ({ defaultFields }) => {
    // Remove the preview field, add a custom field
    return [
      ...defaultFields.filter((f) => 'name' in f && f.name !== 'preview'),
      { name: 'ogLocale', type: 'text', label: 'OG Locale' },
    ]
  },
})
```

**Global settings fields:**

```ts
payloadSeoAdvanced({
  globalSettings: {
    fieldsOverride: ({ defaultFields }) =>
      defaultFields.filter((f) => 'name' in f && f.name !== 'socialLinks'),
  },
})
```

**Structured data fields:**

```ts
payloadSeoAdvanced({
  structuredData: {
    fieldsOverride: ({ defaultFields }) => [
      ...defaultFields,
      {
        name: 'faqFields',
        type: 'group',
        fields: [
          /* ... */
        ],
      },
    ],
  },
})
```

## `generateSchema` Utility

A pure function for rendering JSON-LD on the frontend. Zero server dependencies.

```ts
import { generateSchema } from '@kurto/payload-seo-advanced/utilities'

// In your page component
const jsonLd = generateSchema(page, seoSettings)

if (jsonLd) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
```

**Parameters:**

| Param            | Type                  | Description                                                             |
| ---------------- | --------------------- | ----------------------------------------------------------------------- |
| `doc`            | `Record<string, any>` | The Payload document (uses your generated types)                        |
| `globalSettings` | `Record<string, any>` | Optional SEO Settings global data (for Local Business address fallback) |

Returns a JSON-LD object or `null` if minimum required fields are missing. Minimum requirements vary by type:

- **Article** — needs a title/headline
- **Product** — needs a price
- **Service** — needs a title
- **Event** — needs a start date
- **Local Business** — needs a title

## Exports

| Path                                    | Contents                             |
| --------------------------------------- | ------------------------------------ |
| `@kurto/payload-seo-advanced`           | `payloadSeoAdvanced` plugin function |
| `@kurto/payload-seo-advanced/types`     | All TypeScript types                 |
| `@kurto/payload-seo-advanced/fields`    | Individual field factory functions   |
| `@kurto/payload-seo-advanced/client`    | React components (for Payload admin) |
| `@kurto/payload-seo-advanced/utilities` | `generateSchema` utility             |
