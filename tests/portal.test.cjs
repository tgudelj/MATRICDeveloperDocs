const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const site = path.join(root, '_site');
const prefix = '/MATRICDeveloperDocs/';
let server, browser, origin;

test.before(async () => {
  assert.ok(fs.existsSync(path.join(site, 'index.html')), 'Build the portal before running browser checks');
  server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://fixture');
    if (!url.pathname.startsWith(prefix)) { response.writeHead(404); response.end(); return; }
    let file = path.resolve(site, decodeURIComponent(url.pathname.slice(prefix.length)));
    if (file !== site && !file.startsWith(site + path.sep)) { response.writeHead(403); response.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { response.writeHead(404); response.end(); return; }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
      '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    response.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ headless: true,
    ...(process.env.MATRIC_DOCS_BROWSER ? { executablePath: process.env.MATRIC_DOCS_BROWSER } : {}) });
});

test.after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

async function open(t, pagePath = '', viewport = { width: 1440, height: 1000 }) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 400) errors.push(response.url()); });
  t.after(async () => { await page.close(); assert.deepEqual(errors, []); });
  await page.goto(origin + prefix + pagePath);
  return page;
}

async function screenshot(page, name) {
  if (!process.env.MATRIC_DOCS_SCREENSHOTS) return;
  fs.mkdirSync(process.env.MATRIC_DOCS_SCREENSHOTS, { recursive: true });
  await page.screenshot({ path: path.join(process.env.MATRIC_DOCS_SCREENSHOTS, name + '.png'), fullPage: true });
}

test('project-path navigation, illustrations and section links work', async t => {
  const page = await open(t);
  assert.equal(await page.title(), 'Extend MATRIC - MATRIC developers');
  assert.ok(await page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
  await screenshot(page, 'portal-desktop');
  await page.locator('.md-nav--primary').getByRole('link', { name: 'Copy and customize the starter applet', exact: true }).click();
  await page.locator('#keep-the-fitting-code .headerlink').click();
  assert.match(page.url(), /applets\/starter\/#keep-the-fitting-code$/);
  assert.ok(await page.getByRole('heading', { name: 'Keep the fitting code', exact: false }).isVisible());
});

test('full-text search finds a guide and opens the result', async t => {
  const page = await open(t);
  await page.locator('.md-search__button').click();
  await page.getByRole('combobox', { name: 'Search', exact: true }).fill('UDP');
  const result = page.getByRole('option', { name: 'Your first UDP integration', exact: true });
  await result.waitFor({ state: 'visible', timeout: 15000 });
  await result.click();
  assert.match(page.url(), /udp\/quickstart\//);
  await page.getByTitle('Copy to clipboard', { exact: true }).first().waitFor({ state: 'visible' });
});

test('example links download the unchanged package and JavaScript source', async t => {
  const page = await open(t, 'applets/starter/');
  for (const [label, file] of [['starter-applet.mapl', 'starter-applet.mapl'], ['JavaScript', 'starter-applet/applet.js']]) {
    const link = page.getByRole('link', { name: label, exact: true });
    assert.equal(await link.getAttribute('download'), path.basename(file));
    const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
    assert.equal(download.suggestedFilename(), path.basename(file));
    const bytes = fs.readFileSync(await download.path());
    const original = fs.readFileSync(path.join(root, 'examples/applets', file));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), crypto.createHash('sha256').update(original).digest('hex'));
  }
});

test('mobile navigation works without horizontal page overflow', async t => {
  const page = await open(t, '', { width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await screenshot(page, 'portal-mobile');
  await page.locator('.md-header label[for="__drawer"]').click();
  await page.locator('.md-nav--primary').getByText('UDP Integration API', { exact: true }).first().click();
  await page.locator('.md-nav--primary').getByRole('link', { name: 'Your first UDP integration', exact: true }).click();
  assert.match(page.url(), /udp\/quickstart\//);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
});
