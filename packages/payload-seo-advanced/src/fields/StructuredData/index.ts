import type { GroupField } from 'payload'

import type { StructuredDataConfig } from '../../types.js'

const ALL_SCHEMA_TYPES = ['article', 'product', 'service', 'event', 'localBusiness'] as const

export const StructuredDataFields = (config?: StructuredDataConfig): GroupField => {
  const schemaTypes = config?.schemaTypes ?? [...ALL_SCHEMA_TYPES]

  const schemaOptions = [
    { label: 'None', value: 'none' },
    ...(schemaTypes.includes('article') ? [{ label: 'Article', value: 'article' }] : []),
    ...(schemaTypes.includes('product') ? [{ label: 'Product', value: 'product' }] : []),
    ...(schemaTypes.includes('service') ? [{ label: 'Service', value: 'service' }] : []),
    ...(schemaTypes.includes('event') ? [{ label: 'Event', value: 'event' }] : []),
    ...(schemaTypes.includes('localBusiness')
      ? [{ label: 'Local Business', value: 'localBusiness' }]
      : []),
  ]

  return {
    name: 'structuredData',
    type: 'group',
    label: 'Structured Data',
    admin: {
      description: 'Schema.org structured data for rich search results.',
    },
    fields: [
      {
        name: 'schemaType',
        type: 'select',
        label: 'Schema Type',
        defaultValue: 'none',
        options: schemaOptions,
      },
      // Article fields
      ...(schemaTypes.includes('article')
        ? [
            {
              name: 'articleFields',
              type: 'group' as const,
              label: 'Article Details',
              admin: {
                condition: (_: any, siblingData: any) =>
                  siblingData?.schemaType === 'article',
              },
              fields: [
                {
                  name: 'author',
                  type: 'text' as const,
                  label: 'Author',
                },
                {
                  name: 'publishDate',
                  type: 'date' as const,
                  label: 'Publish Date',
                  admin: {
                    date: {
                      pickerAppearance: 'dayOnly' as const,
                    },
                  },
                },
              ],
            },
          ]
        : []),
      // Product fields
      ...(schemaTypes.includes('product')
        ? [
            {
              name: 'productFields',
              type: 'group' as const,
              label: 'Product Details',
              admin: {
                condition: (_: any, siblingData: any) =>
                  siblingData?.schemaType === 'product',
              },
              fields: [
                {
                  name: 'price',
                  type: 'number' as const,
                  label: 'Price',
                },
                {
                  name: 'currency',
                  type: 'text' as const,
                  label: 'Currency',
                  defaultValue: 'USD',
                  admin: {
                    description: 'ISO 4217 currency code (e.g. USD, EUR, GBP)',
                  },
                },
                {
                  name: 'inStock',
                  type: 'checkbox' as const,
                  label: 'In Stock',
                  defaultValue: true,
                },
              ],
            },
          ]
        : []),
      // Service fields
      ...(schemaTypes.includes('service')
        ? [
            {
              name: 'serviceFields',
              type: 'group' as const,
              label: 'Service Details',
              admin: {
                condition: (_: any, siblingData: any) =>
                  siblingData?.schemaType === 'service',
              },
              fields: [
                {
                  name: 'serviceType',
                  type: 'text' as const,
                  label: 'Service Type',
                },
                {
                  name: 'provider',
                  type: 'text' as const,
                  label: 'Provider',
                },
                {
                  name: 'areaServed',
                  type: 'text' as const,
                  label: 'Area Served',
                },
              ],
            },
          ]
        : []),
      // Event fields
      ...(schemaTypes.includes('event')
        ? [
            {
              name: 'eventFields',
              type: 'group' as const,
              label: 'Event Details',
              admin: {
                condition: (_: any, siblingData: any) =>
                  siblingData?.schemaType === 'event',
              },
              fields: [
                {
                  name: 'startDate',
                  type: 'date' as const,
                  label: 'Start Date',
                },
                {
                  name: 'endDate',
                  type: 'date' as const,
                  label: 'End Date',
                },
                {
                  name: 'locationName',
                  type: 'text' as const,
                  label: 'Location Name',
                },
                {
                  name: 'locationAddress',
                  type: 'text' as const,
                  label: 'Location Address',
                },
              ],
            },
          ]
        : []),
      // Local Business fields
      ...(schemaTypes.includes('localBusiness')
        ? [
            {
              name: 'localBusinessFields',
              type: 'group' as const,
              label: 'Local Business Details',
              admin: {
                condition: (_: any, siblingData: any) =>
                  siblingData?.schemaType === 'localBusiness',
              },
              fields: [
                {
                  name: 'businessType',
                  type: 'text' as const,
                  label: 'Business Type',
                  admin: {
                    description:
                      'Schema.org LocalBusiness sub-type (e.g. Restaurant, Store, MedicalBusiness)',
                  },
                },
                {
                  name: 'priceRange',
                  type: 'text' as const,
                  label: 'Price Range',
                  admin: {
                    description: 'e.g. $, $$, $$$, or $10-$50',
                  },
                },
                {
                  name: 'useGlobalAddress',
                  type: 'checkbox' as const,
                  label: 'Use address from SEO Settings',
                  defaultValue: true,
                },
                {
                  name: 'address',
                  type: 'group' as const,
                  label: 'Address',
                  admin: {
                    condition: (_: any, siblingData: any) =>
                      !siblingData?.useGlobalAddress,
                  },
                  fields: [
                    {
                      name: 'streetAddress',
                      type: 'text' as const,
                      label: 'Street Address',
                    },
                    {
                      name: 'city',
                      type: 'text' as const,
                      label: 'City',
                    },
                    {
                      name: 'state',
                      type: 'text' as const,
                      label: 'State / Province',
                    },
                    {
                      name: 'postalCode',
                      type: 'text' as const,
                      label: 'Postal Code',
                    },
                    {
                      name: 'country',
                      type: 'text' as const,
                      label: 'Country',
                    },
                  ],
                },
              ],
            },
          ]
        : []),
    ],
  }
}
