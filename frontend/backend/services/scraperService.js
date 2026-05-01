const scrapeCache = new Map();

async function inspectPage(url) {
  if (!url) {
    return { skipped: true, reason: 'No URL available for inspection' };
  }

  if (scrapeCache.has(url)) {
    return scrapeCache.get(url);
  }

  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    return {
      skipped: true,
      reason: 'Puppeteer is not installed',
    };
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(3000);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 3000 });

    const data = await page.evaluate(() => {
      const title       = document.title || '';
      const metaDescEl  = document.querySelector('meta[name="description"]');
      const metaDescription = metaDescEl ? metaDescEl.getAttribute('content') || '' : '';

      const inputCount         = document.querySelectorAll('input').length;
      const passwordFieldCount = document.querySelectorAll('input[type="password"]').length;
      const hiddenInputCount   = document.querySelectorAll('input[type="hidden"]').length;
      const formCount          = document.querySelectorAll('form').length;
      const hasLoginForm       = passwordFieldCount > 0 || formCount > 0;
      const scriptCount        = document.querySelectorAll('script[src]').length;

      const currentDomain = location.hostname;
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      const externalLinks = anchors
        .map(a => { try { return new URL(a.href); } catch { return null; } })
        .filter(u => u && u.hostname && u.hostname !== currentDomain)
        .map(u => u.hostname);
      const externalDomainsUnique = Array.from(new Set(externalLinks)).slice(0, 10);

      return {
        title,
        metaDescription,
        inputCount,
        passwordFieldCount,
        hiddenInputCount,
        formCount,
        hasLoginForm,
        scriptCount,
        externalLinkCount: externalLinks.length,
        externalDomains:   externalDomainsUnique,
      };
    });

    const result = {
      skipped: false,
      ...data,
    };

    scrapeCache.set(url, result);
    return result;
  } catch (error) {
    return {
      skipped: true,
      reason: error.message,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { inspectPage };