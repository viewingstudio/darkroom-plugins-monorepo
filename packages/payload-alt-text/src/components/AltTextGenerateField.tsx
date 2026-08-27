'use client'

import type { FieldType } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

import {
  FieldLabel,
  TextInput,
  toast,
  useConfig,
  useDocumentInfo,
  useField,
  useFormFields,
} from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { downscaleInBrowser } from '../utilities/downscaleInBrowser.js'

type AltTextGenerateFieldProps = {
  readonly autoGenerate?: boolean
  readonly showGenerateButton?: boolean
} & TextFieldClientProps

const hasValue = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0

const asFile = (value: unknown): File | null =>
  typeof File !== 'undefined' && value instanceof File ? value : null

export const AltTextGenerateField: React.FC<AltTextGenerateFieldProps> = (props) => {
  const {
    autoGenerate = true,
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

  /**
   * While a generation request is in flight, block save. Without this, saving immediately after
   * picking a file (the normal, fast thing to do) beats the vision API call: the document saves
   * with `beforeValidate`'s humanized-filename placeholder, which then counts as "already has a
   * value" and prevents the auto-generate effect below from ever running again on remount — the
   * editor is left needing to reopen the doc and click Generate by hand.
   */
  const validateWhileGenerating = useCallback(
    (): string | true => (loading ? 'Generating alt text — please wait a moment before saving.' : true),
    [loading],
  )

  const {
    customComponents: { AfterInput, BeforeInput, Label } = {},
    errorMessage,
    path,
    setValue,
    showError,
    value,
  }: FieldType<string> = useField({ validate: validateWhileGenerating })

  const { collectionSlug, id } = useDocumentInfo()

  /**
   * The pending upload is read from form state rather than from `useUploadControls`.
   * `UploadControlsProvider` only wraps the Upload element itself (and the bulk-upload
   * drawer) — never the document's fields — so a field component calling
   * `useUploadControls()` throws "must be used within an UploadControlsProvider" and takes
   * the whole edit view down. Payload's Upload element writes the picked file to form state
   * at path `file` (`useField({ path: 'file' })`), which any field in the same form can read.
   */
  const pendingFile = useFormFields(([fields]) => asFile(fields?.file?.value))

  /**
   * Generation runs against the file the editor just picked, before it is uploaded. Doing it
   * here rather than in a collection hook is deliberate: Payload holds a database transaction
   * for the whole of a mutating request, so generating during the upload would pin a database
   * connection for the length of the vision API call.
   */
  const generateFromPendingFile = useCallback(
    async (file: File) => {
      const endpoint = formatAdminURL({
        apiRoute: api,
        path: '/plugin-alt-text/generate-from-bytes',
      })

      const { base64, mimeType } = await downscaleInBrowser(file)

      const response = await fetch(endpoint, {
        body: JSON.stringify({ base64, mimeType }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate alt text')
      }

      return String(data.result || '')
    },
    [api],
  )

  /** Generation for an already-saved document, which fetches the stored file server-side. */
  const generateFromSavedDoc = useCallback(async () => {
    const endpoint = formatAdminURL({
      apiRoute: api,
      path: '/plugin-alt-text/generate',
    })

    const response = await fetch(endpoint, {
      body: JSON.stringify({ collectionSlug, id }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.error || 'Failed to generate alt text')
    }

    return String(data.result || '')
  }, [api, collectionSlug, id])

  const generate = useCallback(
    async (file?: File | null) => {
      setLoading(true)
      const toastId = toast.loading('Generating alt text...')

      try {
        const result = file ? await generateFromPendingFile(file) : await generateFromSavedDoc()

        setValue(result)
        toast.success('Alt text generated', { id: toastId })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate alt text'
        toast.error(message, { id: toastId })
      } finally {
        setLoading(false)
      }
    },
    [generateFromPendingFile, generateFromSavedDoc, setValue],
  )

  // One auto-generation per selected file. Keyed on the File object rather than a boolean so
  // that swapping the file before saving generates again, but a re-render does not.
  const autoGeneratedFor = useRef<File | null>(null)

  useEffect(() => {
    if (!autoGenerate || !pendingFile) {
      return
    }

    if (autoGeneratedFor.current === pendingFile) {
      return
    }

    // Never overwrite text the editor has already written or generated.
    if (hasValue(value)) {
      return
    }

    /**
     * Deliberately ignores `readOnly` here. In the bulk-upload drawer (dragging a file onto an
     * upload relationship field in another collection), Payload computes each field's initial
     * `readOnly` prop from a form state snapshot fetched before doc permissions resolve, so it's
     * baked in as `true` and never recomputed for the lifetime of that drawer — even though the
     * field is genuinely editable. Gating the manual "Generate" button and save-blocking on
     * `readOnly` still protects against a field the editor truly can't touch; skipping it here
     * just means we don't let that stale prop suppress a generation the editor is otherwise free
     * to run and edit or discard.
     */
    autoGeneratedFor.current = pendingFile
    void generate(pendingFile)
  }, [autoGenerate, generate, pendingFile, value])

  // Pre-save the pending file is the subject; after save, the stored document is.
  const disabled = readOnly || loading || (!id && !pendingFile)

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
                void generate(pendingFile)
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
              title={disabled && !loading ? 'Choose an image first' : undefined}
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
