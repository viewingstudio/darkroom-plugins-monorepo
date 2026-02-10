import { test, expect } from '@playwright/test'

test.describe('SEO (all-in-one) component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/seo-full')
  })

  test('renders title with separator and site name', async ({ page }) => {
    // buildTitle: "Full SEO Page | Test Site"
    await expect(page).toHaveTitle('Full SEO Page | Test Site')
  })

  test('renders meta description', async ({ page }) => {
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'A fully configured SEO page',
    )
  })

  test('renders meta keywords', async ({ page }) => {
    await expect(page.locator('meta[name="keywords"]')).toHaveAttribute(
      'content',
      'full, seo, test',
    )
  })

  test('renders canonical URL from meta.canonicalUrl', async ({ page }) => {
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://example.com/custom-canonical',
    )
  })

  test('renders OG tags', async ({ page }) => {
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Full SEO Page')
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', 'A fully configured SEO page')
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://example.com/test-page')
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website')
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', 'Test Site')
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en_US')
  })

  test('renders OG image tags', async ({ page }) => {
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://example.com/og.jpg')
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200')
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630')
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', 'OG image')
    await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute('content', 'image/jpeg')
  })

  test('renders Twitter card tags', async ({ page }) => {
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', 'Full SEO Page')
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', 'A fully configured SEO page')
    await expect(page.locator('meta[name="twitter:site"]')).toHaveAttribute('content', '@testsite')
    await expect(page.locator('meta[name="twitter:creator"]')).toHaveAttribute('content', '@testcreator')
  })

  test('renders robots meta with noindex', async ({ page }) => {
    const robots = page.locator('meta[name="robots"]')
    await expect(robots).toHaveAttribute('content', 'noindex')
  })

  test('renders language alternate links', async ({ page }) => {
    await expect(page.locator('link[hreflang="de"]')).toHaveAttribute(
      'href',
      'https://example.com/de/test-page',
    )
  })

  test('renders extended meta tags', async ({ page }) => {
    await expect(page.locator('meta[name="author"]')).toHaveAttribute('content', 'Test Author')
  })

  test('renders extended link tags', async ({ page }) => {
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.ico')
  })
})
