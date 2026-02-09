import type { UIField } from 'payload'

interface FieldFunctionProps {
  /**
   * Path to the description field to use for the preview
   *
   * @default 'meta.description'
   */
  descriptionPath?: string
  /**
   * Tell the component if the generate function is available as configured in the plugin config
   */
  hasGenerateFn?: boolean
  /**
   * Whether global SEO settings are configured (enables site name suffix in preview)
   */
  hasGlobalSettings?: boolean
  overrides?: Partial<UIField>
  /**
   * Path to the title field to use for the preview
   *
   * @default 'meta.title'
   */
  titlePath?: string
}

type FieldFunction = (props: FieldFunctionProps) => UIField

export const PreviewField: FieldFunction = ({
  descriptionPath,
  hasGenerateFn = false,
  hasGlobalSettings = false,
  overrides,
  titlePath,
}) => {
  return {
    name: 'preview',
    type: 'ui',
    admin: {
      components: {
        Field: {
          clientProps: {
            descriptionPath,
            hasGenerateURLFn: hasGenerateFn,
            hasGlobalSettings,
            titlePath,
          },
          path: '@kurto/payload-seo-advanced/client#PreviewComponent',
        },
      },
    },
    label: 'Preview',
    ...(overrides ?? {}),
  }
}
