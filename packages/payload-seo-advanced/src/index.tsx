import type { Config, Field, GroupField, TabsField } from 'payload'

import { deepMergeSimple } from 'payload/shared'

import type {
  AdvancedFieldsConfig,
  GenerateDescription,
  GenerateImage,
  GenerateTitle,
  GenerateURL,
  GlobalSettingsConfig,
  SEOPluginConfig,
  StructuredDataConfig,
} from './types.js'

import { CanonicalUrlField } from './fields/CanonicalUrl/index.js'
import { FocusKeywordField } from './fields/FocusKeyword/index.js'
import { MetaDescriptionField } from './fields/MetaDescription/index.js'
import { MetaImageField } from './fields/MetaImage/index.js'
import { MetaTitleField } from './fields/MetaTitle/index.js'
import { OverviewField } from './fields/Overview/index.js'
import { PreviewField } from './fields/Preview/index.js'
import { RobotsMetaField } from './fields/RobotsMeta/index.js'
import { StructuredDataFields } from './fields/StructuredData/index.js'
import { createSeoSettingsGlobal } from './globals/SeoSettings.js'
import { translations } from './translations/index.js'

export const payloadSeoAdvanced =
  (pluginConfig: SEOPluginConfig) =>
  (config: Config): Config => {
    // Compute global settings config early so field factories can reference it
    const globalSettingsConfig: GlobalSettingsConfig | undefined = pluginConfig?.globalSettings
      ? typeof pluginConfig.globalSettings === 'object'
        ? pluginConfig.globalSettings
        : {}
      : undefined

    const seoSettingsSlug = globalSettingsConfig?.slug ?? 'seo-settings'
    const hasGlobalSettings = !!globalSettingsConfig

    // Determine the best admin group for SEO settings
    const getDefaultAdminGroup = (): string => {
      // Check if user explicitly specified a group
      if (globalSettingsConfig?.adminGroup) {
        return globalSettingsConfig.adminGroup
      }

      // Check if there are existing globals using 'Settings' group
      const existingSettingsGroups = config.globals?.filter(
        (global) => global.admin?.group === 'Settings',
      )

      // Check if there are existing globals using 'SEO' group
      const existingSeoGroups = config.globals?.filter((global) => global.admin?.group === 'SEO')

      // If there are existing settings groups, use Settings to consolidate
      if (existingSettingsGroups && existingSettingsGroups.length > 0) {
        return 'Settings'
      }

      // If there are existing SEO groups, use SEO to consolidate
      if (existingSeoGroups && existingSeoGroups.length > 0) {
        return 'SEO'
      }

      // Default to Settings to reduce sidebar sections as requested
      return 'Settings'
    }

    const defaultAdminGroup = getDefaultAdminGroup()

    const defaultFields: Field[] = [
      OverviewField({}),
      MetaTitleField({
        hasGenerateFn: typeof pluginConfig?.generateTitle === 'function',
        hasGlobalSettings,
      }),
      MetaDescriptionField({
        hasGenerateFn: typeof pluginConfig?.generateDescription === 'function',
      }),
      ...(pluginConfig?.uploadsCollection
        ? [
            MetaImageField({
              hasGenerateFn: typeof pluginConfig?.generateImage === 'function',
              relationTo: pluginConfig.uploadsCollection as string,
            }),
          ]
        : []),
      PreviewField({
        hasGenerateFn: typeof pluginConfig?.generateURL === 'function',
        hasGlobalSettings,
      }),
      ...(hasGlobalSettings
        ? [
            {
              name: 'disableSiteName',
              type: 'checkbox' as const,
              admin: {
                hidden: true,
              },
              label: 'Disable Site Name Suffix',
            },
          ]
        : []),
    ]

    // Phase 2: Advanced per-page fields
    if (pluginConfig?.advancedFields) {
      const advConfig: AdvancedFieldsConfig =
        typeof pluginConfig.advancedFields === 'object' ? pluginConfig.advancedFields : {}
      if (advConfig.canonicalUrl !== false) {
        defaultFields.push(CanonicalUrlField())
      }
      if (advConfig.robotsMeta !== false) {
        defaultFields.push(RobotsMetaField())
      }
      if (advConfig.focusKeyword !== false) {
        defaultFields.push(FocusKeywordField())
      }
    }

    // Phase 3: Structured data fields
    if (pluginConfig?.structuredData) {
      const sdConfig: StructuredDataConfig =
        typeof pluginConfig.structuredData === 'object' ? pluginConfig.structuredData : {}
      const sdFields = StructuredDataFields(sdConfig)
      if (sdConfig.fieldsOverride) {
        defaultFields.push(...sdConfig.fieldsOverride({ defaultFields: [sdFields] }))
      } else {
        defaultFields.push(sdFields)
      }
    }

    const seoFields: GroupField[] = [
      {
        name: 'meta',
        type: 'group',
        fields: [
          ...(pluginConfig?.fieldsOverride && typeof pluginConfig.fieldsOverride === 'function'
            ? pluginConfig.fieldsOverride({ defaultFields })
            : defaultFields),
        ],
        interfaceName: pluginConfig?.interfaceName || 'SEOMetadata',
        label: 'SEO',
      },
    ]

    return {
      ...config,
      collections:
        config.collections?.map((collection) => {
          const { slug } = collection
          const isEnabled = pluginConfig?.collections?.includes(slug)

          if (isEnabled) {
            if (pluginConfig?.tabbedUI) {
              // prevent issues with auth enabled collections having an email field that shouldn't be moved to the SEO tab
              const emailField =
                collection.auth &&
                !(typeof collection.auth === 'object' && collection.auth.disableLocalStrategy) &&
                collection.fields?.find((field) => 'name' in field && field.name === 'email')
              const hasOnlyEmailField = collection.fields?.length === 1 && emailField

              const seoTabs: TabsField[] = hasOnlyEmailField
                ? [
                    {
                      type: 'tabs',
                      tabs: [
                        {
                          fields: seoFields,
                          label: 'SEO',
                        },
                      ],
                    },
                  ]
                : [
                    {
                      type: 'tabs',
                      tabs: [
                        // append a new tab onto the end of the tabs array, if there is one at the first index
                        // if needed, create a new `Content` tab in the first index for this collection's base fields
                        ...(collection?.fields?.[0]?.type === 'tabs' &&
                        collection?.fields?.[0]?.tabs
                          ? collection.fields[0].tabs
                          : [
                              {
                                fields: [
                                  ...(emailField
                                    ? collection.fields.filter(
                                        (field) => 'name' in field && field.name !== 'email',
                                      )
                                    : collection.fields),
                                ],
                                label: collection?.labels?.singular || 'Content',
                              },
                            ]),
                        {
                          fields: seoFields,
                          label: 'SEO',
                        },
                      ],
                    },
                  ]

              return {
                ...collection,
                fields: [
                  ...(emailField ? [emailField] : []),
                  ...seoTabs,
                  ...(collection?.fields?.[0]?.type === 'tabs' ? collection.fields.slice(1) : []),
                ],
                hooks: {
                  ...collection.hooks,
                  beforeChange: [...(collection.hooks?.beforeChange ?? [])],
                },
              }
            }

            return {
              ...collection,
              fields: [...(collection?.fields || []), ...seoFields],
            }
          }

          return collection
        }) || [],
      endpoints: [
        ...(config.endpoints ?? []),
        {
          handler: async (req) => {
            const data: Omit<
              Parameters<GenerateTitle>[0],
              'collectionConfig' | 'globalConfig' | 'req'
            > = await req.json?.()

            const reqData = data ?? req.data

            let result = pluginConfig.generateTitle
              ? await pluginConfig.generateTitle({
                  ...data,
                  collectionConfig: config.collections?.find(
                    (c) => c.slug === reqData.collectionSlug,
                  ),
                  globalConfig: config.globals?.find((g) => g.slug === reqData.globalSlug),
                  req,
                } satisfies Parameters<GenerateTitle>[0])
              : ''

            // Append site name from global settings if configured
            const disableSiteName = (reqData as any)?.doc?.meta?.disableSiteName
            if (globalSettingsConfig && result && !disableSiteName) {
              try {
                const seoSettings = await req.payload.findGlobal({ slug: seoSettingsSlug as any })
                const siteName = (seoSettings as any)?.siteName
                if (siteName && !result.includes(siteName)) {
                  const separator = (seoSettings as any)?.titleSeparator ?? '|'
                  result = `${result} ${separator} ${siteName}`
                }
              } catch {
                // Global may not exist yet, silently continue
              }
            }

            return new Response(JSON.stringify({ result }), { status: 200 })
          },
          method: 'post',
          path: '/plugin-seo/generate-title',
        },
        {
          handler: async (req) => {
            const data: Omit<
              Parameters<GenerateTitle>[0],
              'collectionConfig' | 'globalConfig' | 'req'
            > = await req.json?.()

            const reqData = data ?? req.data

            const result = pluginConfig.generateDescription
              ? await pluginConfig.generateDescription({
                  ...data,
                  collectionConfig: config.collections?.find(
                    (c) => c.slug === reqData.collectionSlug,
                  ),
                  globalConfig: config.globals?.find((g) => g.slug === reqData.globalSlug),
                  req,
                } satisfies Parameters<GenerateDescription>[0])
              : ''
            return new Response(JSON.stringify({ result }), { status: 200 })
          },
          method: 'post',
          path: '/plugin-seo/generate-description',
        },
        {
          handler: async (req) => {
            const data: Omit<
              Parameters<GenerateTitle>[0],
              'collectionConfig' | 'globalConfig' | 'req'
            > = await req.json?.()

            const reqData = data ?? req.data

            const result = pluginConfig.generateURL
              ? await pluginConfig.generateURL({
                  ...data,
                  collectionConfig: config.collections?.find(
                    (c) => c.slug === reqData.collectionSlug,
                  ),
                  globalConfig: config.globals?.find((g) => g.slug === reqData.globalSlug),
                  req,
                } satisfies Parameters<GenerateURL>[0])
              : ''
            return new Response(JSON.stringify({ result }), { status: 200 })
          },
          method: 'post',
          path: '/plugin-seo/generate-url',
        },
        {
          handler: async (req) => {
            const data: Omit<
              Parameters<GenerateTitle>[0],
              'collectionConfig' | 'globalConfig' | 'req'
            > = await req.json?.()

            const reqData = data ?? req.data

            const result = pluginConfig.generateImage
              ? await pluginConfig.generateImage({
                  ...data,
                  collectionConfig: config.collections?.find(
                    (c) => c.slug === reqData.collectionSlug,
                  ),
                  globalConfig: config.globals?.find((g) => g.slug === reqData.globalSlug),
                  req,
                } satisfies Parameters<GenerateImage>[0])
              : ''
            return new Response(JSON.stringify({ result }), { status: 200 })
          },
          method: 'post',
          path: '/plugin-seo/generate-image',
        },
        ...(globalSettingsConfig
          ? [
              {
                handler: async (req: any) => {
                  try {
                    const locale =
                      req.query?.locale || (typeof req.locale === 'string' ? req.locale : undefined)
                    const seoSettings = await req.payload.findGlobal({
                      slug: seoSettingsSlug as any,
                      ...(locale ? { locale } : {}),
                    })
                    return new Response(
                      JSON.stringify({
                        siteName: (seoSettings as any)?.siteName ?? '',
                        titleSeparator: (seoSettings as any)?.titleSeparator ?? '|',
                      }),
                      { status: 200 },
                    )
                  } catch {
                    return new Response(JSON.stringify({ siteName: '', titleSeparator: '|' }), {
                      status: 200,
                    })
                  }
                },
                method: 'get' as const,
                path: '/plugin-seo/seo-settings',
              },
            ]
          : []),
      ],
      globals: [
        ...(config.globals?.map((global) => {
          const { slug } = global
          const isEnabled = pluginConfig?.globals?.includes(slug)

          if (isEnabled) {
            if (pluginConfig?.tabbedUI) {
              const seoTabs: TabsField[] = [
                {
                  type: 'tabs',
                  tabs: [
                    // append a new tab onto the end of the tabs array, if there is one at the first index
                    // if needed, create a new `Content` tab in the first index for this global's base fields
                    ...(global?.fields?.[0]?.type === 'tabs' && global?.fields?.[0].tabs
                      ? global.fields[0].tabs
                      : [
                          {
                            fields: [...(global?.fields || [])],
                            label: global?.label || 'Content',
                          },
                        ]),
                    {
                      fields: seoFields,
                      label: 'SEO',
                    },
                  ],
                },
              ]

              return {
                ...global,
                fields: [
                  ...seoTabs,
                  ...(global?.fields?.[0]?.type === 'tabs' ? global.fields.slice(1) : []),
                ],
              }
            }

            return {
              ...global,
              fields: [...(global?.fields || []), ...seoFields],
            }
          }

          return global
        }) || []),
        // Phase 1: Add SEO Settings global when configured
        ...(globalSettingsConfig
          ? [
              createSeoSettingsGlobal(
                {
                  ...globalSettingsConfig,
                  adminGroup: globalSettingsConfig.adminGroup ?? defaultAdminGroup,
                },
                pluginConfig.uploadsCollection as string | undefined,
              ),
            ]
          : []),
      ],
      i18n: {
        ...config.i18n,
        translations: deepMergeSimple(translations, config.i18n?.translations ?? {}),
      },
    }
  }
