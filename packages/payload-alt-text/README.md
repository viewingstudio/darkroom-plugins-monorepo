# @kurto/payload-alt-text

AI-generated alt text for Payload CMS uploads, powered by Gemini.

## Features

- **Auto-generate on upload** — a `beforeValidate` hook writes an alt text description the moment a file is uploaded, before the field's `required` validation can reject an empty value.
- **Manual Generate button** — an admin-only endpoint lets an editor regenerate the description for an existing upload and review it before saving.
- **Wraps your existing field** — if the collection already has an `alt`-like field, the plugin adds the Generate button to it and keeps its `required`, `localized`, label, and `admin` config untouched; only a new field is created from scratch.
- **Never overwrites on upload** — the hook only runs when the target field is empty, so hand-written alt text is always left alone.
- **Business-aware prompting** — an optional settings global lets an admin describe the business, its location, a house tone, and terms to avoid, all folded into the prompt without ever appearing in the output.
- **No keyword stuffing** — the prompt has no instruction to insert keywords or the brand name, because that degrades both search relevance and the accessibility the attribute exists for.
- **Graceful failure** — a failed or safety-blocked API call falls back to a humanized filename (or an empty value, or a thrown error) rather than silently blocking an upload.
- **No stored secret** — the Gemini API key lives only in `process.env.GEMINI_API_KEY`, never in the database.

## Installation

```bash
pnpm add @kurto/payload-alt-text
```

Peer dependencies: `@payloadcms/ui`, `payload` (`^3.74.0`), `react` and `react-dom` (`^18.0.0 || ^19.0.0`).

You must also set `GEMINI_API_KEY` in the environment (or pass `apiKey` explicitly — see below).

## Quick Start

```ts
// payload.config.ts
import { payloadAltText } from '@kurto/payload-alt-text'

export default buildConfig({
  plugins: [
    payloadAltText({
      collections: ['media'],
      altFieldName: 'alt',
      autoGenerate: true,
      showGenerateButton: true,
      globalSettings: true,
      businessContext: 'A boutique architecture photography studio',
      location: 'London, UK',
      tone: 'plain and factual, no marketing adjectives',
      maxLength: 125,
    }),
  ],
})
```

```bash
# .env
GEMINI_API_KEY=your-gemini-api-key
```

## Config Reference

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `altFieldName` | `string` | `'alt'` | Field on the collection to populate. |
| `apiKey` | `string` | — | Gemini API key. Falls back to `process.env.GEMINI_API_KEY`. |
| `autoGenerate` | `boolean` | `true` | Generate automatically when a new file is uploaded. |
| `avoidTerms` | `string[]` | — | Terms the model must never use. Fallback for the settings global's `avoidTerms`. |
| `businessContext` | `string` | — | What the business does. Fallback for the settings global's `businessDescription`. |
| `collections` | `({} \| CollectionSlug)[]` | `['media']` | Collection slugs to enable the plugin on. |
| `disabled` | `boolean` | — | Kill switch — returns the Payload config untouched. |
| `globalSettings` | `AltTextSettingsConfig \| boolean` | `false` | Adds the admin-editable settings global. |
| `location` | `string` | — | Business location, e.g. `'London, UK'`. Fallback for the settings global's `location`. |
| `maxLength` | `number` | `125` | Max characters of generated alt text. |
| `model` | `string` | `'gemini-3.1-flash-lite'` | Gemini model id. |
| `onError` | `'empty' \| 'filename' \| 'throw'` | `'filename'` | What to do when generation fails. |
| `prompt` | `string` | — | Replace the whole prompt, ignoring the settings global entirely. |
| `showGenerateButton` | `boolean` | `true` | Show the manual Generate button on the field. |
| `sizeName` | `string` | smallest available | Prefer this generated image size when resolving bytes for the manual Generate endpoint. |
| `tone` | `string` | — | House style instruction. Fallback for the settings global's `tone`. |
| `timeoutMs` | `number` | `15000` | Request timeout, in milliseconds. |

`globalSettings` also accepts an object for fine-grained control over the settings global itself:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `slug` | `string` | `'alt-text-settings'` | Global slug. |
| `adminGroup` | `string` | `'Settings'` | Admin sidebar nav group. Shares `'Settings'` with `@kurto/payload-seo-advanced` so the two consolidate in the nav. |
| `access` | `GlobalConfig['access']` | `{ read: () => true }` | Access control for the global. |
| `fieldsOverride` | `(args: { defaultFields: Field[] }) => Field[]` | — | Override the global's default fields array. |

### Settings Global

When `globalSettings` is enabled, an **Alt Text** global is added to the admin panel with four fields, all optional and all folded into the prompt sent to Gemini:

- **`businessDescription`** (textarea, localized) — context so the model names things with the right vocabulary and specificity (e.g. "Photographer adjusting a studio softbox" rather than "a man with equipment"). Never inserted into the output verbatim, and the business is never named in the generated text.
- **`location`** (text, localized) — mentioned in the generated alt text only where the image visually supports it; the model is told never to assert a location the image doesn't show.
- **`tone`** (textarea) — house style for generated captions, e.g. "plain and factual, no marketing adjectives".
- **`avoidTerms`** (text, `hasMany`) — words the model must never use, such as competitor names or deprecated brand terms.

Values on the global take precedence over the equivalent plugin option (`businessContext`, `location`, `tone`, `avoidTerms`) when both are set; the plugin options act as a fallback when the global is absent, unreadable, or a field is left blank.

## How It Works

There are two paths to a generated description:

1. **On upload.** A `beforeValidate` hook (`generateAltTextHook`) runs before the target field's validation. It is `beforeValidate` rather than `afterChange` for two reasons: the alt field is usually `required: true`, so an upload with an empty alt value fails validation before an `afterChange` hook would ever get a chance to run; and at this point the uploaded bytes are still sitting in memory at `req.file.data`, so generation needs no round-trip back to storage. The hook skips entirely if `autoGenerate` is off, if the target field already has a non-empty value, if there's no in-memory file, or if the file's mime type isn't one Gemini accepts.

2. **The manual Generate button.** The admin field component POSTs the collection slug and document id to `POST /api/plugin-alt-text/generate`. Because there's no `req.file` on this path, the handler fetches the already-stored image back by URL (preferring the smallest generated size, or `sizeName` if set) and returns the generated text in the response rather than writing it to the document — the editor sees it in the field and decides whether to save. Clicking the button always regenerates, even if the field is already populated, since clicking it is explicit intent to replace the value.

In both paths, the prompt is built by `buildPrompt` from the resolved settings (global values with plugin-option fallbacks), the raw Gemini response is run through `sanitizeAltText` (strips wrapping quotes, strips preamble like "image of...", trims to `maxLength` on a word boundary, capitalizes the first letter), and an empty sanitized result is treated as a generation failure.

**Existing fields are preserved, not replaced.** If the collection already has a field named `altFieldName`, the plugin only adds the Generate button's client component to its `admin.components.Field` — its type, `required`, `localized`, label, and any other `admin` config are left exactly as configured. If no such field exists, the plugin adds a new `text` field named `altFieldName` with the label "Alt Text". Point `altFieldName` at a different field name to retarget which field the plugin manages.

## Cost

The default model is `gemini-3.1-flash-lite`. An image at or under 384px is a flat 258 input tokens; combined with the prompt and a short (capped) response, a single generated alt text costs on the order of **$0.00016**, or roughly **6,000 images per dollar**.

`gemini-2.5-flash-lite` is around 3x cheaper again, but it is retired on 2026-10-16 — that's why it isn't the default. Pass `model: 'gemini-2.5-flash-lite'` if you want the cheaper tier before that date, or any other Gemini vision model id.

Payload only produces the small `imageSizes` the plugin prefers when `sharp` is installed and configured. In an environment without `sharp` (for example, deploying to Cloudflare Workers), no resized variants exist, so the manual Generate endpoint falls back to the original upload. A 4000x3000 original tiles into roughly 1,032 input tokens — about **$0.00026** per image, still cheap but noticeably more than the small-image case.

## SEO

Alt text written by a human under deadline pressure tends toward either nothing or generic filler ("image1.jpg", "photo"). Alt text stuffed with keywords is arguably worse: it's a well-documented negative signal for search engines and it makes the text harder for a screen reader user to parse — the two audiences the attribute serves are not in tension here, they want the same thing.

The `businessDescription` setting exists to make generated descriptions *specific and correctly named*, not to make them marketable. It tells the model to describe "a photographer adjusting a studio softbox" rather than "a man with equipment" — domain vocabulary and appropriate specificity, nothing more. The prompt built by `buildPrompt` contains no instruction to insert keywords, and it explicitly tells the model not to mention the business by name and not to "stuff in extra terms for search purposes." Accurate, specific, keyword-free alt text is simultaneously the best outcome for accessibility and the best outcome available for image search — there's no trade-off to manage here.

## Error Handling

`onError` controls what happens when generation fails — a network error, a timeout, an invalid API key, a non-2xx response from Gemini, or a response that comes back safety-blocked or empty (these all take the same fallback path as any other failure):

- **`'filename'` (default)** — falls back to a humanized version of the uploaded filename (strips the extension, trailing UUID/hash noise, and directory path; converts separators and camelCase into spaced words; capitalizes the first letter). This is the default because the target field is typically `required: true`, and a failed third-party API call must never be the reason an upload is rejected.
- **`'empty'`** — leaves the field as submitted and lets normal field validation decide whether that's acceptable.
- **`'throw'`** — re-throws the error, failing the create/update operation outright.

All failure paths log a warning through `req.payload.logger.warn`. The manual Generate endpoint behaves differently on failure: since it never writes to the document, it always returns a JSON error response (mapped to an appropriate HTTP status) and leaves the existing field value untouched.

## Exports

| Path | Contents |
| --- | --- |
| `@kurto/payload-alt-text` | `payloadAltText` plugin function, plus `AltTextSettings`, `AltTextSettingsConfig`, `OnErrorStrategy`, `PayloadAltTextConfig` types and the `AltTextError` class |
| `@kurto/payload-alt-text/types` | TypeScript types |
| `@kurto/payload-alt-text/client` | React components for the Payload admin UI (`AltTextGenerateField`) |

## License

MIT
