import type { Field, GlobalConfig } from 'payload'

import type { GlobalSettingsConfig } from '../types.js'

export function createSeoSettingsGlobal(
  config: GlobalSettingsConfig,
  uploadsCollection?: string,
): GlobalConfig {
  const defaultFields: Field[] = [
    {
      name: 'siteName',
      type: 'text',
      label: 'Site Name',
      localized: true,
      admin: {
        description: 'Appended to meta titles automatically (e.g. "Page Title | Site Name")',
      },
    },
    {
      name: 'titleSeparator',
      type: 'select',
      label: 'Title Separator',
      defaultValue: '|',
      options: [
        { label: 'Dash (–)', value: '-' },
        { label: 'Pipe (|)', value: '|' },
        { label: 'Bullet (•)', value: '•' },
        { label: 'None', value: '' },
      ],
    },
    {
      name: 'defaults',
      type: 'group',
      label: 'Defaults',
      fields: [
        ...(uploadsCollection
          ? [
              {
                name: 'ogImage',
                type: 'upload' as const,
                label: 'Default OG Image',
                relationTo: uploadsCollection,
                admin: {
                  description:
                    'Used as fallback when no page-specific meta image is set. Must be at least 1200x630px for best results.',
                },
              },
            ]
          : []),
        {
          name: 'fallbackDescription',
          type: 'textarea',
          label: 'Fallback Meta Description',
          localized: true,
          admin: {
            description: 'Used when no page-specific meta description is set.',
          },
        },
      ],
    },
    {
      name: 'knowledgeGraph',
      type: 'group',
      label: 'Knowledge Graph',
      admin: {
        description: 'Schema.org Organization or Person data for search engine knowledge panels.',
      },
      fields: [
        {
          name: 'type',
          type: 'select',
          label: 'Entity Type',
          defaultValue: 'organization',
          options: [
            { label: 'Organization', value: 'organization' },
            { label: 'Person', value: 'person' },
          ],
        },
        {
          name: 'name',
          type: 'text',
          label: 'Name',
          localized: true,
        },
        ...(uploadsCollection
          ? [
              {
                name: 'logo',
                type: 'upload' as const,
                label: 'Logo',
                relationTo: uploadsCollection,
                admin: {
                  condition: (_: any, siblingData: any) => siblingData?.type === 'organization',
                },
              },
            ]
          : []),
        {
          name: 'contactEmail',
          type: 'email',
          label: 'Contact Email',
        },
        {
          name: 'contactPhone',
          type: 'text',
          label: 'Contact Phone',
        },
        {
          name: 'address',
          type: 'group',
          label: 'Address',
          admin: {
            condition: (_: any, siblingData: any) => siblingData?.type === 'organization',
          },
          fields: [
            {
              name: 'streetAddress',
              type: 'text',
              label: 'Street Address',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'city',
                  type: 'text',
                  label: 'City',
                },
                {
                  name: 'state',
                  type: 'text',
                  label: 'State / Province',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'postalCode',
                  type: 'text',
                  label: 'Postal Code',
                },
                {
                  name: 'country',
                  type: 'text',
                  label: 'Country',
                },
              ],
            },
          ],
        },
        {
          name: 'socialLinks',
          type: 'array',
          label: 'Social Links',
          fields: [
            {
              name: 'platform',
              type: 'select',
              label: 'Platform',
              options: [
                { label: 'Facebook', value: 'facebook' },
                { label: 'Twitter / X', value: 'twitter' },
                { label: 'Instagram', value: 'instagram' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'YouTube', value: 'youtube' },
                { label: 'TikTok', value: 'tiktok' },
                { label: 'Pinterest', value: 'pinterest' },
                { label: 'GitHub', value: 'github' },
              ],
            },
            {
              name: 'url',
              type: 'text',
              label: 'URL',
            },
          ],
        },
      ],
    },
    {
      name: 'indexing',
      type: 'group',
      label: 'Indexing',
      fields: [
        {
          name: 'noindex',
          type: 'checkbox',
          label: 'Prevent search engines from indexing this site',
          defaultValue: false,
          admin: {
            description:
              'Enable this on staging environments to prevent search engine indexing. Adds a site-wide noindex directive.',
          },
        },
      ],
    },
  ]

  const finalFields = config.fieldsOverride
    ? config.fieldsOverride({ defaultFields })
    : defaultFields

  return {
    slug: config.slug ?? 'seo-settings',
    access: config.access,
    admin: {
      group: config.adminGroup ?? 'SEO',
    },
    fields: finalFields,
    label: 'SEO Settings',
  }
}
