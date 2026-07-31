import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('redirige a login cuando no hay sesión y la página no tiene violaciones de accesibilidad', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('el formulario de credenciales muestra usuario y contraseña', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByLabel('Usuario')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible();
});
