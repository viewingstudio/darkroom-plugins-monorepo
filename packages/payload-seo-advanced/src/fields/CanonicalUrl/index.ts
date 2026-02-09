import type { TextField } from 'payload'

export const CanonicalUrlField = (): TextField => {
  return {
    name: 'canonicalUrl',
    type: 'text',
    label: 'Canonical URL',
    admin: {
      description: 'Leave empty to auto-generate from the page URL.',
    },
  }
}
