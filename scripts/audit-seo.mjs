// Run after npm run build. --live checks the deployed sitemap instead of out/.
// This checks generated HTML, not browser layout or full Schema.org semantics.
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';

const live = process.argv.includes('--live');
const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'https://innstack.online').replace(/\/$/, '');
const decode = value => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], decode(m[2])]));
const text = html => decode(html.replace(/<(script|style|svg|dialog)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
async function load(path) {
  if (!live) return readFileSync(join('out', path.endsWith('/') ? `${path}index.html` : path), 'utf8');
  const response = await fetch(`${origin}${path}`, {redirect:'manual', signal:AbortSignal.timeout(30000)});
  if (response.status !== 200) throw new Error(`${path}: HTTP ${response.status} ${response.headers.get('location') || ''}`);
  if (/noindex/i.test(response.headers.get('x-robots-tag') || '')) throw new Error(`${path}: X-Robots-Tag noindex`);
  return response.text();
}
const sitemap = await load('/sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => decode(m[1]));
const pages = new Map();
const errors = [];
for (const url of urls) {
  const path = new URL(url).pathname;
  try {
    const html = await load(path);
    const head = html.match(/<head>[\s\S]*?<\/head>/)?.[0] || '';
    const metas = [...head.matchAll(/<meta\b[^>]*>/g)].map(m => attrs(m[0]));
    const canonical = [...head.matchAll(/<link\b[^>]*>/g)].map(m => attrs(m[0])).filter(a => a.rel === 'canonical');
    const title = text(head.match(/<title>(.*?)<\/title>/)?.[1] || '');
    if (canonical.length !== 1 || canonical[0].href !== url) errors.push(`${path}: canonical does not match sitemap`);
    for (const name of ['description','og:title','og:description','og:url','twitter:card']) {
      if (!metas.some(m => (m.name === name || m.property === name) && m.content)) errors.push(`${path}: missing ${name}`);
    }
    if (metas.find(m => m.property === 'og:url')?.content !== url) errors.push(`${path}: og:url does not match sitemap`);
    if (metas.some(m => /^(robots|googlebot)$/.test(m.name) && /noindex/i.test(m.content))) errors.push(`${path}: noindex in sitemap`);
    if (!title) errors.push(`${path}: missing title`);
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || '';
    if ((main.match(/<h1\b/g) || []).length !== 1) errors.push(`${path}: expected one main H1`);
    pages.set(path, {html, main, title, schemas, incoming:new Set(), mainIncoming:new Set()});
  } catch (error) { errors.push(error.message); }
}
for (const [path, page] of pages) {
  for (const [markup, contextual] of [[page.html.replace(/<(script|dialog)\b[^>]*>[\s\S]*?<\/\1>/gi, ''), false], [page.main, true]]) {
    for (const match of markup.matchAll(/<a\b[^>]*>/g)) {
      const href = attrs(match[0]).href;
      if (!href || /^(mailto:|tel:)/.test(href)) continue;
      const target = new URL(href, `${origin}${path}`);
      if (target.origin !== origin) continue;
      const normalized = target.pathname.endsWith('/') || /\.[^/]+$/.test(target.pathname) ? target.pathname : `${target.pathname}/`;
      const destination = pages.get(normalized);
      if (!destination) {
        if (!existsSync(join('out', decodeURIComponent(target.pathname)))) errors.push(`${path}: unlisted/missing internal target ${href}`);
        continue;
      }
      if (normalized !== path) (contextual ? destination.mainIncoming : destination.incoming).add(path);
      if (target.hash && !destination.html.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`)) errors.push(`${path}: missing fragment ${href}`);
    }
  }
}
console.log(JSON.stringify({
  mode:live?'live':'export', pages:pages.size, jsonLdBlocks:[...pages.values()].reduce((n,p)=>n+p.schemas.length,0),
  errors:[...new Set(errors)],
  incoming:[...pages].map(([path,p])=>({path,incoming:p.incoming.size,mainIncoming:p.mainIncoming.size})),
  longTitles:[...pages].filter(([,p])=>p.title.length>65).map(([path,p])=>({path,title:p.title,length:p.title.length})),
  homepage:pages.has('/')?{
    htmlBytes:Buffer.byteLength(pages.get('/').html),
    inlineScriptBytes:[...pages.get('/').html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].reduce((n,m)=>n+Buffer.byteLength(m[0]),0),
    mainTextWords:text(pages.get('/').main).split(/\s+/).length,
  }:null,
}, null, 2));
if (errors.length) process.exitCode = 1;
