'use client'

import type { FieldType } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

import { FieldLabel, TextInput, toast, useConfig, useDocumentInfo, useField } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useState } from 'react'

type AltTextGenerateFieldProps = {
  readonly showGenerateButton?: boolean
} & TextFieldClientProps

export const AltTextGenerateField: React.FC<AltTextGenerateFieldProps> = (props) => {
  const {
    field: { label, localized, required },
    readOnly,
    showGenerateButton = true,
  } = props

  const [loading, setLoading] = useState(false)

  const {
    config: {
      routes: { api },
    },
  } = useConfig()

  const {
    customComponents: { AfterInput, BeforeInput, Label } = {},
    errorMessage,
    path,
    setValue,
    showError,
    value,
  }: FieldType<string> = useField()

  const { collectionSlug, id } = useDocumentInfo()

  const generate = useCallback(async () => {
    setLoading(true)
    const toastId = toast.loading('Generating alt text...')

    try {
      const endpoint = formatAdminURL({
        apiRoute: api,
        path: '/plugin-alt-text/generate',
      })

      const response = await fetch(endpoint, {
        body: JSON.stringify({ collectionSlug, id }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate alt text')
      }

      setValue(data.result || '')
      toast.success('Alt text generated', { id: toastId })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate alt text'
      toast.error(message, { id: toastId })
    } finally {
      setLoading(false)
    }
  }, [api, collectionSlug, id, setValue])

  const disabled = readOnly || loading || !id

  return (
    <div className="field-type text">
      <div
        style={{
          marginBottom: '5px',
          position: 'relative',
        }}
      >
        {Label ?? (
          <FieldLabel label={label} localized={localized} path={path} required={required} />
        )}
        {showGenerateButton && (
          <React.Fragment>
            &nbsp; &mdash; &nbsp;
            <button
              disabled={disabled}
              onClick={() => {
                void generate()
              }}
              style={{
                background: 'none',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'currentcolor',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
              }}
              title={!id ? 'Upload and save the image before generating alt text' : undefined}
              type="button"
            >
              {loading ? 'Generating…' : 'Generate'}
            </button>
          </React.Fragment>
        )}
      </div>
      <TextInput
        AfterInput={AfterInput}
        BeforeInput={BeforeInput}
        Error={errorMessage}
        onChange={setValue}
        path={path}
        readOnly={readOnly}
        required={required}
        showError={showError}
        value={value}
      />
    </div>
  )
}
