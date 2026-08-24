import type { Field, TextField } from 'payload'

const COMPONENT_PATH = '@kurto/payload-alt-text/client#AltTextGenerateField'

export const altTextField = (
  existingField: Field | undefined,
  args: { altFieldName: string; showGenerateButton: boolean },
): Field => {
  const { altFieldName, showGenerateButton } = args

  if (existingField) {
    if (!showGenerateButton) {
      return existingField
    }

    const admin = (existingField.admin ?? {}) as NonNullable<Field['admin']>
    const components = admin.components ?? {}

    return {
      ...existingField,
      admin: {
        ...admin,
        components: {
          ...components,
          Field: {
            clientProps: { showGenerateButton },
            path: COMPONENT_PATH,
          },
        },
      },
    } as Field
  }

  const field: TextField = {
    name: altFieldName,
    type: 'text',
    admin: {
      components: {
        Field: {
          clientProps: { showGenerateButton },
          path: COMPONENT_PATH,
        },
      },
      description: "Used as the image's alt attribute for accessibility and SEO.",
    },
    label: 'Alt Text',
  }

  return field
}
