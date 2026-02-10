import { test, expect } from '@playwright/test'

test.describe('CanonicalUrl component', () => {
  test('renders canonical link tag', async ({ page }) => {
    await page.goto('/canonical')

    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveAttribute('href', 'https://example.com/canonical-page')
  })
})
