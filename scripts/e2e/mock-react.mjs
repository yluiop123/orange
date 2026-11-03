import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.E2E_BASE ?? 'http://localhost:5173';
const shots = process.env.E2E_EVIDENCE ?? 'D:/User/Cache/Temp/opencode/evidence';
fs.mkdirSync(shots, { recursive: true });

const results = [];
const consoleErrors = [];

async function step(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - started });
  } catch (error) {
    results.push({ name, ok: false, ms: Date.now() - started, error: String(error?.message ?? error).split('\n').slice(0, 4).join(' | ') });
    try {
      await page.screenshot({ path: `${shots}/react-fail-${results.length}.png`, fullPage: true });
    } catch {}
  }
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
const page = await context.newPage();
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e}`));

async function login(username, password) {
  await page.goto(`${base}/#/login`);
  await page.getByLabel('用户名').fill(username);
  await page.getByLabel('密码').fill(password);
  await page.getByRole('button', { name: '登录' }).click();
  await page.waitForURL(/\/#\/(?!login)/, { timeout: 20000 });
  await page.getByRole('button', { name: /Toggle Sidebar/ }).first().waitFor({ timeout: 20000 });
}

async function openSystemMenu(label) {
  await page.keyboard.press('Escape');
  const item = page.getByRole('button', { name: label });
  if (!(await item.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: '系统管理' }).click();
  }
  await item.waitFor({ timeout: 10000 });
  await item.click();
}

async function closeDialog() {
  const dialog = page.getByRole('dialog');
  if (await dialog.isVisible().catch(() => false)) {
    const close = dialog.getByRole('button', { name: /Close|关闭/ }).first();
    if (await close.isVisible().catch(() => false)) await close.click();
    else await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
}

await step('登录 super/super 进入仪表盘', async () => {
  await login('super', 'super');
  if (!page.url().includes('/dashboard/normal')) throw new Error(`unexpected url ${page.url()}`);
  await page.getByText('普通仪表盘').first().waitFor();
});

await step('刷新后保持登录（token 续期）', async () => {
  await page.reload();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /Toggle Sidebar/ }).first().waitFor({ timeout: 15000 });
  if (page.url().includes('/login')) throw new Error('reload lost session');
});

await step('菜单点击：系统管理 → 用户管理', async () => {
  await openSystemMenu('用户管理');
  await page.waitForURL(/\/#\/system\/user/);
  await page.getByRole('columnheader', { name: '用户名' }).waitFor();
  await page.getByRole('cell', { name: 'super', exact: true }).first().waitFor();
});

await step('用户搜索过滤', async () => {
  await page.getByPlaceholder('搜索姓名、用户名、邮箱或手机号').fill('super');
  await page.waitForTimeout(1200);
  if ((await page.getByRole('row').count()) < 2) throw new Error('no rows after search');
  await page.getByRole('cell', { name: 'super', exact: true }).first().waitFor();
});

await step('角色/权限/组织/操作日志页面可加载', async () => {
  for (const [label, path, marker] of [
    ['角色管理', '/system/role', '角色名称'],
    ['权限管理', '/system/permission', '名称'],
    ['组织管理', '/system/group', '组织名称'],
    ['操作日志', '/system/operation-log', '操作人'],
  ]) {
    await openSystemMenu(label);
    await page.waitForURL(new RegExp(path.replace('/', '\\/')));
    await page.getByRole('columnheader', { name: marker }).first().waitFor({ timeout: 15000 });
  }
  await page.getByRole('cell', { name: /\/api\/v1\// }).first().waitFor({ timeout: 15000 });
});

await step('组织管理：新增根组织', async () => {
  await openSystemMenu('组织管理');
  await page.getByRole('columnheader', { name: '组织名称' }).waitFor();
  await page.getByRole('button', { name: '新增' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await dialog.locator('input').nth(0).fill('90');
  await dialog.locator('input').nth(1).fill('E2E组织');
  await dialog.getByRole('button', { name: '保存' }).click();
  await page.getByRole('cell', { name: 'E2E组织' }).first().waitFor({ timeout: 15000 });
});

await step('组织管理：状态开关停用/启用', async () => {
  const row = page.getByRole('row').filter({ hasText: 'E2E组织' }).first();
  const toggle = row.getByRole('switch').first();
  await toggle.click();
  const confirm = page.getByRole('alertdialog');
  await confirm.waitFor({ timeout: 5000 });
  await confirm.getByRole('button', { name: '停用' }).click();
  await confirm.waitFor({ state: 'detached', timeout: 8000 });
  await page.waitForTimeout(600);
  if (await row.getByRole('switch').first().isChecked()) throw new Error('switch did not turn off');
  await row.getByRole('switch').first().click();
  await page.waitForTimeout(800);
  if (!(await row.getByRole('switch').first().isChecked())) throw new Error('switch did not turn on');
});

await step('组织管理：Mock 拒绝停用有启用子节点的组织', async () => {
  const result = await page.evaluate(async () => {
    const response = await fetch('/api/v1/system/groups/0003/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Locale: 'zh' },
      body: JSON.stringify({ status: '0' }),
    });
    return { status: response.status, body: await response.json() };
  });
  if (result.status !== 409 || !String(result.body?.message ?? '').includes('子组织')) {
    throw new Error(`unexpected ${result.status} ${JSON.stringify(result.body)}`);
  }
});

await step('组织管理：删除新增的组织', async () => {
  const row = page.getByRole('row').filter({ hasText: 'E2E组织' }).first();
  await row.getByRole('checkbox').check();
  await page.getByRole('button', { name: '删除' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: '删除' }).click();
  await page.getByRole('cell', { name: 'E2E组织' }).first().waitFor({ state: 'detached', timeout: 15000 });
});

await step('权限管理：操作类型必须有操作名（表单校验）', async () => {
  await openSystemMenu('权限管理');
  await page.getByRole('columnheader', { name: '名称' }).waitFor();
  await page.getByRole('button', { name: '新增' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await dialog.locator('input').nth(0).fill('9901');
  await dialog.locator('input').nth(1).fill('E2E权限');
  await dialog.locator('input').nth(2).fill('/e2e');
  await dialog.getByRole('combobox').first().click();
  await page.getByRole('option', { name: '操作' }).click();
  await dialog.getByRole('button', { name: '保存' }).click();
  await dialog.getByText('操作类型必须填写操作名称。').waitFor({ timeout: 5000 });
  await closeDialog();
});

await step('中文切换英文后菜单/面包屑更新', async () => {
  await closeDialog();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '中文' }).click();
  await page.getByRole('menuitemradio', { name: 'EN' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'System' }).waitFor({ timeout: 10000 });
  await page.getByText('Permission', { exact: true }).first().waitFor();
});

await step('英文切回中文', async () => {
  await page.getByRole('button', { name: /^EN$/ }).click();
  await page.getByRole('menuitemradio', { name: '中文' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '系统管理' }).waitFor({ timeout: 10000 });
});

await step('退出登录后受保护页面回到登录页', async () => {
  await page.getByRole('button', { name: /yluiop123@qq\.com/ }).click();
  await page.getByRole('menuitem', { name: '退出登录' }).click();
  await page.waitForURL(/\/#\/login/, { timeout: 15000 });
  await page.goto(`${base}/#/system/user`);
  await page.waitForURL(/\/#\/login/, { timeout: 15000 });
  await page.getByRole('button', { name: '登录' }).waitFor();
});

await step('多角色用户切换到受限角色后跳到首个可见页面', async () => {
  await login('user002', 'user002');
  await page.goto(`${base}/#/system/user`);
  await page.getByRole('columnheader', { name: '用户名' }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: /user002@example\.com/ }).click();
  await page.getByRole('menuitemradio', { name: '普通用户' }).click();
  await page.keyboard.press('Escape');
  await page.waitForURL(/\/#\/dashboard\/normal/, { timeout: 15000 });
  await page.getByText('普通仪表盘').first().waitFor();
});

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ app: 'react', passed: results.length - failed.length, failed: failed.length, results, consoleErrors: consoleErrors.slice(0, 20) }, null, 2));
process.exit(failed.length ? 1 : 0);
