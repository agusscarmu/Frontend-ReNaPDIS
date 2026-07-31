import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('redirige a login cuando no hay sesión y la página no tiene violaciones de accesibilidad', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('permite iniciar sesión y ver el tablero de trámites', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('usuaria@renapdis.gob.ar');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Trámites' })).toBeVisible();
});
