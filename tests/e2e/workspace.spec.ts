import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { presetWorkspace } from '../../src/domain/presets';

test('complete workspace download restores both modes as one undoable import', async ({ page }) => {
  await page.goto('/');
  await page.locator('#token-accent').fill('#112233');
  await page.locator('#token-accent').press('Enter');
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await page.locator('#token-accent').fill('#DDEEFF');
  await page.locator('#token-accent').press('Enter');
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('prism.workspace.v1')!));
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Back up workspace', exact: true }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe('prism-workspace.json');
  const source = await readFile((await download.path())!, 'utf8');
  expect(JSON.parse(source)).toEqual(before);
  await page.getByRole('button', { name: 'Reset preset', exact: true }).click();
  const reset = await page.evaluate(() => JSON.parse(localStorage.getItem('prism.workspace.v1')!));
  await page.getByLabel('Import theme JSON file').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(source),
  });
  await expect(page.locator('.editor-notice')).toContainText('Workspace imported');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('prism.workspace.v1')!)),
  ).toEqual(before);
  await page.getByRole('button', { name: 'Undo committed edit' }).click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('prism.workspace.v1')!)),
  ).toEqual(reset);
  await page.getByRole('button', { name: 'Redo committed edit' }).click();
  await page.reload();
  await expect(page.locator('#token-accent')).toHaveValue('#DDEEFF');
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await expect(page.locator('#token-accent')).toHaveValue('#112233');
});

test('invalid workspace leaves both modes untouched and a newer draft defeats delayed restore', async ({
  page,
}) => {
  await page.goto('/');
  const before = await page.evaluate(() => localStorage.getItem('prism.workspace.v1'));
  const invalid = {
    ...presetWorkspace(),
    modes: { light: presetWorkspace().modes.light, dark: presetWorkspace().modes.light },
  };
  await page.getByLabel('Import theme JSON file').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(invalid)),
  });
  await expect(page.getByRole('alert')).toContainText('labels');
  expect(await page.evaluate(() => localStorage.getItem('prism.workspace.v1'))).toBe(before);
  await page.evaluate(() => {
    File.prototype.text = function () {
      return new Promise((resolve) => {
        (window as unknown as { finish: (s: string) => void }).finish = resolve;
      });
    };
  });
  await page
    .getByLabel('Import theme JSON file')
    .setInputFiles({ name: 'late.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await page.locator('#token-accent').fill('#123');
  await page.evaluate(
    (s) => (window as unknown as { finish: (s: string) => void }).finish(s),
    JSON.stringify(presetWorkspace('afterhours')),
  );
  await expect(page.locator('#token-accent')).toHaveValue('#123');
  expect(await page.evaluate(() => localStorage.getItem('prism.workspace.v1'))).toBe(before);
});

test('export explanation and CSS retain readable columns at desktop and narrow widths', async ({
  page,
}) => {
  await page.goto('/');
  for (const width of [1440, 900, 720, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const copy = await page.locator('.export-section > div').first().boundingBox();
    const code = await page.getByRole('region', { name: 'CSS export preview' }).boundingBox();
    expect(copy!.width).toBeGreaterThan(width > 620 ? 200 : 150);
    expect(code!.width).toBeGreaterThan(width > 620 ? 200 : 150);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
