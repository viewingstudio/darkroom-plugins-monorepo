import type { TextField } from 'payload'

export const FocusKeywordField = (): TextField => {
  return {
    name: 'focusKeyword',
    type: 'text',
    label: 'Focus Keyword',
    localized: true,
    admin: {
      description: 'Used for content analysis only. Not rendered on the frontend.',
    },
  }
}
