const { chromium } = require('playwright');
// usage: node render.js <html> <out.png> <selector> <w> <h> [transparent|opaque]
(async () => {
  const [file, out, selector, w, h, mode] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({
    viewport: { width: parseInt(w, 10), height: parseInt(h, 10) },
    deviceScaleFactor: 2,
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('JS ' + e.message));
  p.on('requestfailed', r => errs.push('REQFAIL ' + r.url()));
  await p.goto('file://' + file, { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);
  const opts = { path: out };
  if (mode === 'transparent') opts.omitBackground = true;
  if (selector && selector !== '-') {
    const el = await p.$(selector);
    if (!el) throw new Error('selector not found: ' + selector);
    await el.screenshot(opts);
  } else {
    await p.screenshot({ ...opts, fullPage: false });
  }
  const box = selector !== '-' ? await (await p.$(selector)).boundingBox() : { width: +w, height: +h };
  console.log('wrote', out, JSON.stringify(box), 'errs:', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
