import { test, expect } from '@playwright/test'

test.describe('FaqJsonLd component', () => {
  test('renders FAQPage JSON-LD script tag', async ({ page }) => {
    await page.goto('/faq-jsonld')

    const script = page.locator('script[type="application/ld+json"]')
    await expect(script).toHaveCount(1)

    const jsonLd = JSON.parse(await script.innerHTML())
    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd['@type']).toBe('FAQPage')
  })

  test('renders correct number of FAQ items', async ({ page }) => {
    await page.goto('/faq-jsonld')

    const script = page.locator('script[type="application/ld+json"]')
    const jsonLd = JSON.parse(await script.innerHTML())

    expect(jsonLd.mainEntity).toHaveLength(3)
  })

  test('renders question and answer with correct schema types', async ({ page }) => {
    await page.goto('/faq-jsonld')

    const script = page.locator('script[type="application/ld+json"]')
    const jsonLd = JSON.parse(await script.innerHTML())

    const firstItem = jsonLd.mainEntity[0]
    expect(firstItem['@type']).toBe('Question')
    expect(firstItem.name).toBe('What is Astro?')
    expect(firstItem.acceptedAnswer['@type']).toBe('Answer')
    expect(firstItem.acceptedAnswer.text).toBe('Astro is a web framework for building content-driven websites.')
  })

  test('does not render script tag when items array is empty', async ({ page }) => {
    await page.goto('/faq-jsonld-empty')

    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0)
  })
})
