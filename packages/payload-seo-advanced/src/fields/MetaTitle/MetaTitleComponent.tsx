'use client'

import type { FieldType } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

import {
  FieldLabel,
  TextInput,
  useAllFormFields,
  useConfig,
  useDocumentInfo,
  useDocumentTitle,
  useField,
  useForm,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import { reduceToSerializableFields } from '@payloadcms/ui/shared'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useState } from 'react'

import type { PluginSEOTranslationKeys, PluginSEOTranslations } from '../../translations/index.js'
import type { GenerateTitle } from '../../types.js'

import { defaults } from '../../defaults.js'
import { LengthIndicator } from '../../ui/LengthIndicator.js'
import '../index.scss'

const { maxLength: maxLengthDefault, minLength: minLengthDefault } = defaults.title

type MetaTitleProps = {
  readonly hasGenerateTitleFn: boolean
  readonly hasGlobalSettings?: boolean
} & TextFieldClientProps

export const MetaTitleComponent: React.FC<MetaTitleProps> = (props) => {
  const {
    field: {
      label,
      localized,
      maxLength: maxLengthFromProps,
      minLength: minLengthFromProps,
      required,
    },
    hasGenerateTitleFn,
    hasGlobalSettings = false,
    readOnly,
  } = props

  const { t } = useTranslation<PluginSEOTranslations, PluginSEOTranslationKeys>()

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

  const locale = useLocale()
  const { getData } = useForm()
  const docInfo = useDocumentInfo()
  const { title } = useDocumentTitle()
  const [fields, dispatchFields] = useAllFormFields()

  const minLength = minLengthFromProps || minLengthDefault
  const maxLength = maxLengthFromProps || maxLengthDefault

  // SEO settings state
  const [siteName, setSiteName] = useState('')
  const [titleSeparator, setTitleSeparator] = useState('|')

  // Read the disableSiteName field value from form state
  const disableSiteNamePath = path?.replace(/\.title$/, '.disableSiteName') ?? 'meta.disableSiteName'
  const disableSiteName = !!(fields[disableSiteNamePath]?.value)

  // Fetch SEO settings from the endpoint
  useEffect(() => {
    if (!hasGlobalSettings) return

    const endpoint = formatAdminURL({
      apiRoute: api,
      path: '/plugin-seo/seo-settings',
    })

    const localeCode = typeof locale === 'object' ? locale?.code : locale

    const fetchSettings = async () => {
      try {
        const response = await fetch(
          `${endpoint}${localeCode ? `?locale=${localeCode}` : ''}`,
          { credentials: 'include' },
        )
        const data = await response.json()
        setSiteName(data.siteName || '')
        setTitleSeparator(data.titleSeparator || '|')
      } catch {
        // Silently fail if settings aren't available
      }
    }

    void fetchSettings()
  }, [hasGlobalSettings, api, locale])

  // Compute the suffix string
  const suffix = hasGlobalSettings && siteName && !disableSiteName
    ? ` ${titleSeparator} ${siteName}`
    : ''

  // Full title for length calculation
  const fullTitle = value ? `${value}${suffix}` : ''

  const handleDisableSiteNameChange = useCallback(
    (checked: boolean) => {
      dispatchFields({
        type: 'UPDATE',
        path: disableSiteNamePath,
        value: checked,
      })
    },
    [dispatchFields, disableSiteNamePath],
  )

  const regenerateTitle = useCallback(async () => {
    if (!hasGenerateTitleFn) {
      return
    }

    const endpoint = formatAdminURL({
      apiRoute: api,
      path: '/plugin-seo/generate-title',
    })

    const genTitleResponse = await fetch(endpoint, {
      body: JSON.stringify({
        id: docInfo.id,
        collectionSlug: docInfo.collectionSlug,
        doc: getData(),
        docPermissions: docInfo.docPermissions,
        globalSlug: docInfo.globalSlug,
        hasPublishPermission: docInfo.hasPublishPermission,
        hasSavePermission: docInfo.hasSavePermission,
        initialData: docInfo.initialData,
        initialState: reduceToSerializableFields(docInfo.initialState ?? {}),
        locale: typeof locale === 'object' ? locale?.code : locale,
        title,
      } satisfies Omit<
        Parameters<GenerateTitle>[0],
        'collectionConfig' | 'globalConfig' | 'hasPublishedDoc' | 'req' | 'versionCount'
      >),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const { result: generatedTitle } = await genTitleResponse.json()

    // Strip the suffix if it was appended server-side, since we display it separately
    let cleanTitle = generatedTitle || ''
    if (suffix && cleanTitle.endsWith(suffix)) {
      cleanTitle = cleanTitle.slice(0, -suffix.length)
    }

    setValue(cleanTitle)
  }, [
    hasGenerateTitleFn,
    api,
    docInfo.id,
    docInfo.collectionSlug,
    docInfo.docPermissions,
    docInfo.globalSlug,
    docInfo.hasPublishPermission,
    docInfo.hasSavePermission,
    docInfo.initialData,
    docInfo.initialState,
    getData,
    locale,
    setValue,
    title,
    suffix,
  ])

  return (
    <div
      style={{
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          marginBottom: '5px',
          position: 'relative',
        }}
      >
        <div className="plugin-seo__field">
          {Label ?? (
            <FieldLabel label={label} localized={localized} path={path} required={required} />
          )}
          {hasGenerateTitleFn && (
            <React.Fragment>
              &nbsp; &mdash; &nbsp;
              <button
                disabled={readOnly}
                onClick={() => {
                  void regenerateTitle()
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
                type="button"
              >
                {t('plugin-seo:autoGenerate')}
              </button>
            </React.Fragment>
          )}
        </div>
        <div
          style={{
            color: '#9A9A9A',
          }}
        >
          {t('plugin-seo:lengthTipTitle', { maxLength, minLength })}
          <a
            href="https://developers.google.com/search/docs/advanced/appearance/title-link#page-titles"
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('plugin-seo:bestPractices')}
          </a>
          .
        </div>
      </div>
      <div
        style={{
          marginBottom: '10px',
          position: 'relative',
        }}
      >
        <TextInput
          AfterInput={AfterInput}
          BeforeInput={BeforeInput}
          Error={errorMessage}
          onChange={setValue}
          path={path}
          readOnly={readOnly}
          required={required}
          showError={showError}
          style={{
            marginBottom: 0,
          }}
          value={value}
        />
      </div>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          width: '100%',
        }}
      >
        <LengthIndicator maxLength={maxLength} minLength={minLength} text={fullTitle || value} />
      </div>
      {hasGlobalSettings && siteName && (
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          <label
            style={{
              alignItems: 'center',
              color: '#9A9A9A',
              cursor: 'pointer',
              display: 'flex',
              fontSize: '13px',
              gap: '6px',
              userSelect: 'none',
            }}
          >
            <input
              checked={disableSiteName}
              disabled={readOnly}
              onChange={(e) => handleDisableSiteNameChange(e.target.checked)}
              style={{
                cursor: 'pointer',
                margin: 0,
              }}
              type="checkbox"
            />
            Disable site name suffix
            {!disableSiteName && (
              <span style={{ color: '#6A6A6A' }}>
                ({titleSeparator} {siteName})
              </span>
            )}
          </label>
        </div>
      )}
    </div>
  )
}
