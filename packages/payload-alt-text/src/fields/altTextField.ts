import type { Field, TextField } from 'payload'

const COMPONENT_PATH = '@kurto/payload-alt-text/client#AltTextGenerateField'

export const altTextField = (
  existingField: Field | undefined,
  args: { altFieldName: string; autoGenerate: boolean; showGenerateButton: boolean },
): Field => {
  const { altFieldName, autoGenerate, showGenerateButton } = args

  if (existingField) {
    // The component now carries auto-generation as well as the button, so it has to be
    // installed whenever either is switched on.
    if (!showGenerateButton && !autoGenerate) {
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
            clientProps: { autoGenerate, showGenerateButton },
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
          clientProps: { autoGenerate, showGenerateButton },
          path: COMPONENT_PATH,
        },
      },
      description: "Used as the image's alt attribute for accessibility and SEO.",
    },
    label: 'Alt Text',
  }

  return field
}
