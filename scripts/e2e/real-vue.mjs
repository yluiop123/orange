import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.E2E_BASE ?? 'http://localhost:5174';
const shots = process.env.E2E_EVIDENCE ?? 'D:/User/Cache/Temp/opencode/evidence';
// 每次运行使用不同的 2 位根组织编码，避免上次失败残留导致编码冲突
const groupCode = String(90 + Number(String(Date.now()).slice(-1)));
const groupName = `E2E组织${groupCode}`;
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
    try { await page.screenshot({ path: `${shots}/vue-fail-${results.length}.png`, fullPage: true }); } catch {}
  }
}

async function login(username, password) {
  await page.goto(`${base}/login`);
  await page.getByLabel('用户名').fill(username);
  await page.getByLabel('密码').fill(password);
  await page.getByRole('button', { name: /登录|Login/ }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });
  await page.getByRole('button', { name: /收起侧边栏/ }).waitFor({ timeout: 20000 });
}

async function closeDialog() {
  const dialog = page.getByRole('dialog');
  if (await dialog.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
}

await step('登录 super/super 进入仪表盘', async () => {
  await login('super', 'super');
  if (page.url().includes('/login')) throw new Error(`unexpected url ${page.url()}`);
  await page.getByRole('heading', { name: '普通仪表盘' }).waitFor();
});

await step('刷新后保持登录（token 续期）', async () => {
  await page.reload();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /收起侧边栏/ }).waitFor({ timeout: 15000 });
  if (page.url().includes('/login')) throw new Error('reload lost session');
});

await step('菜单点击：系统管理 → 用户管理', async () => {
  await page.getByRole('option', { name: '系统管理' }).waitFor({ timeout: 15000 });
  await page.getByRole('option', { name: '系统管理' }).click();
  await page.getByRole('link', { name: '用户管理' }).click();
  await page.waitForURL(/\/system\/user$/);
  await page.getByRole('columnheader', { name: '用户名' }).waitFor();
  await page.getByRole('cell', { name: 'super', exact: true }).first().waitFor();
});

await step('用户搜索过滤', async () => {
  const search = page.getByPlaceholder(/搜索/).first();
  await search.fill('super');
  await page.waitForTimeout(1200);
  if ((await page.getByRole('row').count()) < 2) throw new Error('no rows after search');
  await page.getByRole('cell', { name: 'super', exact: true }).first().waitFor();
});

await step('角色/权限/组织页面可加载', async () => {
  for (const [label, path, marker] of [
    ['角色管理', '/system/role', '角色名称'],
    ['权限管理', '/system/permission', '名称'],
    ['组织管理', '/system/group', '组织名称'],
  ]) {
    await page.goto(`${base}${path}`);
    await page.getByRole('columnheader', { name: marker }).first().waitFor({ timeout: 15000 });
  }
});

await step('组织管理：新增根组织', async () => {
  await page.goto(`${base}/system/group`);
  await page.getByRole('columnheader', { name: '组织名称' }).waitFor();
  await page.getByRole('button', { name: '新增' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await dialog.getByLabel('组织编码').fill(groupCode);
  await dialog.getByLabel('组织名称').fill(groupName);
  await dialog.getByRole('button', { name: '保存' }).click();
  await page.getByRole('cell', { name: groupName }).first().waitFor({ timeout: 15000 });
});

await step('组织管理：状态开关停用/启用', async () => {
  const row = page.getByRole('row').filter({ hasText: groupName }).first();
  await row.getByRole('checkbox', { name: '切换状态' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ timeout: 5000 });
  await dialog.getByRole('button', { name: '停用' }).click();
  await page.waitForTimeout(800);
  if (await row.getByRole('checkbox', { name: '切换状态' }).isChecked()) throw new Error('switch did not turn off');
  await row.getByRole('checkbox', { name: '切换状态' }).click();
  await page.waitForTimeout(800);
  if (!(await row.getByRole('checkbox', { name: '切换状态' }).isChecked())) throw new Error('switch did not turn on');
});

await step('组织管理：停用有启用子节点的组织被拒绝并回滚', async () => {
  const row = page.getByRole('row').filter({ hasText: '总公司' }).first();
  const toggle = row.getByRole('checkbox', { name: '切换状态' });
  await toggle.click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ timeout: 5000 });
  await dialog.getByRole('button', { name: '停用' }).click();
  await page.waitForTimeout(1200);
  // 只有请求被拒绝时开关才会回滚到启用状态
  if (!(await toggle.isChecked())) throw new Error('switch did not roll back to enabled');
});

await step('组织管理：删除新增的组织', async () => {
  const row = page.getByRole('row').filter({ hasText: groupName }).first();
  await row.getByRole('checkbox', { name: '选择本行' }).check();
  await page.getByRole('button', { name: '删除' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '删除' }).click();
  await page.getByRole('cell', { name: groupName }).first().waitFor({ state: 'detached', timeout: 15000 });
});

await step('操作日志记录本次组织增删', async () => {
  await page.goto(`${base}/system/operation-log`);
  await page.getByRole('columnheader', { name: '操作人' }).waitFor({ timeout: 15000 });
  await page.getByRole('cell', { name: /\/api\/v1\/system\/groups/ }).first().waitFor({ timeout: 15000 });
});

await step('权限管理：操作类型必须有操作名（表单校验）', async () => {
  await page.goto(`${base}/system/permission`);
  await page.getByRole('columnheader', { name: '名称' }).waitFor();
  await page.getByRole('button', { name: '新增' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  const inputs = dialog.locator('input');
  await inputs.nth(0).fill('9901');
  await inputs.nth(1).fill('E2E权限');
  await inputs.nth(2).fill('/e2e');
  await dialog.getByRole('combobox').first().click();
  await page.getByRole('option', { name: '操作' }).click();
  await dialog.getByRole('button', { name: '保存' }).click();
  await page.getByText(/必须填写操作名称/).waitFor({ timeout: 5000 });
  await closeDialog();
});

await step('中文切换英文后菜单/面包屑更新', async () => {
  await closeDialog();
  await page.getByRole('button', { name: '中文' }).click();
  await page.getByText('English', { exact: true }).click();
  await page.getByRole('option', { name: 'System' }).waitFor({ timeout: 10000 });
  await page.getByText('Permissions', { exact: true }).first().waitFor();
});

await step('英文切回中文', async () => {
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByText('中文', { exact: true }).click();
  await page.getByRole('option', { name: '系统管理' }).waitFor({ timeout: 10000 });
});

await step('退出登录后受保护页面回到登录页', async () => {
  await page.getByRole('button', { name: /超级管理员/ }).click();
  await page.getByText(/退出登录|Log out/).click();
  await page.waitForURL(/\/login/, { timeout: 15000 });
  await page.goto(`${base}/system/user`);
  await page.waitForURL(/\/login/, { timeout: 15000 });
  await page.getByRole('button', { name: /登录|Login/ }).waitFor();
});

await step('多角色用户切换到受限角色后跳到首个可见页面', async () => {
  await login('super', 'super');
  await page.goto(`${base}/system/user`);
  await page.getByRole('columnheader', { name: '用户名' }).waitFor({ timeout: 15000 });
  await page.getByRole('combobox', { name: '角色视角' }).click({ force: true });
  await page.getByRole('option', { name: '用户', exact: true }).click();
  await page.waitForURL(/\/dashboard\/normal/, { timeout: 15000 });
  await page.getByRole('heading', { name: '普通仪表盘' }).waitFor();
});

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ app: 'vue-real', passed: results.length - failed.length, failed: failed.length, results, consoleErrors: consoleErrors.slice(0, 20) }, null, 2));
process.exit(failed.length ? 1 : 0);
