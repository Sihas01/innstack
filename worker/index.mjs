import { parseImage, serializeArticle, validateArticle } from './cms-core.mjs';

const COOKIE_NAME = '__Host-innstack_studio';
const SESSION_DAYS = 7;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function bytesToBase64(bytes) {
  let value = '';
  for (let index = 0; index < bytes.length; index += 0x8000) value += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(value);
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function base64ToText(value) {
  return new TextDecoder().decode(base64ToBytes(value.replace(/\n/g, '')));
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToBase64(new Uint8Array(digest));
}

async function verifyPassword(password, encoded) {
  const [version, iterationsValue, saltValue, expectedValue] = String(encoded || '').split('$');
  const iterations = Number(iterationsValue);
  if (version !== 'pbkdf2-sha256' || !Number.isInteger(iterations) || iterations < 210000 || !saltValue || !expectedValue) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: base64ToBytes(saltValue), iterations }, key, 256);
  return safeEqual(bytesToBase64(new Uint8Array(bits)), expectedValue);
}

function cookieValue(request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : '';
}

async function getSession(request, env) {
  const token = cookieValue(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await env.STUDIO_DB.prepare('SELECT token_hash, csrf_token, expires_at FROM sessions WHERE token_hash = ? AND expires_at > ?').bind(tokenHash, new Date().toISOString()).first();
  return row ? { ...row, token } : null;
}

function sessionCookie(token, maxAge = SESSION_DAYS * 86400) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function securityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('x-frame-options', 'DENY');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  if ((headers.get('content-type') || '').includes('text/html')) headers.set('content-security-policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function loginPage(message = '') {
  const safeMessage = message.replace(/[<>&"']/g, '');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>InnStack Studio</title><style>:root{--paper:#f8f7f2;--ink:#292d26;--olive:#46513d;--line:#deded3}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.6 Arial,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px}.card{width:min(420px,100%);border:1px solid var(--line);background:#fbfaf6;padding:42px;border-radius:4px;box-shadow:0 22px 70px #29302512}.brand{font:600 31px Georgia,serif;letter-spacing:-1.4px}.brand span{color:#849172}small{display:block;letter-spacing:1.6px;font-size:9px;margin:10px 0 32px;color:#686c60}label{display:block;font-weight:600;font-size:12px;margin-bottom:8px}input{width:100%;padding:13px 14px;border:1px solid #c9cdbf;background:#fff;border-radius:3px;font:inherit}button{width:100%;margin-top:18px;border:1px solid var(--olive);border-radius:3px;background:var(--olive);color:#fff;padding:13px;font-weight:600;cursor:pointer}.error{font-size:12px;color:#893d31;margin:0 0 16px}.note{font-size:11px;color:#686c60;margin-top:20px}</style></head><body><main class="card"><div class="brand">InnStack<span>.</span></div><small>PRIVATE PUBLISHING STUDIO</small>${safeMessage ? `<p class="error">${safeMessage}</p>` : ''}<form id="login"><label for="password">Admin password</label><input id="password" name="password" type="password" autocomplete="current-password" required autofocus><button type="submit">Open Studio</button></form><p class="note">This area is protected by a server-side session.</p></main><script>document.querySelector('#login').addEventListener('submit',async(e)=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;b.textContent='Checking…';const r=await fetch('/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:e.target.password.value})});if(r.ok){location.href='/admin/'}else{const d=await r.json().catch(()=>({}));location.href='/admin/?error='+encodeURIComponent(d.error||'Sign-in failed.')}});</script></body></html>`;
}

function githubConfig(env) {
  const [owner, repo] = String(env.GITHUB_REPOSITORY || '').split('/');
  if (!owner || !repo || !env.GITHUB_TOKEN) throw new Error('GitHub publishing is not configured. Set GITHUB_REPOSITORY and the GITHUB_TOKEN secret.');
  return { owner, repo, branch: env.GITHUB_BRANCH || 'main' };
}

async function githubRequest(env, path, init = {}) {
  const { owner, repo } = githubConfig(env);
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    ...init,
    headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${env.GITHUB_TOKEN}`, 'user-agent': 'InnStack-Studio', 'x-github-api-version': '2022-11-28', ...(init.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`GitHub returned ${response.status}: ${body.slice(0, 300)}`);
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

async function getRepositoryFile(env, slug) {
  const { branch } = githubConfig(env);
  try {
    const file = await githubRequest(env, `/contents/content/guides/${encodeURIComponent(slug)}.md?ref=${encodeURIComponent(branch)}`);
    return { ...file, text: base64ToText(file.content) };
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

function parseScalar(value) {
  const clean = value.trim();
  if (clean === 'null') return '';
  if (clean === 'true') return true;
  if (clean === 'false') return false;
  if (/^\d+$/.test(clean)) return Number(clean);
  if (clean.startsWith('[') && clean.endsWith(']')) {
    try { return JSON.parse(clean.replace(/([{,]\s*)([A-Za-z][^,\]]*?)(?=\s*[,\]])/g, '$1"$2"')); } catch { return clean.slice(1, -1).split(',').map((part) => part.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean); }
  }
  try { return JSON.parse(clean); } catch { return clean.replace(/^['"]|['"]$/g, ''); }
}

function parseMarkdownFile(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error('The article file does not contain valid front matter.');
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator > 0) data[line.slice(0, separator).trim()] = parseScalar(line.slice(separator + 1));
  }
  return {
    title: data.title || '', slug: data.slug || '', excerpt: data.description || '', category: data.category || '', body: match[2].trim(),
    metaTitle: data.metaTitle || data.title || '', metaDescription: data.metaDescription || data.description || '', keywords: data.keywords || data.tags || [],
    featuredImage: data.featuredImage || '', featuredImageAlt: data.featuredImageAlt || '', publicationDate: data.publishedAt || '', featured: Boolean(data.featured),
  };
}

async function listRepositoryArticles(env) {
  const { branch } = githubConfig(env);
  const files = await githubRequest(env, `/contents/content/guides?ref=${encodeURIComponent(branch)}`);
  const markdownFiles = files.filter((file) => file.type === 'file' && file.name.endsWith('.md'));
  return Promise.all(markdownFiles.map(async (file) => {
    const detail = await githubRequest(env, `/contents/${file.path}?ref=${encodeURIComponent(branch)}`);
    const article = parseMarkdownFile(base64ToText(detail.content));
    return { id: `repo:${article.slug}`, slug: article.slug, title: article.title, category: article.category, status: 'published', publicationDate: article.publicationDate, revision: 0, repositorySha: detail.sha, source: 'repository' };
  }));
}

async function repositorySlugExists(env, slug) {
  return Boolean(await getRepositoryFile(env, slug));
}

async function readBody(request) {
  try { return await request.json(); } catch { throw Object.assign(new Error('Send a valid JSON request body.'), { status: 400 }); }
}

async function requireMutationAuth(request, env, session) {
  if (!session) throw Object.assign(new Error('Your session has expired.'), { status: 401 });
  if (!safeEqual(request.headers.get('x-csrf-token') || '', session.csrf_token)) throw Object.assign(new Error('The security token is invalid. Refresh the page and try again.'), { status: 403 });
}

async function login(request, env) {
  const forwarded = request.headers.get('cf-connecting-ip') || 'unknown';
  const key = await sha256(forwarded);
  const now = Date.now();
  const attempt = await env.STUDIO_DB.prepare('SELECT attempts, window_started_at FROM login_attempts WHERE key = ?').bind(key).first();
  if (attempt && now - Date.parse(attempt.window_started_at) < 15 * 60 * 1000 && attempt.attempts >= 8) return json({ error: 'Too many sign-in attempts. Try again later.' }, 429);
  const body = await readBody(request);
  if (!(await verifyPassword(String(body.password || ''), env.ADMIN_PASSWORD_HASH))) {
    if (!attempt || now - Date.parse(attempt.window_started_at) >= 15 * 60 * 1000) await env.STUDIO_DB.prepare('INSERT INTO login_attempts (key, attempts, window_started_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET attempts = 1, window_started_at = excluded.window_started_at').bind(key, new Date(now).toISOString()).run();
    else await env.STUDIO_DB.prepare('UPDATE login_attempts SET attempts = attempts + 1 WHERE key = ?').bind(key).run();
    return json({ error: 'Incorrect password.' }, 401);
  }
  await env.STUDIO_DB.prepare('DELETE FROM login_attempts WHERE key = ?').bind(key).run();
  const token = bytesToBase64(crypto.getRandomValues(new Uint8Array(32))).replace(/[+/=]/g, '');
  const csrf = bytesToBase64(crypto.getRandomValues(new Uint8Array(24))).replace(/[+/=]/g, '');
  const expires = new Date(now + SESSION_DAYS * 86400 * 1000).toISOString();
  await env.STUDIO_DB.prepare('INSERT INTO sessions (token_hash, csrf_token, expires_at, created_at) VALUES (?, ?, ?, ?)').bind(await sha256(token), csrf, expires, new Date(now).toISOString()).run();
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(token) });
}

async function listArticles(env) {
  const rows = await env.STUDIO_DB.prepare('SELECT id, slug, original_slug, status, article_json, revision, repository_sha, deployment_state, updated_at FROM articles ORDER BY updated_at DESC').all();
  let repository = [];
  let repositoryWarning = '';
  try { repository = await listRepositoryArticles(env); } catch (error) { repositoryWarning = error.message; }
  const managedSlugs = new Set(rows.results.map((row) => row.original_slug || row.slug));
  const managed = rows.results.map((row) => {
    const article = JSON.parse(row.article_json);
    return { id: row.id, slug: row.slug, title: article.title, category: article.category, status: row.status, publicationDate: article.publicationDate, revision: row.revision, deploymentState: row.deployment_state, updatedAt: row.updated_at, source: 'studio' };
  });
  return json({ articles: [...managed, ...repository.filter((item) => !managedSlugs.has(item.slug))], warning: repositoryWarning });
}

async function getArticle(env, id) {
  if (id.startsWith('repo:')) {
    const slug = id.slice(5);
    const file = await getRepositoryFile(env, slug);
    if (!file) return json({ error: 'Article not found.' }, 404);
    return json({ id, article: parseMarkdownFile(file.text), status: 'published', revision: 0, repositorySha: file.sha, originalSlug: slug });
  }
  const row = await env.STUDIO_DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
  if (!row) return json({ error: 'Article not found.' }, 404);
  return json({ id: row.id, article: JSON.parse(row.article_json), status: row.status, revision: row.revision, repositorySha: row.repository_sha, originalSlug: row.original_slug, deploymentState: row.deployment_state, publishId: row.publish_id });
}

async function saveArticle(request, env, id = '') {
  const body = await readBody(request);
  const checked = validateArticle(body.article);
  if (!checked.valid) return json({ error: 'Fix the highlighted article fields.', fields: checked.errors }, 422);
  const now = new Date().toISOString();
  const isRepositoryImport = id.startsWith('repo:');
  const existing = !id || isRepositoryImport ? null : await env.STUDIO_DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
  if (id && !isRepositoryImport && !existing) return json({ error: 'Article not found.' }, 404);
  const originalSlug = isRepositoryImport ? id.slice(5) : existing?.original_slug || null;
  const status = existing?.status || (isRepositoryImport ? 'published' : 'draft');
  if (originalSlug && status === 'published' && checked.article.slug !== originalSlug) return json({ error: 'Published article slugs are locked. Unpublish it before changing its URL.', fields: { slug: 'Unpublish this article before changing its slug.' } }, 409);
  const duplicate = await env.STUDIO_DB.prepare('SELECT id FROM articles WHERE slug = ? AND id != ?').bind(checked.article.slug, existing?.id || '').first();
  if (duplicate || ((!originalSlug || checked.article.slug !== originalSlug) && await repositorySlugExists(env, checked.article.slug))) return json({ error: 'That slug is already in use.', fields: { slug: 'Choose a unique slug.' } }, 409);
  const articleId = existing?.id || crypto.randomUUID();
  const revision = existing ? Number(existing.revision) + 1 : 1;
  const repositorySha = isRepositoryImport ? (await getRepositoryFile(env, originalSlug))?.sha : existing?.repository_sha || null;
  if (existing && Number(body.revision) !== Number(existing.revision)) return json({ error: 'This article changed in another session. Reload before saving.', conflict: true }, 409);
  await env.STUDIO_DB.batch([
    env.STUDIO_DB.prepare(`INSERT INTO articles (id, slug, original_slug, status, article_json, revision, repository_sha, publish_id, deployment_state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, article_json=excluded.article_json, revision=excluded.revision, updated_at=excluded.updated_at`).bind(articleId, checked.article.slug, originalSlug, status, JSON.stringify(checked.article), revision, repositorySha, existing?.publish_id || null, existing?.deployment_state || null, existing?.created_at || now, now),
    env.STUDIO_DB.prepare('INSERT INTO article_revisions (article_id, revision, article_json, action, created_at) VALUES (?, ?, ?, ?, ?)').bind(articleId, revision, JSON.stringify(checked.article), 'save', now),
  ]);
  return json({ ok: true, id: articleId, revision, status });
}

async function publishArticle(env, id) {
  const row = await env.STUDIO_DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
  if (!row) return json({ error: 'Save the draft before publishing.' }, 404);
  const article = JSON.parse(row.article_json);
  const checked = validateArticle(article);
  if (!checked.valid) return json({ error: 'The article is not ready to publish.', fields: checked.errors }, 422);
  const duplicate = await env.STUDIO_DB.prepare('SELECT id FROM articles WHERE slug = ? AND id != ?').bind(article.slug, id).first();
  if (duplicate) return json({ error: 'That slug is already in use.' }, 409);
  const currentFile = await getRepositoryFile(env, row.original_slug || article.slug);
  if (row.original_slug && row.original_slug !== article.slug && await repositorySlugExists(env, article.slug)) return json({ error: 'That slug is already in use by another repository article.' }, 409);
  if (row.repository_sha && currentFile && row.repository_sha !== currentFile.sha) return json({ error: 'The repository article changed outside Studio. Reload it before publishing.', conflict: true }, 409);
  if (!currentFile && row.original_slug && row.status === 'published') return json({ error: 'The published repository file is missing. Unpublish or restore it before continuing.' }, 409);
  const publishId = crypto.randomUUID();
  const markdown = serializeArticle(article, { publishId });
  const { branch } = githubConfig(env);
  const payload = { message: `${row.status === 'published' ? 'Update' : 'Publish'} guide: ${article.title}`, content: bytesToBase64(new TextEncoder().encode(markdown)), branch };
  if (currentFile) payload.sha = currentFile.sha;
  const result = await githubRequest(env, `/contents/content/guides/${encodeURIComponent(article.slug)}.md`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  const now = new Date().toISOString();
  const revision = Number(row.revision) + 1;
  await env.STUDIO_DB.batch([
    env.STUDIO_DB.prepare("UPDATE articles SET original_slug = slug, status = 'published', revision = ?, repository_sha = ?, publish_id = ?, deployment_state = 'committed', updated_at = ? WHERE id = ?").bind(revision, result.content.sha, publishId, now, id),
    env.STUDIO_DB.prepare('INSERT INTO article_revisions (article_id, revision, article_json, action, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, revision, row.article_json, 'publish', now),
  ]);
  return json({ ok: true, state: 'committed', message: 'Committed to GitHub. Cloudflare deployment is now expected to start.', commitUrl: result.commit.html_url, commitSha: result.commit.sha, revision, publishId, liveUrl: `${env.PUBLIC_SITE_URL || new URL('https://innstack.online')}/guides/${article.slug}/` });
}

async function unpublishArticle(env, id) {
  const row = await env.STUDIO_DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
  if (!row || row.status !== 'published') return json({ error: 'Published article not found.' }, 404);
  const article = JSON.parse(row.article_json);
  const file = await getRepositoryFile(env, row.original_slug || article.slug);
  if (!file) return json({ error: 'The repository article is already missing.' }, 409);
  const { branch } = githubConfig(env);
  const result = await githubRequest(env, `/contents/content/guides/${encodeURIComponent(row.original_slug || article.slug)}.md`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: `Unpublish guide: ${article.title}`, sha: file.sha, branch }) });
  const now = new Date().toISOString();
  await env.STUDIO_DB.prepare("UPDATE articles SET status = 'draft', repository_sha = NULL, publish_id = NULL, deployment_state = 'removing', revision = revision + 1, updated_at = ? WHERE id = ?").bind(now, id).run();
  return json({ ok: true, state: 'committed', message: 'Removal committed. The public URL remains live until Cloudflare finishes deploying.', commitUrl: result.commit.html_url });
}

async function deploymentStatus(env, id) {
  const row = await env.STUDIO_DB.prepare('SELECT slug, status, publish_id, article_json FROM articles WHERE id = ?').bind(id).first();
  if (!row) return json({ error: 'Article not found.' }, 404);
  const url = `${String(env.PUBLIC_SITE_URL || 'https://innstack.online').replace(/\/$/, '')}/guides/${row.slug}/`;
  let live = false;
  try {
    const response = await fetch(url, { headers: { 'cache-control': 'no-cache' }, cf: { cacheTtl: 0 } });
    const html = response.ok ? await response.text() : '';
    live = row.status === 'published' ? response.ok && html.includes(`data-publish-id="${row.publish_id}"`) : response.status === 404;
  } catch { live = false; }
  const state = live ? (row.status === 'published' ? 'live' : 'removed') : (row.status === 'published' ? 'committed' : 'removing');
  await env.STUDIO_DB.prepare('UPDATE articles SET deployment_state = ? WHERE id = ?').bind(state, id).run();
  return json({ state, live, url, message: live ? (row.status === 'published' ? 'The published version is live.' : 'The article is no longer public.') : 'The repository change is saved, but the matching deployment is not live yet.' });
}

async function deleteDraft(env, id) {
  const row = await env.STUDIO_DB.prepare('SELECT status FROM articles WHERE id = ?').bind(id).first();
  if (!row) return json({ error: 'Draft not found.' }, 404);
  if (row.status === 'published') return json({ error: 'Unpublish this article before deleting its Studio draft.' }, 409);
  await env.STUDIO_DB.prepare('DELETE FROM articles WHERE id = ?').bind(id).run();
  return json({ ok: true });
}

async function uploadImage(request, env) {
  const form = await request.formData();
  const file = form.get('image');
  if (!file || typeof file === 'string') return json({ error: 'Choose a JPG, PNG or WebP image.' }, 400);
  if (file.size > MAX_IMAGE_BYTES) return json({ error: 'Images must be 3 MB or smaller after optimization.' }, 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const image = parseImage(bytes);
  if (!image || !['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) return json({ error: 'The uploaded bytes are not a valid JPG, PNG or WebP image.' }, 415);
  if (image.width < 600 || image.height < 315 || image.width > 4000 || image.height > 4000) return json({ error: 'Use an image between 600×315 and 4000×4000 pixels.' }, 422);
  const name = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${image.extension}`;
  await env.STUDIO_MEDIA.put(name, bytes, { httpMetadata: { contentType: image.type, cacheControl: 'public, max-age=31536000, immutable' }, customMetadata: { width: String(image.width), height: String(image.height), originalName: String(file.name || '').slice(0, 150) } });
  return json({ ok: true, url: `/studio-media/${name}`, width: image.width, height: image.height, type: image.type });
}

async function serveMedia(request, env, pathname) {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
  const key = pathname.slice('/studio-media/'.length);
  if (!/^[a-zA-Z0-9._/-]+$/.test(key) || key.includes('..')) return new Response('Not found', { status: 404 });
  const object = await env.STUDIO_MEDIA.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('x-content-type-options', 'nosniff');
  return new Response(request.method === 'HEAD' ? null : object.body, { headers });
}

async function api(request, env, url, session) {
  if (url.pathname === '/api/admin/login' && request.method === 'POST') return login(request, env);
  if (!session) return json({ error: 'Authentication required.' }, 401);
  if (url.pathname === '/api/admin/session' && request.method === 'GET') return json({ authenticated: true, csrfToken: session.csrf_token });
  if (request.method !== 'GET') await requireMutationAuth(request, env, session);
  if (url.pathname === '/api/admin/logout' && request.method === 'POST') {
    await env.STUDIO_DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(session.token_hash).run();
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
  }
  if (url.pathname === '/api/admin/articles' && request.method === 'GET') return listArticles(env);
  if (url.pathname === '/api/admin/articles' && request.method === 'POST') return saveArticle(request, env);
  if (url.pathname === '/api/admin/images' && request.method === 'POST') return uploadImage(request, env);
  const match = url.pathname.match(/^\/api\/admin\/articles\/([^/]+)(?:\/(publish|unpublish|status))?$/);
  if (!match) return json({ error: 'Not found.' }, 404);
  const id = decodeURIComponent(match[1]);
  if (!match[2] && request.method === 'GET') return getArticle(env, id);
  if (!match[2] && request.method === 'PUT') return saveArticle(request, env, id);
  if (!match[2] && request.method === 'DELETE') return deleteDraft(env, id);
  if (match[2] === 'publish' && request.method === 'POST') return publishArticle(env, id);
  if (match[2] === 'unpublish' && request.method === 'POST') return unpublishArticle(env, id);
  if (match[2] === 'status' && request.method === 'GET') return deploymentStatus(env, id);
  return json({ error: 'Method not allowed.' }, 405);
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith('/studio-media/')) return serveMedia(request, env, url.pathname);
      const isAdminApi = url.pathname.startsWith('/api/admin/');
      const isAdminPage = url.pathname === '/admin' || url.pathname.startsWith('/admin/');
      if (!isAdminApi && !isAdminPage) return securityHeaders(await env.ASSETS.fetch(request));
      const session = await getSession(request, env);
      if (isAdminApi) return securityHeaders(await api(request, env, url, session));
      if (!session) return securityHeaders(new Response(loginPage(url.searchParams.get('error') || ''), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }));
      return securityHeaders(await env.ASSETS.fetch(request));
    } catch (error) {
      console.error(error);
      const status = Number(error.status) || 500;
      return securityHeaders(json({ error: status >= 500 ? 'InnStack Studio could not complete that operation.' : error.message, detail: env.ENVIRONMENT === 'development' ? error.message : undefined }, status));
    }
  },
};

export default worker;
