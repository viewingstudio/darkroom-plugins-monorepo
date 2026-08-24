import type { Config, Field } from 'payload'

import type {
  AltTextSettingsConfig,
  PayloadAltTextConfig,
  ResolvedAltTextOptions,
} from './types.js'

import {
  DEFAULT_ADMIN_GROUP,
  DEFAULT_ALT_FIELD_NAME,
  DEFAULT_COLLECTIONS,
  DEFAULT_MAX_LENGTH,
  DEFAULT_MODELS,
  DEFAULT_SETTINGS_SLUG,
  DEFAULT_TIMEOUT_MS,
} from './defaults.js'
import { resolveProviderName } from './providers/index.js'
import { createGenerateAltHandler } from './endpoints/generateAltHandler.js'
import { createGenerateFromBytesHandler } from './endpoints/generateFromBytesHandler.js'
import { altTextField } from './fields/altTextField.js'
import { createAltTextSettingsGlobal } from './globals/AltTextSettings.js'
import { generateAltTextHook } from './hooks/generateAltText.js'

export type {
  AltTextProvider,
  AltTextSettings,
  AltTextSettingsConfig,
  OnErrorStrategy,
  PayloadAltTextConfig,
} from './types.js'
export { AltTextError } from './types.js'

export const payloadAltText =
  (pluginOptions: PayloadAltTextConfig = {}) =>
  (config: Config): Config => {
    if (pluginOptions.disabled) {
      return config
    }

    const settingsConfig: AltTextSettingsConfig | undefined = pluginOptions.globalSettings
      ? typeof pluginOptions.globalSettings === 'object'
        ? pluginOptions.globalSettings
        : {}
      : undefined

    const settingsSlug = settingsConfig ? (settingsConfig.slug ?? DEFAULT_SETTINGS_SLUG) : undefined

    const enabledSlugs = (pluginOptions.collections ?? DEFAULT_COLLECTIONS) as string[]
    const altFieldName = pluginOptions.altFieldName ?? DEFAULT_ALT_FIELD_NAME
    const showGenerateButton = pluginOptions.showGenerateButton ?? true

    const provider = resolveProviderName(pluginOptions)

    const options: ResolvedAltTextOptions = {
      altFieldName,
      apiKey: pluginOptions.apiKey,
      autoGenerate: pluginOptions.autoGenerate ?? true,
      avoidTerms: pluginOptions.avoidTerms,
      businessContext: pluginOptions.businessContext,
      location: pluginOptions.location,
      maxLength: pluginOptions.maxLength ?? DEFAULT_MAX_LENGTH,
      model: pluginOptions.model ?? DEFAULT_MODELS[provider],
      onError: pluginOptions.onError ?? 'filename',
      prompt: pluginOptions.prompt,
      provider,
      settingsSlug,
      sizeName: pluginOptions.sizeName,
      timeoutMs: pluginOptions.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      tone: pluginOptions.tone,
    }

    return {
      ...config,
      collections: config.collections?.map((collection) => {
        if (!enabledSlugs.includes(collection.slug)) {
          return collection
        }

        const existingFields = collection.fields ?? []
        const targetIndex = existingFields.findIndex(
          (field) => 'name' in field && field.name === altFieldName,
        )

        let fields: Field[]

        if (targetIndex === -1) {
          fields = [
            ...existingFields,
            altTextField(undefined, {
              altFieldName,
              autoGenerate: options.autoGenerate,
              showGenerateButton,
            }),
          ]
        } else {
          fields = existingFields.map((field, index) =>
            index === targetIndex
              ? altTextField(field, {
                  altFieldName,
                  autoGenerate: options.autoGenerate,
                  showGenerateButton,
                })
              : field,
          )
        }

        return {
          ...collection,
          fields,
          hooks: {
            ...collection.hooks,
            beforeValidate: [
              generateAltTextHook(options),
              ...(collection.hooks?.beforeValidate ?? []),
            ],
          },
        }
      }),
      endpoints: [
        ...(config.endpoints ?? []),
        {
          handler: createGenerateAltHandler(options),
          method: 'post',
          path: '/plugin-alt-text/generate',
        },
        {
          handler: createGenerateFromBytesHandler(options),
          method: 'post',
          path: '/plugin-alt-text/generate-from-bytes',
        },
      ],
      globals: [
        ...(config.globals ?? []),
        ...(settingsConfig
          ? [
              createAltTextSettingsGlobal({
                ...settingsConfig,
                // Shares 'Settings' with payload-seo-advanced so the two consolidate in the nav.
                adminGroup: settingsConfig.adminGroup ?? DEFAULT_ADMIN_GROUP,
              }),
            ]
          : []),
      ],
    }
  }
