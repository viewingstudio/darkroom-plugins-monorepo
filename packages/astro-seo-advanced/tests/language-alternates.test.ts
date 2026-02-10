import { test, expect } from '@playwright/test'

test.describe('LanguageAlternates component', () => {
  test('renders hreflang link tags', async ({ page }) => {
    await page.goto('/language-alternates')

    const alternates = page.locator('link[rel="alternate"]')
    await expect(alternates).toHaveCount(3)
  })

  test('renders correct hreflang attributes', async ({ page }) => {
    await page.goto('/language-alternates')

    await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://example.com/en/page')
    await expect(page.locator('link[hreflang="de"]')).toHaveAttribute('href', 'https://example.com/de/page')
    await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute('href', 'https://example.com/fr/page')
  })
})
