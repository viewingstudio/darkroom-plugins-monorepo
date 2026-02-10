import { test, expect } from '@playwright/test'

test.describe('TwitterCard component', () => {
  test('renders twitter card tags with image', async ({ page }) => {
    await page.goto('/twitter-card')

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', 'Twitter Test Title')
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', 'Twitter test description')
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', 'https://example.com/twitter.jpg')
    await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute('content', 'Twitter image')
  })

  test('renders twitter site and creator handles', async ({ page }) => {
    await page.goto('/twitter-card')

    await expect(page.locator('meta[name="twitter:site"]')).toHaveAttribute('content', '@testsite')
    await expect(page.locator('meta[name="twitter:creator"]')).toHaveAttribute('content', '@testcreator')
  })

  test('defaults to summary card type when no image', async ({ page }) => {
    await page.goto('/twitter-card-no-image')

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary')
  })

  test('does not render image tags when no image provided', async ({ page }) => {
    await page.goto('/twitter-card-no-image')

    await expect(page.locator('meta[name="twitter:image"]')).toHaveCount(0)
    await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveCount(0)
  })
})
