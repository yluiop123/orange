/**
 * Three-frontend visual parity capture + diff.
 *
 * Implements the screenshot protocol from `.scratch/ui-parity/spec.md`:
 * Chrome, 1440x900, DPR 1, locale zh, animations disabled, same route and
 * scroll position. Diff is reported as mean absolute error (MAE) and the share
 * of pixels whose max channel delta is greater than 12.
 *
 * Usage:
 *   node parity.mjs                         # button tab, dark/light, default/blue
 *   node parity.mjs --tabs=button,affix     # selected tabs only
 *   node parity.mjs --themes=dark           # selected themes only
 *   node parity.mjs --colors=default        # selected palettes only
 *   node parity.mjs --out=D:/tmp/parity     # output directory
 *
 * The script logs in through each app's own login screen with the mock
 * credentials super/super, then navigates directly to the route.
 * React is the content baseline.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || 'true'];
  }),
);

const outDir = path.resolve(args.get('out') ?? 'D:/User/Cache/Temp/opencode/parity');
const tabs = (args.get('tabs') ?? 'button,floatButton,affix,typography').split(',').filter(Boolean);
const themes = (args.get('themes') ?? 'dark,light').split(',').filter(Boolean);
const colors = (args.get('colors') ?? 'default,blue').split(',').filter(Boolean);

const VIEWPORT = { width: 1440, height: 900 };
/* Page content below the header and right of the sidebar. Shell chrome is
   outside this ticket's scope; report both metrics so nothing is hidden. */
const CONTENT_CROP = { x: 256, y: 64, width: 1184, height: 836 };
const ROUTE = '/component/general';

const APPS = [
  { id: 'react', base: 'http://localhost:5173', route: `/#${ROUTE}`, tabsWait: 'tab' },
  { id: 'vue', base: 'http://localhost:5174', route: ROUTE, tabsWait: 'tab' },
  { id: 'angular', base: 'http://localhost:4200', route: ROUTE, tabsWait: 'tab' },
];

const TAB_LABELS = {
  button: 'Button',
  floatButton: 'FloatButton',
  affix: 'Affix',
  typography: 'Typography',
};

/* ------------------------------------------------------------------ */
/* PNG decode / encode (8-bit, non-interlaced; no external deps)       */
/* ------------------------------------------------------------------ */

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function readChunks(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('not a PNG');
  const chunks = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 12 + length;
    if (type === 'IEND') break;
  }
  return chunks;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePng(buffer) {
  const chunks = readChunks(buffer);
  const ihdr = chunks.find((chunk) => chunk.type === 'IHDR')?.data;
  if (!ihdr) throw new Error('missing IHDR');
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const bitDepth = ihdr[8];
  const colorType = ihdr[9];
  const interlace = ihdr[12];
  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
  if (interlace !== 0) throw new Error('interlaced PNG is not supported');
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`unsupported color type ${colorType}`);
  const raw = zlib.inflateSync(Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data)));
  const stride = width * channels;
  const pixels = Buffer.alloc(width * height * 4);
  let previous = Buffer.alloc(stride);
  let cursor = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[cursor];
    cursor += 1;
    const row = Buffer.from(raw.subarray(cursor, cursor + stride));
    cursor += stride;
    const bpp = channels;
    for (let x = 0; x < stride; x += 1) {
      const left = x >= bpp ? row[x - bpp] : 0;
      const up = previous[x];
      const upLeft = x >= bpp ? previous[x - bpp] : 0;
      let value = row[x];
      if (filter === 1) value = (value + left) & 0xff;
      else if (filter === 2) value = (value + up) & 0xff;
      else if (filter === 3) value = (value + ((left + up) >> 1)) & 0xff;
      else if (filter === 4) value = (value + paeth(left, up, upLeft)) & 0xff;
      else if (filter !== 0) throw new Error(`unsupported filter ${filter}`);
      row[x] = value;
    }
    for (let x = 0; x < width; x += 1) {
      const source = x * channels;
      const target = (y * width + x) * 4;
      if (channels === 1) {
        pixels[target] = row[source];
        pixels[target + 1] = row[source];
        pixels[target + 2] = row[source];
        pixels[target + 3] = 255;
      } else if (channels === 2) {
        pixels[target] = row[source];
        pixels[target + 1] = row[source];
        pixels[target + 2] = row[source];
        pixels[target + 3] = row[source + 1];
      } else if (channels === 3) {
        pixels[target] = row[source];
        pixels[target + 1] = row[source + 1];
        pixels[target + 2] = row[source + 2];
        pixels[target + 3] = 255;
      } else {
        row.copy(pixels, target, source, source + 4);
      }
    }
    previous = row;
  }
  return { width, height, data: pixels };
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function cropImage(image, rect) {
  const x = Math.max(0, Math.min(rect.x, image.width));
  const y = Math.max(0, Math.min(rect.y, image.height));
  const width = Math.max(0, Math.min(rect.width, image.width - x));
  const height = Math.max(0, Math.min(rect.height, image.height - y));
  const data = Buffer.alloc(width * height * 4);
  for (let row = 0; row < height; row += 1) {
    const source = ((y + row) * image.width + x) * 4;
    data.set(image.data.subarray(source, source + width * 4), row * width * 4);
  }
  return { width, height, data };
}

function diffPng(a, b) {
  const width = Math.min(a.width, b.width);
  const height = Math.min(a.height, b.height);
  const out = Buffer.alloc(width * height * 4);
  let sum = 0;
  let overThreshold = 0;
  let pixels = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const ai = (y * a.width + x) * 4;
      const bi = (y * b.width + x) * 4;
      const dr = Math.abs(a.data[ai] - b.data[bi]);
      const dg = Math.abs(a.data[ai + 1] - b.data[bi + 1]);
      const db = Math.abs(a.data[ai + 2] - b.data[bi + 2]);
      const delta = Math.max(dr, dg, db);
      sum += dr + dg + db;
      pixels += 1;
      if (delta > 12) overThreshold += 1;
      const oi = (y * width + x) * 4;
      if (delta > 12) {
        out[oi] = 255;
        out[oi + 1] = Math.max(0, 80 - delta);
        out[oi + 2] = Math.max(0, 80 - delta);
      } else {
        const faded = 255 - Math.round(delta * 2);
        out[oi] = faded;
        out[oi + 1] = faded;
        out[oi + 2] = faded;
      }
      out[oi + 3] = 255;
    }
  }
  return {
    width,
    height,
    rgba: out,
    mae: sum / (pixels * 3),
    overThresholdShare: overThreshold / pixels,
  };
}

/* ------------------------------------------------------------------ */
/* Capture                                                             */
/* ------------------------------------------------------------------ */

function storageSeed(app, theme, color) {
  if (app === 'react') {
    return {
      'theme-mode': theme,
      'theme-color': color,
      locale: 'zh',
      sidebar_state: 'true',
    };
  }
  if (app === 'vue') {
    return {
      'orange.theme': theme,
      'orange.color': color,
      'orange.sidebar': '0',
      locale: 'zh',
    };
  }
  return {
    'orange.angular.theme': theme,
    'orange.angular.color': color,
    'orange.angular.sidebar': '0',
    locale: 'zh',
  };
}

const ANIMATION_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
  html, body, * { scrollbar-width: none !important; }
  *::-webkit-scrollbar { display: none !important; }
`;

async function login(page, base) {
  await page.goto(`${base}/#/login`).catch(async () => page.goto(`${base}/login`));
  await page.waitForLoadState('domcontentloaded');
  const inputs = page.locator('input:visible');
  await inputs.nth(0).fill('super');
  await inputs.nth(1).fill('super');
  await page.getByRole('button', { name: /登录|Login/i }).first().click();
  await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 30000 });
  await page.waitForTimeout(800);
}

async function scrollToTop(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    for (const element of document.querySelectorAll('*')) {
      if (element.scrollTop > 0) element.scrollTop = 0;
      if (element.scrollLeft > 0) element.scrollLeft = 0;
    }
  });
}

async function capture(browser, app, theme, color) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    reducedMotion: 'reduce',
  });
  const seed = storageSeed(app.id, theme, color);
  await context.addInitScript((entries) => {
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
  }, seed);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('pageerror', (error) => consoleErrors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  const files = {};
  try {
    await login(page, app.base);
    for (const tab of tabs) {
      await page.goto(`${app.base}${app.route}`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('tab', { name: TAB_LABELS[tab] }).first().waitFor({ timeout: 30000 });
      await page.getByRole('tab', { name: TAB_LABELS[tab] }).first().click();
      await page.addStyleTag({ content: ANIMATION_CSS });
      await page.evaluate(() => document.fonts?.ready);
      await page.waitForTimeout(600);
      await scrollToTop(page);
      await page.waitForTimeout(150);
      const file = path.join(outDir, `${app.id}-${theme}-${color}-${tab}.png`);
      await page.screenshot({ path: file });
      files[tab] = file;
    }
  } finally {
    await context.close();
  }
  return { files, consoleErrors };
}

/* ------------------------------------------------------------------ */

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { generatedAt: new Date().toISOString(), viewport: VIEWPORT, runs: [] };

try {
  for (const theme of themes) {
    for (const color of colors) {
      const captured = {};
      for (const app of APPS) {
        process.stdout.write(`capture ${app.id} ${theme}/${color}... `);
        captured[app.id] = await capture(browser, app, theme, color);
        console.log('ok');
      }
      for (const tab of tabs) {
        const baseline = decodePng(fs.readFileSync(captured.react.files[tab]));
        for (const app of APPS.filter((entry) => entry.id !== 'react')) {
          const image = decodePng(fs.readFileSync(captured[app.id].files[tab]));
          const result = diffPng(baseline, image);
          const contentResult = diffPng(cropImage(baseline, CONTENT_CROP), cropImage(image, CONTENT_CROP));
          const diffFile = path.join(outDir, `diff-${app.id}-${theme}-${color}-${tab}.png`);
          const contentDiffFile = path.join(
            outDir,
            `diff-content-${app.id}-${theme}-${color}-${tab}.png`,
          );
          fs.writeFileSync(diffFile, encodePng(result.width, result.height, result.rgba));
          fs.writeFileSync(
            contentDiffFile,
            encodePng(contentResult.width, contentResult.height, contentResult.rgba),
          );
          const entry = {
            theme,
            color,
            tab,
            pair: `${app.id}-vs-react`,
            mae: Number(result.mae.toFixed(3)),
            overThresholdShare: Number((result.overThresholdShare * 100).toFixed(3)),
            contentMae: Number(contentResult.mae.toFixed(3)),
            contentOverThresholdShare: Number((contentResult.overThresholdShare * 100).toFixed(3)),
            diff: path.relative(outDir, diffFile).replaceAll('\\', '/'),
            contentDiff: path.relative(outDir, contentDiffFile).replaceAll('\\', '/'),
            consoleErrors: [...captured.react.consoleErrors, ...captured[app.id].consoleErrors],
          };
          report.runs.push(entry);
          console.log(
            `${theme}/${color} ${tab}: ${entry.pair} MAE ${entry.mae} (content ${entry.contentMae}), >12 ${entry.overThresholdShare}% (content ${entry.contentOverThresholdShare}%)`,
          );
        }
      }
    }
  }
} finally {
  await browser.close();
}

const reportFile = path.join(outDir, 'report.json');
fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(`\nScreenshots + report: ${outDir}`);
