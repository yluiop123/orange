import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.E2E_BASE ?? 'http://localhost:4200';
const shots = process.env.E2E_EVIDENCE ?? 'D:/User/Cache/Temp/opencode/evidence';
fs.mkdirSync(shots, { recursive: true });

const results = [];
const consoleErrors = [];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
const page = await context.newPage();
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e}`));

async function step(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - started });
  } catch (error) {
    results.push({ name, ok: false, ms: Date.now() - started, error: String(error?.message ?? error).split('\n').slice(0, 4).join(' | ') });
    try { await page.screenshot({ path: `${shots}/ng-fail-${results.length}.png`, fullPage: true }); } catch {}
  }
}

async function login(username, password) {
  await page.goto(`${base}/login`);
  const inputs = page.locator('input');
  await inputs.nth(0).fill(username);
  await inputs.nth(1).fill(password);
  await page.getByRole('button', { name: /登录|Login/ }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });
  await page.getByRole('navigation', { name: 'Main navigation' }).waitFor({ timeout: 20000 });
}

await step('登录 super/super 进入仪表盘', async () => {
  await login('super', 'super');
  if (page.url().includes('/login')) throw new Error(`unexpected url ${page.url()}`);
  await page.getByRole('heading', { level: 1 }).first().waitFor();
});

await step('刷新后保持登录（token 续期）', async () => {
  await page.reload();
  await page.waitForTimeout(1500);
  await page.getByRole('navigation', { name: 'Main navigation' }).waitFor({ timeout: 15000 });
  if (page.url().includes('/login')) throw new Error('reload lost session');
});

await step('菜单点击：系统管理 → 用户管理', async () => {
  await page.getByRole('button', { name: '系统管理' }).click();
  await page.getByRole('link', { name: '用户管理' }).click();
  await page.waitForURL(/\/system\/user$/);
  await page.getByRole('columnheader', { name: '用户名' }).waitFor();
  await page.getByRole('cell', { name: 'super', exact: true }).first().waitFor();
});

await step('用户搜索过滤', async () => {
  const search = page.getByLabel('搜索姓名、用户名、邮箱或手机号');
  await search.fill('super');
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
    await page.goto(`${base}${path}`);
    await page.getByRole('columnheader', { name: marker }).first().waitFor({ timeout: 15000 });
  }
  await page.getByRole('cell', { name: /\/api\/v1\// }).first().waitFor({ timeout: 15000 });
});

await step('组织管理：新增根组织', async () => {
  await page.goto(`${base}/system/group`);
  await page.getByRole('columnheader', { name: '组织名称' }).waitFor();
  await page.getByRole('button', { name: '新增' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await dialog.getByLabel('组织编码').fill('90');
  await dialog.getByLabel('组织名称').fill('E2E组织');
  await dialog.getByRole('button', { name: '保存' }).click();
  await page.getByRole('cell', { name: 'E2E组织' }).first().waitFor({ timeout: 15000 });
});

await step('组织管理：状态开关停用/启用', async () => {
  const row = page.getByRole('row').filter({ hasText: 'E2E组织' }).first();
  const toggle = row.getByRole('switch').first();
  await toggle.click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ timeout: 5000 });
  await dialog.getByRole('button', { name: '停用' }).click();
  await page.waitForTimeout(900);
  if (await row.getByRole('switch').first().isChecked()) throw new Error('switch did not turn off');
  await row.getByRole('switch').first().click();
  await page.waitForTimeout(900);
  if (!(await row.getByRole('switch').first().isChecked())) throw new Error('switch did not turn on');
});

await step('组织管理：停用有启用子节点的组织被拒绝', async () => {
  const row = page.getByRole('row').filter({ hasText: '总公司' }).first();
  await row.getByRole('switch').first().click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ timeout: 5000 });
  await dialog.getByRole('button', { name: '停用' }).click();
  await page.waitForTimeout(1500);
  if (!(await row.getByRole('switch').first().isChecked())) throw new Error('status was not restored');
});

await step('组织管理：删除新增的组织', async () => {
  const row = page.getByRole('row').filter({ hasText: 'E2E组织' }).first();
  await row.getByRole('checkbox').first().check();
  await page.getByRole('button', { name: '删除' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '删除' }).click();
  await page.getByRole('cell', { name: 'E2E组织' }).first().waitFor({ state: 'detached', timeout: 15000 });
});

await step('权限管理：操作类型必须有操作名（表单校验）', async () => {
  await page.goto(`${base}/system/permission`);
  await page.getByRole('columnheader', { name: '名称' }).waitFor();
  await page.getByRole('button', { name: '新增' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await dialog.getByLabel('编码').fill('9901');
  await dialog.getByLabel('名称').fill('E2E权限');
  await dialog.getByLabel('路径').fill('/e2e');
  await dialog.getByRole('combobox', { name: '类型' }).click();
  await page.getByRole('option', { name: '操作' }).click();
  await dialog.getByRole('button', { name: '保存' }).click();
  await page.getByText(/必须填写操作名/).waitFor({ timeout: 5000 });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
});

await step('中文切换英文后菜单/面包屑更新', async () => {
  await page.getByRole('combobox', { name: '中文' }).click();
  await page.getByRole('option', { name: 'English' }).click();
  await page.getByRole('button', { name: 'System' }).waitFor({ timeout: 10000 });
  await page.getByText('Permissions', { exact: true }).first().waitFor();
});

await step('英文切回中文', async () => {
  await page.waitForTimeout(600);
  await page.getByRole('combobox', { name: 'English' }).click();
  await page.waitForTimeout(400);
  await page.getByRole('option', { name: '中文' }).click({ force: true });
  await page.getByRole('button', { name: '系统管理' }).waitFor({ timeout: 10000 });
});

await step('退出登录后受保护页面回到登录页', async () => {
  await page.getByRole('button', { name: /超级管理员/ }).click();
  await page.getByRole('menuitem', { name: /退出登录|Log out/ }).click();
  await page.waitForURL(/\/login/, { timeout: 15000 });
  await page.goto(`${base}/system/user`);
  await page.waitForURL(/\/login/, { timeout: 15000 });
  await page.getByRole('button', { name: /登录|Login/ }).waitFor();
});

await step('多角色用户切换到受限角色后跳到首个可见页面', async () => {
  await login('super', 'super');
  await page.goto(`${base}/system/user`);
  await page.getByRole('columnheader', { name: '用户名' }).waitFor({ timeout: 15000 });
  await page.getByRole('combobox', { name: '全部角色' }).click();
  await page.getByRole('option', { name: '普通用户' }).click();
  await page.waitForURL(/\/dashboard\/normal/, { timeout: 15000 });
});

await step('强制改密账号登录后弹出改密框', async () => {
  await page.getByRole('button', { name: /超级管理员|普通用户/ }).first().click();
  await page.getByRole('menuitem', { name: /退出登录|Log out/ }).click();
  await page.waitForURL(/\/login/, { timeout: 15000 });
  await login('newbie', 'newbie');
  await page.getByText(/请先修改初始密码/).first().waitFor({ timeout: 10000 });
});

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ app: 'angular', passed: results.length - failed.length, failed: failed.length, results, consoleErrors: consoleErrors.slice(0, 20) }, null, 2));
process.exit(failed.length ? 1 : 0);
