import { test, expect } from '@playwright/test'

test.describe('SEO component – missing data handling', () => {
  test.describe('missing meta prop', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/seo-missing-meta')
    })

    test('renders seo-warnings meta tag with meta missing warning', async ({ page }) => {
      const warnings = page.locator('meta[name="seo-warnings"]')
      await expect(warnings).toHaveAttribute('content', /meta.*missing/)
    })

    test('does not crash – page still renders body', async ({ page }) => {
      await expect(page.locator('body p')).toHaveText('SEO with missing meta prop')
    })

    test('does not render a title tag', async ({ page }) => {
      const title = await page.locator('head title').count()
      expect(title).toBe(0)
    })

    test('does not render meta description', async ({ page }) => {
      const desc = await page.locator('meta[name="description"]').count()
      expect(desc).toBe(0)
    })
  })

  test.describe('empty meta object', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/seo-empty-meta')
    })

    test('renders warning about missing title', async ({ page }) => {
      const warnings = page.locator('meta[name="seo-warnings"]')
      await expect(warnings).toHaveAttribute('content', /meta\.title.*empty/)
    })

    test('renders warning about missing description', async ({ page }) => {
      const warnings = page.locator('meta[name="seo-warnings"]')
      await expect(warnings).toHaveAttribute('content', /meta\.description.*empty/)
    })

    test('does not crash – page still renders body', async ({ page }) => {
      await expect(page.locator('body p')).toHaveText('SEO with empty meta object')
    })

    test('does not render a title tag', async ({ page }) => {
      const title = await page.locator('head title').count()
      expect(title).toBe(0)
    })
  })

  test.describe('missing siteUrl and currentPath', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/seo-missing-urls')
    })

    test('renders warning about missing siteUrl', async ({ page }) => {
      const warnings = page.locator('meta[name="seo-warnings"]')
      await expect(warnings).toHaveAttribute('content', /siteUrl.*missing/)
    })

    test('renders warning about missing currentPath', async ({ page }) => {
      const warnings = page.locator('meta[name="seo-warnings"]')
      await expect(warnings).toHaveAttribute('content', /currentPath.*missing/)
    })

    test('still renders the title', async ({ page }) => {
      await expect(page).toHaveTitle('Page With Missing URLs')
    })
  })

  test.describe('missing description only', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/seo-no-description')
    })

    test('renders warning about missing description', async ({ page }) => {
      const warnings = page.locator('meta[name="seo-warnings"]')
      await expect(warnings).toHaveAttribute('content', /meta\.description.*empty/)
    })

    test('does not warn about title (title is present)', async ({ page }) => {
      const warnings = page.locator('meta[name="seo-warnings"]')
      const content = await warnings.getAttribute('content')
      expect(content).not.toMatch(/meta\.title/)
    })

    test('still renders the title', async ({ page }) => {
      await expect(page).toHaveTitle('Page Without Description')
    })

    test('does not render meta description tag', async ({ page }) => {
      const desc = await page.locator('meta[name="description"]').count()
      expect(desc).toBe(0)
    })
  })

  test.describe('titleDefault fallback suppresses title warning', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/seo-title-default')
    })

    test('does not warn about missing title when titleDefault is provided', async ({ page }) => {
      const warnings = await page.locator('meta[name="seo-warnings"]').count()
      if (warnings > 0) {
        const content = await page.locator('meta[name="seo-warnings"]').getAttribute('content')
        expect(content).not.toMatch(/meta\.title/)
      }
    })

    test('renders the titleDefault as the page title', async ({ page }) => {
      await expect(page).toHaveTitle('Fallback Title')
    })
  })

  test.describe('fully valid props produce no warnings', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/seo-full')
    })

    test('does not render seo-warnings meta tag', async ({ page }) => {
      const warnings = await page.locator('meta[name="seo-warnings"]').count()
      expect(warnings).toBe(0)
    })
  })
})
