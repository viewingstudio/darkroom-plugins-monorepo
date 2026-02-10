import { test, expect } from '@playwright/test'

test.describe('OpenGraph component', () => {
  test('renders core OG tags', async ({ page }) => {
    await page.goto('/open-graph')

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'OG Test Title')
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', 'OG test description')
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://example.com/test')
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website')
  })

  test('renders site name and locale', async ({ page }) => {
    await page.goto('/open-graph')

    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', 'Test Site')
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en_US')
  })

  test('renders locale alternates', async ({ page }) => {
    await page.goto('/open-graph')

    const alternates = page.locator('meta[property="og:locale:alternate"]')
    await expect(alternates).toHaveCount(2)
    await expect(alternates.nth(0)).toHaveAttribute('content', 'fr_FR')
    await expect(alternates.nth(1)).toHaveAttribute('content', 'de_DE')
  })

  test('renders full image properties', async ({ page }) => {
    await page.goto('/open-graph')

    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://example.com/image.jpg')
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200')
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630')
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', 'Test image')
    await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute('content', 'image/jpeg')
  })

  test('renders article-specific tags when ogType is article', async ({ page }) => {
    await page.goto('/open-graph-article')

    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
    await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute('content', '2025-01-15T10:00:00Z')
    await expect(page.locator('meta[property="article:author"]')).toHaveAttribute('content', 'Jane Doe')
  })

  test('does not render article tags for non-article type', async ({ page }) => {
    await page.goto('/open-graph')

    await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(0)
    await expect(page.locator('meta[property="article:author"]')).toHaveCount(0)
  })
})
