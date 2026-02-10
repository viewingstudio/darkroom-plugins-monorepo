import { test, expect } from '@playwright/test'

test.describe('Robots component', () => {
  test('renders robots meta with directives', async ({ page }) => {
    await page.goto('/robots')

    const robots = page.locator('meta[name="robots"]')
    await expect(robots).toHaveAttribute('content', 'noindex, nofollow, max-snippet:-1')
  })

  test('does not render robots meta for default index/follow', async ({ page }) => {
    await page.goto('/robots-default')

    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
  })
})
