import type { Block, BlocksField } from 'payload'

import type { StructuredDataConfig } from '../../types.js'

const ALL_SCHEMA_TYPES = ['article', 'product', 'service', 'event', 'localBusiness'] as const

export const StructuredDataFields = (config?: StructuredDataConfig): BlocksField => {
  const schemaTypes = config?.schemaTypes ?? [...ALL_SCHEMA_TYPES]

  const blocks: Block[] = []

  // Article Block
  if (schemaTypes.includes('article')) {
    blocks.push({
      slug: 'article',
      labels: {
        singular: 'Article',
        plural: 'Articles',
      },
      fields: [
        {
          name: 'author',
          type: 'text',
          label: 'Author',
        },
        {
          name: 'publishDate',
          type: 'date',
          label: 'Publish Date',
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
      ],
    })
  }

  // Product Block
  if (schemaTypes.includes('product')) {
    blocks.push({
      slug: 'product',
      labels: {
        singular: 'Product',
        plural: 'Products',
      },
      fields: [
        {
          name: 'price',
          type: 'number',
          label: 'Price',
        },
        {
          name: 'currency',
          type: 'text',
          label: 'Currency',
          defaultValue: 'USD',
          admin: {
            description: 'ISO 4217 currency code (e.g. USD, EUR, GBP)',
          },
        },
        {
          name: 'inStock',
          type: 'checkbox',
          label: 'In Stock',
          defaultValue: true,
        },
      ],
    })
  }

  // Service Block
  if (schemaTypes.includes('service')) {
    blocks.push({
      slug: 'service',
      labels: {
        singular: 'Service',
        plural: 'Services',
      },
      fields: [
        {
          name: 'serviceType',
          type: 'text',
          label: 'Service Type',
        },
        {
          name: 'provider',
          type: 'text',
          label: 'Provider',
        },
        {
          name: 'areaServed',
          type: 'text',
          label: 'Area Served',
        },
      ],
    })
  }

  // Event Block
  if (schemaTypes.includes('event')) {
    blocks.push({
      slug: 'event',
      labels: {
        singular: 'Event',
        plural: 'Events',
      },
      fields: [
        {
          name: 'startDate',
          type: 'date',
          label: 'Start Date',
        },
        {
          name: 'endDate',
          type: 'date',
          label: 'End Date',
        },
        {
          name: 'locationName',
          type: 'text',
          label: 'Location Name',
        },
        {
          name: 'locationAddress',
          type: 'text',
          label: 'Location Address',
        },
      ],
    })
  }

  // Local Business Block
  if (schemaTypes.includes('localBusiness')) {
    blocks.push({
      slug: 'localBusiness',
      labels: {
        singular: 'Local Business',
        plural: 'Local Businesses',
      },
      fields: [
        {
          name: 'businessType',
          type: 'text',
          label: 'Business Type',
          admin: {
            description:
              'Schema.org LocalBusiness sub-type (e.g. Restaurant, Store, MedicalBusiness)',
          },
        },
        {
          name: 'priceRange',
          type: 'text',
          label: 'Price Range',
          admin: {
            description: 'e.g. $, $$, $$$, or $10-$50',
          },
        },
        {
          name: 'useGlobalAddress',
          type: 'checkbox',
          label: 'Use address from SEO Settings',
          defaultValue: true,
        },
        {
          name: 'address',
          type: 'group',
          label: 'Address',
          admin: {
            condition: (_: any, siblingData: any) => !siblingData?.useGlobalAddress,
          },
          fields: [
            {
              name: 'streetAddress',
              type: 'text',
              label: 'Street Address',
            },
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
    })
  }

  return {
    name: 'structuredData',
    type: 'blocks',
    label: 'Structured Data',
    maxRows: 1,
    admin: {
      description: 'Schema.org structured data for rich search results.',
    },
    blocks,
  }
}
