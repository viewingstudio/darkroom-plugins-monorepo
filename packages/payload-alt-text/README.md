# @kurto/payload-alt-text

AI-generated alt text for Payload CMS uploads, powered by Gemini or Claude.

## Features

- **Auto-generate on upload** — a `beforeValidate` hook writes an alt text description the moment a file is uploaded, before the field's `required` validation can reject an empty value.
- **Manual Generate button** — an admin-only endpoint lets an editor regenerate the description for an existing upload and review it before saving.
- **Wraps your existing field** — if the collection already has an `alt`-like field, the plugin adds the Generate button to it and keeps its `required`, `localized`, label, and `admin` config untouched; only a new field is created from scratch.
- **Never overwrites on upload** — the hook only runs when the target field is empty, so hand-written alt text is always left alone.
- **Business-aware prompting, editable in the admin panel** — set `globalSettings: true` and an **Alt Text** global appears under Settings, where an admin can edit the business description, location, house tone, and terms to avoid without a redeploy. All four are folded into the prompt and never appear in the output.
- **Consistent sentence formatting** — generated alt text is always capitalized and always terminated with a full stop (an existing `!`, `?`, or `…` is kept as-is), including after truncation.
- **No keyword stuffing** — the prompt has no instruction to insert keywords or the brand name, because that degrades both search relevance and the accessibility the attribute exists for.
- **Two providers, one config** — `provider: 'gemini'` (default) or `provider: 'anthropic'`. Everything else — the prompt, the settings global, sanitizing, the Generate button, the fallback strategy — is identical across both, so switching is a one-line change.
- **Graceful failure** — a failed or safety-blocked API call falls back to a humanized filename (or an empty value, or a thrown error) rather than silently blocking an upload.
- **No stored secret** — the API key lives only in `process.env.GEMINI_API_KEY` / `process.env.ANTHROPIC_API_KEY`, never in the database.

## Installation

```bash
pnpm add @kurto/payload-alt-text
```

Peer dependencies: `@payloadcms/ui`, `payload` (`^3.74.0`), `react` and `react-dom` (`^18.0.0 || ^19.0.0`).

You must also set the API key for whichever provider you use — `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` — in the environment (or pass `apiKey` explicitly — see below).

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
      // Adds the admin-editable "Alt Text" global under Settings, where an editor can change
      // businessDescription / location / tone / avoidTerms without touching this file.
      globalSettings: true,
      // Code-level fallbacks, used only when the matching field on the global is blank.
      businessContext: 'A boutique architecture photography studio',
      location: 'London, UK',
      tone: 'plain and factual, no marketing adjectives',
      maxLength: 125,
    }),
  ],
})
```

`globalSettings` defaults to `false`, so the admin-editable global is opt-in. Enable it if you want editors to be able to tune the prompt context themselves; leave it off and the plugin options above are the only source of prompt context.

```bash
# .env
GEMINI_API_KEY=your-gemini-api-key
```

### Using Claude instead

```ts
payloadAltText({
  collections: ['media'],
  provider: 'anthropic',
  // model defaults to 'claude-haiku-4-5-20251001' once the provider is anthropic
})
```

```bash
# .env
ANTHROPIC_API_KEY=your-anthropic-api-key
```

`provider` may be left off entirely if the model id makes it obvious: a `model` starting with `claude` resolves to `'anthropic'`, one starting with `gemini` to `'gemini'`. An explicit `provider` always wins over that inference, and with neither set the provider is `'gemini'` — so upgrading an existing install never silently changes which API you're billed for.

The key is read from the env var belonging to the resolved provider, and only that one: an `ANTHROPIC_API_KEY` sitting in the environment is never used for a Gemini request, or vice versa.

## Config Reference

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `altFieldName` | `string` | `'alt'` | Field on the collection to populate. |
| `apiKey` | `string` | — | Provider API key. Falls back to `process.env.GEMINI_API_KEY` or `process.env.ANTHROPIC_API_KEY`, matching the resolved provider. |
| `autoGenerate` | `boolean` | `true` | Generate automatically when a new file is uploaded. |
| `avoidTerms` | `string[]` | — | Terms the model must never use. Fallback for the settings global's `avoidTerms`. |
| `businessContext` | `string` | — | What the business does. Fallback for the settings global's `businessDescription`. |
| `collections` | `({} \| CollectionSlug)[]` | `['media']` | Collection slugs to enable the plugin on. |
| `disabled` | `boolean` | — | Kill switch — returns the Payload config untouched. |
| `globalSettings` | `AltTextSettingsConfig \| boolean` | `false` | Adds the admin-editable settings global. |
| `location` | `string` | — | Business location, e.g. `'London, UK'`. Fallback for the settings global's `location`. |
| `maxLength` | `number` | `125` | Max characters of generated alt text. |
| `model` | `string` | provider default | Model id. Defaults to `'gemini-3.1-flash-lite'` or `'claude-haiku-4-5-20251001'` depending on `provider`. |
| `onError` | `'empty' \| 'filename' \| 'throw'` | `'filename'` | What to do when generation fails. |
| `prompt` | `string` | — | Replace the whole prompt, ignoring the settings global entirely. |
| `provider` | `'anthropic' \| 'gemini'` | inferred from `model`, else `'gemini'` | Vision API to generate with. |
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

### Settings Global — editing prompt context from the admin UI

`businessContext`, `location`, `tone` and `avoidTerms` are all editable from the admin panel; the plugin options of the same names are only code-level fallbacks. Pass `globalSettings: true` and an **Alt Text** global appears in the admin sidebar under **Settings** with four fields, all optional and all folded into the prompt sent to Gemini:

- **`businessDescription`** (textarea, localized) — context so the model names things with the right vocabulary and specificity (e.g. "Photographer adjusting a studio softbox" rather than "a man with equipment"). Never inserted into the output verbatim, and the business is never named in the generated text.
- **`location`** (text, localized) — mentioned in the generated alt text only where the image visually supports it; the model is told never to assert a location the image doesn't show.
- **`tone`** (textarea) — house style for generated captions, e.g. "plain and factual, no marketing adjectives".
- **`avoidTerms`** (text, `hasMany`) — words the model must never use, such as competitor names or deprecated brand terms.

Values on the global take precedence over the equivalent plugin option (`businessContext`, `location`, `tone`, `avoidTerms`) when both are set; the plugin options act as a fallback when the global is absent, unreadable, or a field is left blank. The global is read once per generation with no caching, so an edit in the admin panel takes effect on the very next upload — no redeploy or restart.

`businessDescription` and `location` are `localized`, so with Payload localization enabled each locale can carry its own context. Use `fieldsOverride` to add, remove, or reorder fields on the global — for example to make the whole group read-only for non-admin roles, or to add your own field and read it back through a custom `prompt`.

## How It Works

There are two paths to a generated description:

1. **On upload.** A `beforeValidate` hook (`generateAltTextHook`) runs before the target field's validation. It is `beforeValidate` rather than `afterChange` for two reasons: the alt field is usually `required: true`, so an upload with an empty alt value fails validation before an `afterChange` hook would ever get a chance to run; and at this point the uploaded bytes are still sitting in memory at `req.file.data`, so generation needs no round-trip back to storage. The hook skips entirely if `autoGenerate` is off, if the target field already has a non-empty value, if there's no in-memory file, or if the file's mime type isn't one the resolved provider accepts.

2. **The manual Generate button.** The admin field component POSTs the collection slug and document id to `POST /api/plugin-alt-text/generate`. Because there's no `req.file` on this path, the handler fetches the already-stored image back by URL (preferring the smallest generated size, or `sizeName` if set) and returns the generated text in the response rather than writing it to the document — the editor sees it in the field and decides whether to save. Clicking the button always regenerates, even if the field is already populated, since clicking it is explicit intent to replace the value.

In both paths, the prompt is built by `buildPrompt` from the resolved settings (global values with plugin-option fallbacks), the raw provider response is run through `sanitizeAltText`, and an empty sanitized result is treated as a generation failure. `sanitizeAltText`:

1. collapses whitespace runs and trims;
2. strips wrapping quotes (straight and curly) and preamble like "image of…", "this photo shows…", "alt text:";
3. truncates to `maxLength` on a word boundary, with no ellipsis and no dangling punctuation;
4. capitalizes the first letter;
5. **terminates the sentence with a full stop.** An existing `.`, `!`, `?` or `…` is left as the terminator; anything else gets a `.` appended. `maxLength` bounds the final value *including* that full stop, so when a stop has to be added the truncation budget is one character shorter.

Alt text is read aloud as a sentence, and screen readers use terminal punctuation as a prosodic cue — without it, the description runs into whatever follows the image. The model is also asked for a full stop in the prompt itself; the sanitizer is the guarantee rather than the primary mechanism.

### What each provider accepts

| | Gemini | Anthropic |
| --- | --- | --- |
| Mime types | JPEG, PNG, WebP, GIF, HEIC, HEIF | JPEG, PNG, WebP, GIF |
| Max image | 14MB | 3.75MB (Anthropic's 5MB cap is measured after base64 expansion) |
| Env var | `GEMINI_API_KEY` | `ANTHROPIC_API_KEY` |

Both limits are checked before a request goes out, so an oversized or unsupported image costs nothing and fails with a clear message rather than a 413 from the provider. On upload, an unsupported mime type is a silent skip (the field is left for a human) while an oversized file takes the `onError` path; through the Generate button both return a `400`.

A HEIC upload therefore generates under Gemini and is skipped under Anthropic. If you're switching to `'anthropic'` on a site that takes HEIC straight off iPhones, make sure `sharp` is producing JPEG/WebP `imageSizes` — the Generate button prefers a resized variant, so it will still work where the auto-generate hook (which only ever sees the original bytes) skips.

**Existing fields are preserved, not replaced.** If the collection already has a field named `altFieldName`, the plugin only adds the Generate button's client component to its `admin.components.Field` — its type, `required`, `localized`, label, and any other `admin` config are left exactly as configured. If no such field exists, the plugin adds a new `text` field named `altFieldName` with the label "Alt Text". Point `altFieldName` at a different field name to retarget which field the plugin manages.

## Cost

The default model is `gemini-3.1-flash-lite`; with `provider: 'anthropic'` it is `claude-haiku-4-5-20251001`. An image at or under 384px is a flat 258 input tokens; combined with the prompt and a short (capped) response, a single generated alt text costs on the order of **$0.00016**, or roughly **6,000 images per dollar**.

`gemini-2.5-flash-lite` is around 3x cheaper again, but it is retired on 2026-10-16 — that's why it isn't the default. Pass `model: 'gemini-2.5-flash-lite'` if you want the cheaper tier before that date, or any other Gemini vision model id.

Payload only produces the small `imageSizes` the plugin prefers when `sharp` is installed and configured. In an environment without `sharp` (for example, deploying to Cloudflare Workers), no resized variants exist, so the manual Generate endpoint falls back to the original upload. A 4000x3000 original tiles into roughly 1,032 input tokens — about **$0.00026** per image, still cheap but noticeably more than the small-image case.

Claude Haiku 4.5 is the more expensive of the two. Anthropic bills images at roughly `width × height / 750` input tokens, so a 384px square image is about 197 tokens; with the prompt and a capped ~40-token response, a generated alt text lands around **$0.0003**, or roughly **3,000 images per dollar**. That's a couple of times the Gemini Flash-Lite figure and still small in absolute terms — a 10,000-image library is about $3. Without small `imageSizes` the original is sent instead, and Anthropic scales anything over ~1568px down before billing, so a large original caps out near 1,600 tokens (about **$0.0016** each).

Both providers charge per request with no minimum, so the choice is about which credits you'd rather spend, not about a structural cost difference.

## SEO

Alt text written by a human under deadline pressure tends toward either nothing or generic filler ("image1.jpg", "photo"). Alt text stuffed with keywords is arguably worse: it's a well-documented negative signal for search engines and it makes the text harder for a screen reader user to parse — the two audiences the attribute serves are not in tension here, they want the same thing.

The `businessDescription` setting exists to make generated descriptions *specific and correctly named*, not to make them marketable. It tells the model to describe "a photographer adjusting a studio softbox" rather than "a man with equipment" — domain vocabulary and appropriate specificity, nothing more. The prompt built by `buildPrompt` contains no instruction to insert keywords, and it explicitly tells the model not to mention the business by name and not to "stuff in extra terms for search purposes." Accurate, specific, keyword-free alt text is simultaneously the best outcome for accessibility and the best outcome available for image search — there's no trade-off to manage here.

## Error Handling

`onError` controls what happens when generation fails — a network error, a timeout, an invalid API key, an image over the provider's size cap, a non-2xx response from the provider, or a response that comes back safety-blocked, refused, or empty (these all take the same fallback path as any other failure):

- **`'filename'` (default)** — falls back to a humanized version of the uploaded filename (strips the extension, trailing UUID/hash noise, and directory path; converts separators and camelCase into spaced words; capitalizes the first letter). This is the default because the target field is typically `required: true`, and a failed third-party API call must never be the reason an upload is rejected.
- **`'empty'`** — leaves the field as submitted and lets normal field validation decide whether that's acceptable.
- **`'throw'`** — re-throws the error, failing the create/update operation outright.

All failure paths log a warning through `req.payload.logger.warn`. The manual Generate endpoint behaves differently on failure: since it never writes to the document, it always returns a JSON error response (mapped to an appropriate HTTP status) and leaves the existing field value untouched.

## Exports

| Path | Contents |
| --- | --- |
| `@kurto/payload-alt-text` | `payloadAltText` plugin function, plus `AltTextProvider`, `AltTextSettings`, `AltTextSettingsConfig`, `OnErrorStrategy`, `PayloadAltTextConfig` types and the `AltTextError` class |
| `@kurto/payload-alt-text/types` | TypeScript types |
| `@kurto/payload-alt-text/client` | React components for the Payload admin UI (`AltTextGenerateField`) |

## License

MIT
