import type { SelectField } from 'payload'

export const RobotsMetaField = (): SelectField => {
  return {
    name: 'robotsMeta',
    type: 'select',
    label: 'Robots Meta',
    defaultValue: 'index-follow',
    options: [
      { label: 'Index, Follow', value: 'index-follow' },
      { label: 'No Index, Follow', value: 'noindex-follow' },
      { label: 'Index, No Follow', value: 'index-nofollow' },
      { label: 'No Index, No Follow', value: 'noindex-nofollow' },
    ],
  }
}
