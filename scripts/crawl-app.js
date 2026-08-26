import http from 'http';
import https from 'https';
import { URL } from 'url';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:4001';

const routesToCrawl = [
  '/',
  '/workflows',
  '/excel',
  '/docs',
  '/privacy',
  '/support',
  '/files',
  '/coming-soon',
];

const apiRoutesToCrawl = [
  '/',
  '/health',
  '/api/health',
  '/api/message',
];

async function checkUrl(urlStr) {
  try {
    const res = await fetch(urlStr);
    const text = await res.text();
    // Simple link extraction regex
    const links = [];
    const linkRegex = /href=["']([^"']+)["']/g;
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
      links.push(match[1]);
    }
    
    // Extract title tag
    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'No Title';

    return {
      url: urlStr,
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      title,
      contentType: res.headers.get('content-type'),
      bodyLength: text.length,
      linksFound: Array.from(new Set(links)),
    };
  } catch (err) {
    return {
      url: urlStr,
      status: 0,
      ok: false,
      error: err.message,
    };
  }
}

async function runCrawler() {
  console.log('===================================================');
  console.log('🕷️  NEURON_FLOW WEB APPLICATION CRAWLER REPORT  🕷️');
  console.log('===================================================\n');

  console.log('--- 1. CRAWLING FRONTEND ROUTES (Next.js :3000) ---');
  const frontendResults = [];
  for (const route of routesToCrawl) {
    const target = `${BASE_URL}${route}`;
    const result = await checkUrl(target);
    frontendResults.push(result);
    if (result.ok) {
      console.log(`✅ [${result.status}] ${route} - Title: "${result.title}" (${result.bodyLength} bytes, ${result.linksFound.length} links)`);
    } else {
      console.log(`❌ [${result.status}] ${route} - Error: ${result.error || result.statusText}`);
    }
  }

  console.log('\n--- 2. CRAWLING COMPANION API ENDPOINTS (Express :4001) ---');
  const apiResults = [];
  for (const route of apiRoutesToCrawl) {
    const target = `${API_URL}${route}`;
    const result = await checkUrl(target);
    apiResults.push(result);
    if (result.ok) {
      console.log(`✅ [${result.status}] ${route} - Response (${result.bodyLength} bytes)`);
    } else {
      console.log(`❌ [${result.status}] ${route} - Error: ${result.error || result.statusText}`);
    }
  }

  console.log('\n--- 3. DISCOVERED INTERNAL LINKS ANALYSIS ---');
  const allInternalLinks = new Set();
  frontendResults.forEach(r => {
    if (r.linksFound) {
      r.linksFound.forEach(link => {
        if (link.startsWith('/') || link.startsWith('http://localhost:3000')) {
          allInternalLinks.add(link);
        }
      });
    }
  });
  console.log(`Found ${allInternalLinks.size} unique internal link hrefs across crawled pages:`);
  allInternalLinks.forEach(l => console.log(`  🔗 ${l}`));

  console.log('\n===================================================');
  console.log('✨ Crawl Complete! All primary routes checked.');
  console.log('===================================================');
}

runCrawler();
