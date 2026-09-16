import { _electron as electron } from 'playwright';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { listPackage } from '@electron/asar';

const executablePath = process.argv[2];
if (!executablePath) throw new Error('Pass the installed executable path as the first argument');
mkdirSync('test-results', { recursive: true });
const profile = mkdtempSync(path.resolve('test-results', '安装验证-'));
const env = { ...process.env };
for (const key of ['ELECTRON_RUN_AS_NODE', 'RAIN_E2E', 'RAIN_TEST_ORIGIN', 'RAIN_TEST_DATA']) delete env[key];
const application = await electron.launch({ executablePath, args: [`--user-data-dir=${profile}`], env, timeout: 30000 });
try {
  const page = await application.firstWindow();
  await page.getByRole('heading', { name: '课堂工作台', exact: true }).waitFor();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const runtime = await application.evaluate(({ app }) => ({ packaged: app.isPackaged, appPath: app.getAppPath(), userData: app.getPath('userData'), version: app.getVersion() }));
  assert.equal(runtime.packaged, true);
  assert.equal(runtime.userData, profile);
  assert.equal(runtime.version, '0.1.0');
  assert.equal(await page.evaluate(() => typeof window.require), 'undefined');
  assert.equal(await page.evaluate(() => typeof window.process), 'undefined');
  const state = await page.evaluate(() => window.rain.command({ type: 'state' }));
  assert.equal(state.mode, 'stopped');
  assert.equal(state.identity, null);
  assert.equal(state.model.hasKey, false);
  await page.getByRole('button', { name: '模型设置', exact: true }).click();
  await page.getByRole('heading', { name: '连接你的视觉模型', exact: true }).waitFor();
  assert.equal(await page.locator('#api-key').getAttribute('type'), 'password');
  await application.evaluate(({ BrowserWindow }) => { const win = BrowserWindow.getAllWindows()[0]; win.setSize(1030, 720); win.webContents.setZoomFactor(1.25); });
  await page.waitForFunction(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  await page.screenshot({ path: 'test-results/installed-125-percent.png', fullPage: true });
  await page.getByRole('button', { name: '课堂工作台', exact: true }).click();
  await page.getByRole('heading', { name: '课堂工作台', exact: true }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  const contents = listPackage(runtime.appPath);
  assert.ok(contents.some(p => p.endsWith('main.cjs')));
  assert.ok(!contents.some(p => /(?:^|[\\/])(?:\.research|test-results|\.runtime|tests|deliverables)(?:[\\/]|$)/.test(p)));
  assert.ok(!contents.some(p => /(?:^|[\\/])(?:settings|ledger|platform-session)\.json$/.test(p)));
  assert.deepEqual(errors, []);
  const report = { status: 'PASS', version: runtime.version, checks: ['installed packaged runtime', 'Chinese user-data path', 'isolated stopped startup', 'renderer Node isolation', 'model settings navigation', '1030x720 window at 125% zoom', 'private/test artifacts absent from archive'], archiveEntries: contents.length };
  writeFileSync('test-results/package-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await application.close();
}
