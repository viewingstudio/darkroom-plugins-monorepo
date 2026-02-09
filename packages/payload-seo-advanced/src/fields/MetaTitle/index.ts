import type { TextField } from 'payload'

interface FieldFunctionProps {
  /**
   * Tell the component if the generate function is available as configured in the plugin config
   */
  hasGenerateFn?: boolean
  /**
   * Whether global SEO settings are configured (enables site name suffix features)
   */
  hasGlobalSettings?: boolean
  overrides?: Partial<TextField>
}

type FieldFunction = (props: FieldFunctionProps) => TextField

export const MetaTitleField: FieldFunction = ({
  hasGenerateFn = false,
  hasGlobalSettings = false,
  overrides,
}) => {
  return {
    name: 'title',
    type: 'text',
    admin: {
      components: {
        Field: {
          clientProps: {
            hasGenerateTitleFn: hasGenerateFn,
            hasGlobalSettings,
          },
          path: '@kurto/payload-seo-advanced/client#MetaTitleComponent',
        },
      },
    },
    localized: true,
    ...((overrides ?? {}) as { hasMany: boolean } & Partial<TextField>),
  }
}
