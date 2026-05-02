const https = require('https');
const http  = require('http');

const scrapeCache = new Map();

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHtml(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
  });
}

async function inspectPage(url) {
  if (!url) return { skipped: true, reason: 'No URL available for inspection' };
  if (scrapeCache.has(url)) return scrapeCache.get(url);

  try {
    const html = await fetchHtml(url);

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
                   || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
    const metaDescription = metaMatch ? metaMatch[1].trim() : '';

    const inputCount         = (html.match(/<input/gi) || []).length;
    const passwordFieldCount = (html.match(/<input[^>]+type=["']password["']/gi) || []).length;
    const hiddenInputCount   = (html.match(/<input[^>]+type=["']hidden["']/gi) || []).length;
    const formCount          = (html.match(/<form/gi) || []).length;
    const hasLoginForm       = passwordFieldCount > 0 || formCount > 0;
    const scriptCount        = (html.match(/<script[^>]+src=/gi) || []).length;

    let currentDomain = '';
    try { currentDomain = new URL(url).hostname; } catch {}

    const hrefMatches = [...html.matchAll(/href=["']([^"']+)["']/gi)].map(m => m[1]);
    const externalDomains = [...new Set(
      hrefMatches
        .map(h => { try { return new URL(h, url).hostname; } catch { return null; } })
        .filter(h => h && h !== currentDomain)
    )].slice(0, 10);

    const result = {
      skipped: false,
      title,
      metaDescription,
      inputCount,
      passwordFieldCount,
      hiddenInputCount,
      formCount,
      hasLoginForm,
      scriptCount,
      externalLinkCount: externalDomains.length,
      externalDomains,
    };

    scrapeCache.set(url, result);
    return result;
  } catch (error) {
    return { skipped: true, reason: error.message };
  }
}

module.exports = { inspectPage };
