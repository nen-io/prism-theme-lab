import { test, expect } from '@playwright/test';

test('skip reaches the editor and file selection has no invisible keyboard stop', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to workbench' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#workbench')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Theme name', { exact: true })).toBeFocused();
  await expect(page.getByRole('link', { name: 'Skip to workbench' })).toHaveCSS(
    'clip-path',
    'inset(50%)',
  );
  const input = page.getByLabel('Import theme JSON file');
  await expect(input).toHaveAttribute('hidden', '');
});

test('theme-name validation belongs to the field and escape restores the committed value', async ({
  page,
}) => {
  await page.goto('/');
  const name = page.getByLabel('Theme name', { exact: true });
  const original = await name.inputValue();
  await name.fill('<invalid>');
  await name.press('Enter');
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toHaveAccessibleDescription(/1–48/);
  await name.press('Escape');
  await expect(name).toHaveValue(original);
  await expect(name).toHaveAttribute('aria-invalid', 'false');
  await name.fill('Human readable');
  await name.press('Enter');
  await expect(page.locator('.editor-notice')).toContainText('Theme updated');
});

test('preview announces creation and readable controls survive narrow text scaling and forced colors', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Name your next project', { exact: true }).fill('Useful demo');
  await page.getByLabel('Name your next project', { exact: true }).press('Enter');
  await expect(page.getByRole('status', { name: 'Preview feedback' })).toContainText('Useful demo');
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  const name = page.getByLabel('Theme name', { exact: true });
  await name.fill('<invalid>');
  await name.press('Enter');
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  const token = page.locator('#token-accent');
  const box = await token.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(24);
  await page.evaluate(() => {
    const elements = [
      ...document.querySelectorAll<HTMLElement>(
        'button,input,textarea,select,p,label,h1,h2,h3,strong,small,span,summary',
      ),
    ];
    // Capture first so children do not inherit an already-doubled parent size.
    const sizes = elements.map((element) => parseFloat(getComputedStyle(element).fontSize));
    elements.forEach((element, index) => {
      element.style.fontSize = `${sizes[index] * 2}px`;
    });
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(name).toHaveAccessibleDescription(/1–48/);
  await name.press('Escape');
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'false');
  await token.focus();
  await token.fill('#123456');
  await token.press('Enter');
  await expect(token).toHaveValue('#123456');
  await expect(token).toBeFocused();
  await page.screenshot({ path: 'docs/screenshots/accessibility-forced-colors.png' });
});

test('dismissing unavailable-storage feedback returns to a usable editor', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    }),
  );
  await page.goto('/');
  const dismiss = page.getByRole('button', { name: 'Dismiss storage warning' });
  await dismiss.focus();
  await page.keyboard.press('Enter');
  await expect(dismiss).toHaveCount(0);
  await expect(page.getByLabel('Theme name', { exact: true })).toBeFocused();
});
