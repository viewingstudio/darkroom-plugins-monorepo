import { test, expect } from '@playwright/test'

test.describe('MetaTags component', () => {
  test('renders <title> tag', async ({ page }) => {
    await page.goto('/meta-tags')
    await expect(page).toHaveTitle('Test Page Title')
  })

  test('renders meta description', async ({ page }) => {
    await page.goto('/meta-tags')
    const description = page.locator('meta[name="description"]')
    await expect(description).toHaveAttribute('content', 'A test description')
  })

  test('renders meta keywords', async ({ page }) => {
    await page.goto('/meta-tags')
    const keywords = page.locator('meta[name="keywords"]')
    await expect(keywords).toHaveAttribute('content', 'test, seo, astro')
  })
})
