import type { Field, GlobalConfig } from 'payload'

import type { AltTextSettingsConfig } from '../types.js'
import { DEFAULT_ADMIN_GROUP, DEFAULT_SETTINGS_SLUG } from '../defaults.js'

// The Gemini API key is deliberately NOT a field here — a database-stored billable secret would
// land in DB backups and be readable over the Payload REST API by any authenticated admin, so it
// stays in `process.env.GEMINI_API_KEY`.

export function createAltTextSettingsGlobal(config: AltTextSettingsConfig): GlobalConfig {
  const defaultFields: Field[] = [
    {
      name: 'businessDescription',
      type: 'textarea',
      label: 'Business Description',
      localized: true,
      admin: {
        description:
          'Context for the model so it names things with the right vocabulary and specificity ' +
          '(e.g. "Photographer adjusting a studio softbox" rather than "a man with equipment"). ' +
          'This text is never inserted into the generated alt text and the business will not be ' +
          'name-dropped.',
      },
    },
    {
      name: 'location',
      type: 'text',
      label: 'Location',
      localized: true,
      admin: {
        description:
          'Mentioned in generated alt text only where the image visually supports it. Format, ' +
          'e.g. "London, UK".',
      },
    },
    {
      name: 'tone',
      type: 'textarea',
      label: 'Tone & Style',
      admin: {
        description:
          'House style for generated captions, e.g. "plain and factual, no marketing adjectives".',
      },
    },
    {
      name: 'avoidTerms',
      type: 'text',
      hasMany: true,
      label: 'Terms to Avoid',
      admin: {
        description:
          'Words the model must never use in generated alt text — competitor names, deprecated ' +
          'brand terms, and the like.',
      },
    },
  ]

  const finalFields = config.fieldsOverride
    ? config.fieldsOverride({ defaultFields })
    : defaultFields

  return {
    slug: config.slug ?? DEFAULT_SETTINGS_SLUG,
    access: config.access ?? { read: () => true },
    admin: {
      group: config.adminGroup ?? DEFAULT_ADMIN_GROUP,
    },
    fields: finalFields,
    label: 'Alt Text',
  }
}
