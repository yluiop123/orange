/**
 * Verifies the shared header/login controls:
 * - language menu is data-driven and switches locale
 * - theme toggle switches dark/light and stays in sync
 * - Angular's "default" color swatch stays neutral when another palette is active
 *
 * Run with the three dev servers up:
 *   node check-controls.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const outDir = path.resolve(
  process.env.CONTROLS_OUT ?? path.join(os.tmpdir(), 'orange-controls'),
);
fs.mkdirSync(outDir, { recursive: true });

const APPS = [
  { id: 'react', base: 'http://localhost:5173', login: '/#/login' },
  { id: 'vue', base: 'http://localhost:5174', login: '/login' },
  { id: 'angular', base: 'http://localhost:4200', login: '/login' },
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = {};
const failures = [];

async function seed(context, theme = 'dark', color = 'default') {
  await context.addInitScript(
    ({ theme, color }) => {
      localStorage.setItem('locale', 'zh');
      localStorage.setItem('theme-mode', theme);
      localStorage.setItem('theme-color', color);
      localStorage.setItem('orange.theme', theme);
      localStorage.setItem('orange.color', color);
      localStorage.setItem('orange.angular.theme', theme);
      localStorage.setItem('orange.angular.color', color);
    },
    { theme, color },
  );
}

async function login(page, base) {
  await page.goto(`${base}/#/login`).catch(async () => page.goto(`${base}/login`));
  const inputs = page.locator('input:visible');
  await inputs.nth(0).fill('super');
  await inputs.nth(1).fill('super');
  await page.getByRole('button', { name: /登录|Login/i }).first().click();
  await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 30000 });
  await page.waitForTimeout(900);
}

async function chooseLanguage(page, label) {
  await page.waitForTimeout(400);
  const item = page.getByText(label, { exact: true }).last();
  if (!(await item.isVisible().catch(() => false))) {
    const trigger = page.getByTestId('locale-switcher').first();
    await trigger.waitFor({ state: 'visible' });
    await trigger.click();
    await page.waitForTimeout(400);
  }
  await item.waitFor({ state: 'visible' });
  await item.click({ force: true });
  await page.waitForTimeout(600);
}

for (const app of APPS) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
  });
  await seed(context, 'dark', 'default');
  const page = await context.newPage();
  const entry = { login: {}, header: {}, angularColor: null };

  const language = () => page.getByTestId('locale-switcher').first();
  const theme = () => page.getByTestId('theme-toggle').first();
  const languageText = async () => (await language().innerText()).replace('translate', '').trim();

  // Login page: theme toggle and language menu.
  await page.goto(`${app.base}${app.login}`);
  await language().waitFor({ timeout: 20000 });
  await page.screenshot({ path: path.join(outDir, `${app.id}-login-dark.png`) });
  entry.login.language = await languageText();
  entry.login.themeLabel = await theme().getAttribute('aria-label');

  await theme().click();
  await page.waitForTimeout(300);
  entry.login.themeAfterToggle = await theme().getAttribute('aria-label');
  await page.screenshot({ path: path.join(outDir, `${app.id}-login-light.png`) });
  await theme().click();
  await page.waitForTimeout(200);

  await language().click();
  await page.getByText('English', { exact: true }).last().click();
  await page.waitForTimeout(700);
  entry.login.languageAfterEnglish = await languageText();
  await chooseLanguage(page, '中文');

  // Shell header.
  await login(page, app.base);
  await page.screenshot({ path: path.join(outDir, `${app.id}-header-dark.png`) });
  entry.header.language = await languageText();
  entry.header.themeLabel = await theme().getAttribute('aria-label');

  await language().click();
  await page.getByText('English', { exact: true }).last().click();
  await page.waitForTimeout(700);
  entry.header.languageAfterEnglish = await languageText();
  await chooseLanguage(page, '中文');

  // Component page in dark and light.
  await page.goto(`${app.base}${app.id === 'react' ? '/#/component/general' : '/component/general'}`);
  await page.getByRole('tab', { name: 'Button' }).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, `${app.id}-content-dark.png`) });
  await theme().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, `${app.id}-content-light.png`) });
  entry.header.themeAfterToggle = await theme().getAttribute('aria-label');

  // Angular: default swatch must stay neutral in both themes and after
  // selecting another palette.
  if (app.id === 'angular') {
    const swatch = (name) => page.locator(`button[aria-label="${name}"]:visible`).first();
    const readNeutral = async () => {
      await page.getByRole('button', { name: 'Theme color' }).click();
      await page.waitForTimeout(400);
      const value = await swatch('default').evaluate((el) => getComputedStyle(el).backgroundColor);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      return value;
    };

    const lightNeutral = await readNeutral();
    await theme().click();
    await page.waitForTimeout(500);
    const darkNeutral = await readNeutral();

    await page.getByRole('button', { name: 'Theme color' }).click();
    await page.waitForTimeout(400);
    await swatch('blue').click();
    await page.waitForTimeout(700);
    const darkNeutralAfterBlue = await readNeutral();

    await theme().click();
    await page.waitForTimeout(500);
    const lightNeutralAfterBlue = await readNeutral();

    entry.angularColor = {
      lightNeutral,
      darkNeutral,
      darkNeutralAfterBlue,
      lightNeutralAfterBlue,
    };
    if (darkNeutral !== 'rgb(250, 250, 250)') {
      failures.push(`angular dark default swatch is ${darkNeutral}`);
    }
    if (darkNeutralAfterBlue !== darkNeutral) {
      failures.push('angular dark default swatch follows the selected palette');
    }
    if (lightNeutral !== 'rgb(24, 24, 27)') {
      failures.push(`angular light default swatch is ${lightNeutral}`);
    }
    if (lightNeutralAfterBlue !== lightNeutral) {
      failures.push('angular light default swatch follows the selected palette');
    }
    await page.screenshot({ path: path.join(outDir, 'angular-color-menu.png') });
  }

  if (entry.login.language !== '中文' || entry.header.language !== '中文') {
    failures.push(`${app.id} initial language is not 中文`);
  }
  if (entry.login.languageAfterEnglish !== 'English') {
    failures.push(`${app.id} login language did not switch to English`);
  }
  if (entry.header.languageAfterEnglish !== 'English') {
    failures.push(`${app.id} header language did not switch to English`);
  }
  if (entry.login.themeLabel === entry.login.themeAfterToggle) {
    failures.push(`${app.id} login theme toggle did not change state`);
  }
  if (entry.header.themeLabel === entry.header.themeAfterToggle) {
    failures.push(`${app.id} header theme toggle did not change state`);
  }

  report[app.id] = entry;
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log(`Screenshots: ${outDir}`);
if (failures.length > 0) {
  console.error(`Control check failures:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('All control checks passed.');
}
