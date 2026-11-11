const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../examples/applets/starter-applet');
let browser, server, origin;

test.before(async () => {
  server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://fixture');
    if (url.pathname === '/fixture') {
      response.setHeader('Content-Type', 'text/html');
      response.end(`<!doctype html><style>iframe{border:0;width:600px;height:400px}</style>
        <iframe src="/applet.html#one"></iframe><iframe src="/applet.html#two"></iframe>
        <script>
          window.events=[];window.snapshots=[{telemetry:0},{telemetry:99}];
          window.params=[{Caption:'First instance',VariableToDisplay:'telemetry'},
            {Caption:'Second instance',VariableToDisplay:'telemetry'}];
          const frames=[...document.querySelectorAll('iframe')];
          window.push=(index,messageId,payload)=>{
            if(messageId==='VARIABLESUPDATE')snapshots[index]=payload;
            frames[index].contentWindow.postMessage({messageId,payload},location.origin);
          };
          addEventListener('message',event=>{
            const index=frames.findIndex(frame=>frame.contentWindow===event.source);
            if(index<0)return;
            events.push(event.data);
            if(event.data.payload?.EventName==='reqvariables'){
              const setup=[['PARAMSUPDATE',params[index]],['VARIABLESUPDATE',snapshots[index]]];
              if(new URLSearchParams(location.search).get('order')!=='params')setup.reverse();
              setup.forEach(([name,value])=>push(index,name,value));
              push(index,'RESIZE',{environment:${JSON.stringify(url.searchParams.get('environment') || 'client')}});
            }
          });
        </script>`);
      return;
    }
    const file = path.resolve(root, '.' + url.pathname);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404); response.end(); return;
    }
    response.setHeader('Content-Type', file.endsWith('.html') ? 'text/html'
      : file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'application/json');
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

async function open(t, query = '') {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(async () => { await page.close(); assert.deepEqual(errors, []); });
  await page.goto(origin + '/fixture' + query);
  await page.waitForFunction(() => events.filter(e => e.payload?.EventName === 'reqvariables').length >= 2);
  const frame = page.frames().find(f => f.url().endsWith('#one'));
  const second = page.frames().find(f => f.url().endsWith('#two'));
  await frame.waitForFunction(() => document.getElementById('value').textContent === '0');
  return { page, frame, second };
}

async function push(page, name, payload) {
  await page.evaluate(({ name, payload }) => window.push(0, name, payload), { name, payload });
}

async function fits(frame, padding = 12) {
  await frame.waitForFunction(padding => {
    const r = document.getElementById('design').getBoundingClientRect();
    const inset = Math.min(padding, Math.max(0, (Math.min(innerWidth, innerHeight) - 1) / 2));
    return r.width > 0 && r.left >= -0.1 && r.top >= -0.1
      && r.right <= innerWidth + 0.1 && r.bottom <= innerHeight + 0.1
      && Math.abs((r.left + r.right) / 2 - innerWidth / 2) < 0.1
      && Math.abs((r.top + r.bottom) / 2 - innerHeight / 2) < 0.1
      && (Math.abs(r.left - inset) < 0.1 || Math.abs(r.top - inset) < 0.1);
  }, padding);
  const box = await frame.locator('#design').boundingBox();
  // Browser-reported bounds are quantized at subpixel sizes. Use an absolute
  // pixel tolerance so the 1px stress case does not amplify rounding into a ratio error.
  assert.ok(Math.abs(box.width - 1.5 * box.height) < 0.05, 'Design stays 3:2: ' + JSON.stringify(box));
}

test('standalone file preview works without a server or external resources', async t => {
  const page = await browser.newPage();
  t.after(() => page.close());
  const remote = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) remote.push(request.url()); });
  await page.goto(pathToFileURL(path.join(root, 'applet.html')).href);
  assert.equal(await page.locator('#value').textContent(), '23.5');
  await page.locator('#activate').click();
  assert.match(await page.locator('#status').textContent(), /Preview only/);
  assert.deepEqual(remote, []);
});

test('wide, square, tall and tiny containers fit; scaled pointer clicks reach the right instance', async t => {
  const { page, frame } = await open(t);
  for (const [width, height] of [[1000, 240], [320, 320], [240, 640], [600, 400], [480, 320], [1, 1]]) {
    await page.locator('iframe').first().evaluate((el, size) => {
      el.style.width = size[0] + 'px'; el.style.height = size[1] + 'px';
    }, [width, height]);
    await fits(frame);
  }
  await page.locator('iframe').first().evaluate(el => { el.style.width = '480px'; el.style.height = '320px'; });
  await fits(frame);
  const button = await frame.locator('#activate').boundingBox();
  assert.ok(button.height >= 44, 'Recommended minimum retains the touch target');
  // Use a real pointer through the CSS transform, rather than dispatching a DOM click.
  await page.mouse.click(button.x + button.width / 2, button.y + button.height / 2);
  await page.waitForFunction(() => events.some(e => e.messageId === 'cce-one' && e.payload.EventName === 'activate'));
  const actions = await page.evaluate(() => events.filter(e => e.payload.EventName === 'activate'));
  assert.deepEqual(actions, [{ messageId: 'cce-one', payload: { EventName: 'activate', Data: null } }]);
  if (process.env.MATRIC_DOCS_SCREENSHOTS) {
    fs.mkdirSync(process.env.MATRIC_DOCS_SCREENSHOTS, { recursive: true });
    await page.locator('iframe').first().screenshot({ path: path.join(process.env.MATRIC_DOCS_SCREENSHOTS, 'starter.png') });
  }
});

for (const order of ['params', 'variables']) {
  test(`parameters and variables may arrive ${order} first; zero, false, missing and text are safe`, async t => {
    const { page, frame } = await open(t, '?order=' + order);
    await push(page, 'VARIABLESUPDATE', { telemetry: false });
    await frame.waitForFunction(() => document.getElementById('value').textContent === 'false');
    await push(page, 'VARIABLESUPDATE', {});
    await frame.waitForFunction(() => document.getElementById('value').textContent === 'Waiting for value');
    await push(page, 'VARIABLESUPDATE', { telemetry: null });
    await push(page, 'VARIABLESUPDATE', { telemetry: '<img src=x onerror=alert(1)>' });
    await frame.waitForFunction(() => document.getElementById('value').textContent.startsWith('<img'));
    assert.equal(await frame.locator('img').count(), 0);
    await push(page, 'PARAMSUPDATE', { VariableToDisplay: 'other', Caption: 'Long caption '.repeat(100) });
    await push(page, 'VARIABLESUPDATE', { other: 'Long value '.repeat(100) });
    await frame.waitForFunction(() => document.getElementById('value').textContent.startsWith('Long value'));
    await fits(frame);
    assert.equal(await frame.locator('#value').getAttribute('title'), 'Long value '.repeat(100));
  });
}

test('padding changes refit safely and malformed messages do not corrupt the applet', async t => {
  const { page, frame } = await open(t);
  await push(page, 'PARAMSUPDATE', { Padding: -20, BackgroundColor: '#123456' });
  await frame.waitForFunction(() => document.getElementById('design').getBoundingClientRect().width > 599);
  await push(page, 'PARAMSUPDATE', { Padding: 999999 });
  await fits(frame, 256);
  await push(page, 'PARAMSUPDATE', { Padding: NaN, Caption: null, AccentColor: 'not-a-color' });
  await page.evaluate(() => {
    const target = document.querySelector('iframe').contentWindow;
    for (const value of [null, [], { messageId: 'PARAMSUPDATE', payload: [] }, { payload: {} }]) {
      target.postMessage(value, location.origin);
    }
  });
  assert.equal(await frame.locator('#caption').textContent(), 'First instance');
  await push(page, 'PARAMSUPDATE', { Padding: 12 });
  await fits(frame);
  assert.equal(await frame.locator('#value').textContent(), '0');
});

test('two instances stay separate and reject messages sent by a sibling or themselves', async t => {
  const { page, frame, second } = await open(t);
  await second.waitForFunction(() => document.getElementById('value').textContent === '99');
  await second.evaluate(() => parent.document.querySelector('iframe').contentWindow.postMessage(
    { messageId: 'VARIABLESUPDATE', payload: { telemetry: 'foreign' } }, location.origin));
  await frame.evaluate(() => window.postMessage(
    { messageId: 'VARIABLESUPDATE', payload: { telemetry: 'self' } }, location.origin));
  // Wait for queued messages to be handled before inspecting the unchanged data.
  await frame.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await frame.locator('#value').textContent(), '0');
  assert.equal(await second.locator('#value').textContent(), '99');
  await push(page, 'PARAMSUPDATE', { Caption: 'Only first' });
  await frame.waitForFunction(() => document.getElementById('caption').textContent === 'Only first');
  assert.equal(await second.locator('#caption').textContent(), 'Second instance');
});

test('resize, hide/show and resume preserve the document and data without replaying an action', async t => {
  const { page, frame } = await open(t);
  await push(page, 'VARIABLESUPDATE', { telemetry: 42 });
  await frame.waitForFunction(() => document.getElementById('value').textContent === '42');
  await frame.evaluate(() => { window.retainedDraft = 123; });
  const originalUrl = frame.url();
  await page.locator('iframe').first().evaluate(el => { el.style.display = 'none'; });
  await page.locator('iframe').first().evaluate(el => {
    el.style.width = '800px'; el.style.height = '320px'; el.style.display = '';
  });
  await frame.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await fits(frame);
  assert.equal(frame.url(), originalUrl);
  assert.equal(await frame.evaluate(() => retainedDraft), 123);
  assert.equal(await frame.locator('#value').textContent(), '42');
  assert.equal(await page.evaluate(() => events.filter(e => e.payload.EventName === 'activate').length), 0);
});

test('editor messages disable interaction while continuing to display variables', async t => {
  const { frame } = await open(t, '?environment=editor');
  await frame.waitForFunction(() => document.getElementById('activate').disabled);
  assert.equal(await frame.locator('#value').textContent(), '0');
  assert.match(await frame.locator('#status').textContent(), /Editor preview/);
});
