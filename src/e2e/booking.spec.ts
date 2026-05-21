import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('zobrazí landing page s tlačítkem rezervace', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation').getByText('Salon Élégance')).toBeVisible()
    await expect(page.getByText('Rezervovat termín →').first()).toBeVisible()
  })

  test('přejde na booking flow po kliknutí na rezervovat', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Rezervovat termín →').first().click()
    await expect(page).toHaveURL('/booking')
    await expect(page.getByText('Vyberte službu')).toBeVisible()
  })
})

test.describe('Booking flow — Step 1', () => {
  test('zobrazí seznam služeb', async ({ page }) => {
    await page.goto('/booking')
    await expect(page.getByText('Vyberte službu')).toBeVisible()
    await expect(page.getByText('Dámský střih')).toBeVisible({ timeout: 10000 })
  })

  test('lze vybrat službu a zobrazí se spodní bar', async ({ page }) => {
    await page.goto('/booking')
    await page.getByText('Dámský střih').click()
    await expect(page.getByText('Dál →')).toBeVisible()
  })

  test('lze vybrat více služeb', async ({ page }) => {
    await page.goto('/booking')
    await page.getByText('Dámský střih').click()
    await page.getByRole('button', { name: /Foukaná/ }).click()
    await expect(page.getByText('2 služba')).toBeVisible()
  })

  test('filtrování podle kategorie funguje', async ({ page }) => {
    await page.goto('/booking')
    await page.getByRole('button', { name: 'Barvení' }).first().click()
    await expect(page.getByText('Melír / Balayage')).toBeVisible()
  })
})

test.describe('Admin login', () => {
  test('zobrazí přihlašovací formulář', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByText('Salon Admin')).toBeVisible()
    await expect(page.getByPlaceholder('E-mail')).toBeVisible()
    await expect(page.getByPlaceholder('Heslo')).toBeVisible()
  })

  test('přihlásí se jako owner', async ({ page }) => {
    await page.goto('/admin')
    await page.getByPlaceholder('E-mail').fill('owner@salon.cz')
    await page.getByPlaceholder('Heslo').fill('admin123')
    await page.getByText('Přihlásit se').click()
    await expect(page).toHaveURL(/admin\/calendar/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Kalendář' })).toBeVisible()
  })

  test('zobrazí chybu při špatném heslu', async ({ page }) => {
    await page.goto('/admin')
    await page.getByPlaceholder('E-mail').fill('owner@salon.cz')
    await page.getByPlaceholder('Heslo').fill('wrongpassword')
    await page.getByText('Přihlásit se').click()
    await expect(page.getByText('Nesprávný e-mail nebo heslo')).toBeVisible()
  })
})

test.describe('Admin panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
    await page.getByPlaceholder('E-mail').fill('owner@salon.cz')
    await page.getByPlaceholder('Heslo').fill('admin123')
    await page.getByText('Přihlásit se').click()
    await page.waitForURL(/admin\/calendar/)
  })

  test('zobrazí kalendář po přihlášení', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Kalendář' })).toBeVisible()
  })

  test('navigace na rezervace funguje', async ({ page }) => {
    await page.getByRole('link', { name: /Rezervace/ }).first().click()
    await expect(page).toHaveURL(/admin\/bookings/)
  })

  test('navigace na kadeřníky funguje', async ({ page }) => {
    await page.getByRole('link', { name: /Kadeřníci/ }).first().click()
    await expect(page).toHaveURL(/admin\/staff/)
    await expect(page.getByText('Markéta Nováková')).toBeVisible({ timeout: 10000 })
  })

  test('navigace na analytiku funguje pro ownera', async ({ page }) => {
    await page.getByRole('link', { name: /Analytika/ }).first().click()
    await expect(page).toHaveURL(/admin\/analytics/)
  })
})