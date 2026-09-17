import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('contrast cards navigate to the exact token and provide undoable shared-token suggestions', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#token-text').fill('#FFFFFF');
  await page.locator('#token-text').press('Enter');
  const card = page.getByTestId('contrast-card');
  await card.getByRole('button', { name: 'Edit text color' }).click();
  await expect(page.locator('#token-text')).toBeFocused();
  await expect(card).toContainText('Also changes Page text');
  await card.getByRole('button', { name: /Use #000000/ }).click();
  await expect(page.locator('#token-text')).toHaveValue('#000000');
  await expect(page.getByTestId('contrast-page')).toContainText('AA PASS');
  await expect(card).toContainText('AA PASS');
  await page.getByRole('button', { name: 'Undo committed edit' }).click();
  await expect(page.locator('#token-text')).toHaveValue('#FFFFFF');
});

test('both-mode CSS export contains independent edited themes and fixed selectors', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#token-accent').fill('#123456');
  await page.locator('#token-accent').press('Enter');
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await page.locator('#token-accent').fill('#ABCDEF');
  await page.locator('#token-accent').press('Enter');
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download both modes' }).click();
  const file = await event;
  expect(file.suggestedFilename()).toBe('prism-both.css');
  const css = await readFile((await file.path())!, 'utf8');
  expect(css).toContain('[data-theme="light"]');
  expect(css).toContain('[data-theme="dark"]');
  expect(css).toContain('--prism-accent: #123456;');
  expect(css).toContain('--prism-accent: #ABCDEF;');
  expect(css.match(/\[data-theme=/g)).toHaveLength(2);
});

test('opposite shared surfaces explain why no black-white repair is offered, including on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#token-background').fill('#000000');
  await page.locator('#token-background').press('Enter');
  await page.locator('#token-text').fill('#FFFFFF');
  await page.locator('#token-text').press('Enter');
  const card = page.getByTestId('contrast-card');
  await expect(card).toContainText('No black/white choice passes every shared pair');
  await expect(card.getByRole('button', { name: /Use #/ })).toHaveCount(0);
  await card.getByRole('button', { name: 'Edit text color' }).click();
  await expect(page.locator('#token-text')).toBeFocused();
  await expect(page.locator('#token-text')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
