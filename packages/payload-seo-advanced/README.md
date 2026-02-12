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

| Field                          | Type                 | Description                                                                           |
| ------------------------------ | -------------------- | ------------------------------------------------------------------------------------- |
| `siteName`                     | text (localized)     | Appended to meta titles via the title separator                                       |
| `titleSeparator`               | select               | Character between page title and site name (`-`, `\|`, `•`)                           |
| `defaults.ogImage`             | upload               | Fallback OG image (requires `uploadsCollection`)                                      |
| `defaults.fallbackDescription` | textarea (localized) | Fallback meta description                                                             |
| `knowledgeGraph.type`          | select               | `organization` or `person`                                                            |
| `knowledgeGraph.name`          | text (localized)     | Entity name                                                                           |
| `knowledgeGraph.logo`          | upload               | Logo (shown when type is `organization`)                                              |
| `knowledgeGraph.contactEmail`  | email                | Contact email                                                                         |
| `knowledgeGraph.contactPhone`  | text                 | Contact phone                                                                         |
| `knowledgeGraph.address`       | group                | Street address, city, state, postal code, country (shown when type is `organization`) |
| `knowledgeGraph.socialLinks`   | array                | Platform + URL pairs                                                                  |
| `indexing.noindex`             | checkbox             | Site-wide noindex toggle for staging environments                                     |

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

Adds a Schema.org structured data group with a schema type selector and conditional fields per type.

Pass `true` for all schema types, or an object:

```ts
payloadSeoAdvanced({
  structuredData: {
    schemaTypes: ['article', 'product', 'localBusiness'],
    authorCollection: 'users', // default: 'users'
    fieldsOverride: ({ defaultFields }) => defaultFields,
  },
})
```

| Option             | Type             | Default   | Description                                    |
| ------------------ | ---------------- | --------- | ---------------------------------------------- |
| `schemaTypes`      | `SchemaType[]`   | all types | Which schema types to include in the selector  |
| `authorCollection` | `string`         | `'users'` | Collection for the Article author relationship |
| `fieldsOverride`   | `FieldsOverride` | —         | Override the structured data fields            |

**Available schema types:** `article`, `product`, `service`, `event`, `localBusiness`

**Conditional fields per type:**

| Schema Type    | Fields                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------- |
| Article        | `author` (relationship), `publishDate` (date)                                                |
| Product        | `price` (number), `currency` (text), `inStock` (checkbox)                                    |
| Service        | `serviceType` (text), `provider` (text), `areaServed` (text)                                 |
| Event          | `startDate` (date), `endDate` (date), `locationName` (text), `locationAddress` (text)        |
| Local Business | `businessType` (text), `priceRange` (text), `useGlobalAddress` (checkbox), `address` (group) |

Local Business can pull its address from the SEO Settings global when `useGlobalAddress` is checked.

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
