import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { presetWorkspace } from '../../src/domain/presets';
const token = (page: import('@playwright/test').Page, key: string) => page.locator(`#token-${key}`);
async function hex(page: import('@playwright/test').Page, key: string, value: string) {
  await token(page, key).fill(value);
  await token(page, key).press('Enter');
}

test('edit, contrast failure/suggestion, independent modes, scale, export and import', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Accent color picker', { exact: true }).fill('#123456');
  await expect(token(page, 'accent')).toHaveValue('#123456');
  await hex(page, 'accentText', '#123456');
  await expect(
    page.getByTestId('contrast-button').getByText('AA FAIL', { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('contrast-button').locator('.ratio strong')).toHaveText('1.00');
  await page.getByRole('button', { name: 'Apply', exact: false }).click();
  await expect(token(page, 'accentText')).toHaveValue('#FFFFFF');
  await expect(
    page.getByTestId('contrast-button').getByText('AA PASS', { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('preview-primary')).toHaveCSS(
    'background-color',
    'rgb(18, 52, 86)',
  );
  await expect(page.getByTestId('preview-primary')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await hex(page, 'accent', '#EEDDCC');
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await expect(token(page, 'accent')).toHaveValue('#123456');
  await page.getByLabel('A little breathing room').fill('1.2');
  await expect(page.getByTestId('product-preview')).toHaveCSS('font-size', '19.2px');
  const jsonPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON', exact: false }).click();
  const jsonDownload = await jsonPromise;
  const stream = await jsonDownload.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  expect(exported.tokens.accent).toBe('#123456');
  expect(exported.fontScale).toBe(1.2);
  expect(exported.mode).toBe('light');
  const cssPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSS', exact: false }).click();
  const cssDownload = await cssPromise;
  const cssStream = await cssDownload.createReadStream();
  const cssChunks: Buffer[] = [];
  for await (const chunk of cssStream!) cssChunks.push(Buffer.from(chunk));
  expect(Buffer.concat(cssChunks).toString()).toContain('--prism-accent: #123456;');
  await page.getByRole('button', { name: 'Reset preset', exact: true }).click();
  await expect(token(page, 'accent')).toHaveValue('#305C45');
  await page.getByLabel('Import theme JSON file').setInputFiles({
    name: 'theme.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(exported)),
  });
  await expect(token(page, 'accent')).toHaveValue('#123456');
  await page.reload();
  await expect(token(page, 'accent')).toHaveValue('#123456');
  await expect(page.locator('#font-scale')).toHaveValue('1.2');
});

test('invalid drafts and malicious imports do not change committed tokens; preview text is safe', async ({
  page,
}) => {
  await page.goto('/');
  await hex(page, 'accent', '#123');
  await expect(page.getByRole('alert')).toContainText('six hex digits');
  await expect(token(page, 'accent')).toHaveValue('#123');
  await expect(page.getByTestId('preview-primary')).toHaveCSS(
    'background-color',
    'rgb(48, 92, 69)',
  );
  await token(page, 'accent').press('Escape');
  await expect(token(page, 'accent')).toHaveValue('#305C45');
  await page.getByLabel('Import theme JSON file').setInputFiles({
    name: 'evil.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({ ...presetWorkspace().modes.light, name: 'x"}body{display:none}' }),
    ),
  });
  await expect(page.getByRole('alert')).toContainText('name');
  await expect(token(page, 'accent')).toHaveValue('#305C45');
  await page.getByLabel('Import theme JSON file').setInputFiles({
    name: 'large.json',
    mimeType: 'application/json',
    buffer: Buffer.from(' '.repeat(32769)),
  });
  await expect(page.getByRole('alert')).toContainText('32 KiB');
  await page.getByLabel('Name your next project').fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Add sample project', exact: true }).click();
  await expect(page.getByTestId('card-heading')).toHaveText('<img src=x onerror=alert(1)>');
  await expect(page.getByTestId('product-preview').locator('img')).toHaveCount(0);
});

test('undo/redo and independent edited modes survive reload', async ({ page }) => {
  await page.goto('/');
  await hex(page, 'text', '#111111');
  await page.getByRole('button', { name: 'Undo committed edit' }).click();
  await expect(token(page, 'text')).toHaveValue('#253B2D');
  await page.getByRole('button', { name: 'Redo committed edit' }).click();
  await expect(token(page, 'text')).toHaveValue('#111111');
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await hex(page, 'text', '#DDDDDD');
  await page.reload();
  await expect(token(page, 'text')).toHaveValue('#DDDDDD');
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await expect(token(page, 'text')).toHaveValue('#111111');
});

test('corrupt or denied local persistence shows a recoverable warning', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('prism.workspace.v1', '{bad'));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('restored');
  await expect(token(page, 'accent')).toHaveValue('#305C45');
  await page.getByRole('button', { name: 'Dismiss storage warning' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    });
  });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('unavailable');
  await hex(page, 'accent', '#112233');
  await expect(token(page, 'accent')).toHaveValue('#112233');
});

test('a delayed file read cannot overwrite a newer preset selection', async ({ page }) => {
  await page.addInitScript(() => {
    const original = File.prototype.text;
    File.prototype.text = function () {
      return new Promise((resolve) => {
        window.setTimeout(() => {
          void original.call(this).then(resolve);
        }, 500);
      });
    };
  });
  await page.clock.install();
  await page.goto('/');
  await page.getByLabel('Import theme JSON file').setInputFiles({
    name: 'late.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        ...presetWorkspace().modes.light,
        name: 'Late file',
        tokens: { ...presetWorkspace().modes.light.tokens, accent: '#112233' },
      }),
    ),
  });
  await expect(page.getByRole('button', { name: 'Reading…' })).toBeVisible();
  await page.getByRole('button', { name: /Terracotta Warm/ }).click();
  await page.clock.runFor(1000);
  await expect(page.getByLabel('Theme name')).toHaveValue('Terracotta');
  await expect(token(page, 'accent')).toHaveValue('#A6462E');
});

for (const field of ['accent', 'name'] as const) {
  test(`a pending import cannot discard a newer uncommitted ${field} draft`, async ({ page }) => {
    await page.addInitScript(() => {
      const original = File.prototype.text;
      File.prototype.text = function () {
        return new Promise((resolve) => {
          window.setTimeout(() => void original.call(this).then(resolve), 500);
        });
      };
    });
    await page.clock.install();
    await page.goto('/');
    await page.getByLabel('Import theme JSON file').setInputFiles({
      name: 'late.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({
          ...presetWorkspace().modes.light,
          name: 'Late file',
          tokens: { ...presetWorkspace().modes.light.tokens, accent: '#112233' },
        }),
      ),
    });
    await expect(page.getByRole('button', { name: 'Reading…' })).toBeVisible();
    const input = field === 'accent' ? token(page, 'accent') : page.getByLabel('Theme name');
    const draft = field === 'accent' ? '#AABBCC' : 'New draft';
    await input.fill(draft);
    await page.clock.runFor(1000);
    await expect(input).toHaveValue(draft);
    await expect(page.getByTestId('product-preview')).toHaveCSS('--prism-accent', '#305C45');
    await expect(page.getByRole('button', { name: 'Import JSON' })).toBeEnabled();
    await input.press('Enter');
    if (field === 'accent')
      await expect(page.getByTestId('product-preview')).toHaveCSS('--prism-accent', draft);
    else await expect(page.getByLabel('Theme name')).toHaveValue(draft);
  });
}

test('token pairs match actual styles; desktop/mobile screenshots and narrow keyboard flow', async ({
  page,
}) => {
  await mkdir('docs/screenshots', { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/');
  await expect(page.getByTestId('product-preview')).toHaveCSS(
    'background-color',
    'rgb(238, 242, 236)',
  );
  await expect(page.getByTestId('page-heading')).toHaveCSS('color', 'rgb(37, 59, 45)');
  await expect(page.locator('.product-card')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.getByTestId('muted-copy')).toHaveCSS('color', 'rgb(86, 103, 90)');
  const codeRegion = page.getByRole('region', { name: 'CSS export preview' });
  await codeRegion.focus();
  await page.keyboard.press('End');
  await expect.poll(() => codeRegion.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await codeRegion.evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.locator('#workbench').focus();
  await page.screenshot({ path: 'docs/screenshots/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'docs/screenshots/mobile.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Dark', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(token(page, 'background')).toHaveValue('#141F19');
  await page.setViewportSize({ width: 720, height: 600 });
  await page.addStyleTag({ content: ':root{font-size:32px!important}' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('explicit reset clears invalid drafts even when the committed preset is unchanged', async ({
  page,
}) => {
  await page.goto('/');
  await hex(page, 'accent', '#bad');
  await expect(page.getByRole('alert')).toContainText('six hex');
  await page.getByRole('button', { name: 'Reset preset', exact: true }).click();
  await expect(token(page, 'accent')).toHaveValue('#305C45');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByLabel('Theme name').fill('<bad>');
  await page.getByLabel('Theme name').press('Enter');
  await expect(page.getByRole('alert')).toContainText('name');
  await page.getByRole('button', { name: /Orchard Grounded/ }).click();
  await expect(page.getByLabel('Theme name')).toHaveValue('Orchard');
  await expect(page.getByRole('alert')).toHaveCount(0);
});
