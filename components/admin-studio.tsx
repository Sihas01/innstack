/* eslint-disable @next/next/no-img-element */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Article = {
  title: string; slug: string; excerpt: string; category: string; body: string;
  metaTitle: string; metaDescription: string; keywords: string[];
  featuredImage: string; featuredImageAlt: string; publicationDate: string; featured: boolean;
};

type ArticleListItem = {
  id: string; slug: string; title: string; category: string; status: 'draft' | 'published';
  publicationDate?: string; revision: number; deploymentState?: string; updatedAt?: string;
};

const emptyArticle = (): Article => ({
  title: '', slug: '', excerpt: '', category: '', body: '', metaTitle: '', metaDescription: '', keywords: [],
  featuredImage: '', featuredImageAlt: '', publicationDate: new Date().toISOString().slice(0, 10), featured: false,
});

function makeSlug(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}

function parseStructuredPaste(value: string): Partial<Article> {
  const text = value.replace(/\r/g, '').trim();
  const result: Partial<Article> = {};
  const fields: Array<[keyof Article, RegExp]> = [
    ['title', /^(?:#\s*)?Title:\s*(.+)$/im], ['slug', /^Slug:\s*(.+)$/im], ['excerpt', /^(?:Excerpt|Description):\s*(.+)$/im],
    ['category', /^Category:\s*(.+)$/im], ['metaTitle', /^Meta Title:\s*(.+)$/im], ['metaDescription', /^Meta Description:\s*(.+)$/im],
  ];
  for (const [key, pattern] of fields) {
    const match = text.match(pattern);
    if (match) (result as Record<string, unknown>)[key] = match[1].trim().replace(/^['"]|['"]$/g, '');
  }
  const keywords = text.match(/^Keywords?:\s*(.+)$/im);
  if (keywords) result.keywords = keywords[1].split(',').map((item) => item.trim()).filter(Boolean);
  const bodyMarker = text.match(/^(?:Article Body|Body|Markdown):\s*\n/im);
  if (bodyMarker?.index !== undefined) result.body = text.slice(bodyMarker.index + bodyMarker[0].length).trim();
  else {
    const firstHeading = text.search(/^#{1,3}\s+.+$/m);
    if (firstHeading >= 0) result.body = text.slice(firstHeading).replace(/^#\s+[^\n]+\n+/, '').trim();
    else if (!Object.keys(result).length) result.body = text;
  }
  if (result.title && !result.slug) result.slug = makeSlug(result.title);
  return result;
}

async function optimizeImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / bitmap.width, 2000 / bitmap.height);
  if (scale === 1 && file.size <= 2_000_000 && file.type === 'image/webp') { bitmap.close(); return file; }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d', { alpha: false })?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84));
  if (!blob) throw new Error('The browser could not optimize this image.');
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' });
}

export function AdminStudio() {
  const [csrf, setCsrf] = useState('');
  const [items, setItems] = useState<ArticleListItem[]>([]);
  const [id, setId] = useState('');
  const [article, setArticle] = useState<Article>(emptyArticle);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const [mobilePanel, setMobilePanel] = useState<'write' | 'preview'>('write');

  const request = useCallback(async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    if (options.method && options.method !== 'GET') headers.set('x-csrf-token', csrf);
    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || 'The operation failed.') as Error & { data?: { fields?: Record<string, string> } };
      error.data = data;
      throw error;
    }
    return data;
  }, [csrf]);

  const loadList = useCallback(async () => {
    const data = await request('/api/admin/articles');
    setItems(data.articles || []);
    if (data.warning) setMessage(`Articles loaded, but repository sync needs attention: ${data.warning}`);
  }, [request]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/admin/session');
        if (response.status === 401) { window.location.reload(); return; }
        const data = await response.json();
        setCsrf(data.csrfToken);
      } catch { setMessage('Could not start the secure Studio session.'); }
    })();
  }, []);

  useEffect(() => {
    if (!csrf) return;
    loadList().finally(() => setLoading(false));
  }, [csrf, loadList]);

  const selectArticle = async (item: ArticleListItem) => {
    setWorking('open'); setMessage(''); setErrors({});
    try {
      const data = await request(`/api/admin/articles/${encodeURIComponent(item.id)}`);
      setId(data.id); setArticle(data.article); setStatus(data.status); setRevision(data.revision); setMobilePanel('write');
    } catch (error) { setMessage((error as Error).message); }
    finally { setWorking(''); }
  };

  const createNew = () => {
    setId(''); setArticle(emptyArticle()); setStatus('draft'); setRevision(0); setErrors({}); setMessage('New draft ready.'); setMobilePanel('write');
  };

  const update = <K extends keyof Article>(key: K, value: Article[K]) => {
    setArticle((current) => ({ ...current, [key]: value }));
    setErrors((current) => { const next = { ...current }; delete next[key]; return next; });
  };

  const save = async (quiet = false) => {
    setWorking('save'); setErrors({}); if (!quiet) setMessage('');
    try {
      const path = id ? `/api/admin/articles/${encodeURIComponent(id)}` : '/api/admin/articles';
      const data = await request(path, { method: id ? 'PUT' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ article, revision }) });
      setId(data.id); setRevision(data.revision); setStatus(data.status); if (!quiet) setMessage('Draft saved securely.');
      await loadList();
      return data;
    } catch (error) {
      const typed = error as Error & { data?: { fields?: Record<string, string> } };
      if (typed.data?.fields) setErrors(typed.data.fields);
      setMessage(typed.message);
      throw error;
    } finally { setWorking(''); }
  };

  const publish = async () => {
    setWorking('publish'); setMessage('');
    try {
      const saved = await save(true);
      setWorking('publish');
      const data = await request(`/api/admin/articles/${encodeURIComponent(saved.id)}/publish`, { method: 'POST' });
      setStatus('published'); setRevision(data.revision); setMessage(`${data.message} This is committed, not yet confirmed live.`);
      await loadList();
    } catch { /* save/publish already reports the exact failure */ }
    finally { setWorking(''); }
  };

  const unpublish = async () => {
    if (!id || !window.confirm('Unpublish this article? Its URL will disappear after the next deployment. The Studio draft will be kept.')) return;
    setWorking('unpublish'); setMessage('');
    try {
      const data = await request(`/api/admin/articles/${encodeURIComponent(id)}/unpublish`, { method: 'POST' });
      setStatus('draft'); setMessage(data.message); await loadList();
    } catch (error) { setMessage((error as Error).message); }
    finally { setWorking(''); }
  };

  const checkLive = async () => {
    if (!id || id.startsWith('repo:')) return;
    setWorking('status');
    try { const data = await request(`/api/admin/articles/${encodeURIComponent(id)}/status`); setMessage(data.message); await loadList(); }
    catch (error) { setMessage((error as Error).message); }
    finally { setWorking(''); }
  };

  const remove = async () => {
    if (!id || status === 'published' || !window.confirm(`Delete the draft “${article.title || 'Untitled'}”? This cannot be undone.`)) return;
    setWorking('delete');
    try { await request(`/api/admin/articles/${encodeURIComponent(id)}`, { method: 'DELETE' }); createNew(); setMessage('Draft deleted.'); await loadList(); }
    catch (error) { setMessage((error as Error).message); }
    finally { setWorking(''); }
  };

  const upload = async (file?: File) => {
    if (!file) return;
    setWorking('image'); setMessage('Optimizing and validating image…');
    try {
      const optimized = await optimizeImage(file);
      const form = new FormData(); form.append('image', optimized);
      const data = await request('/api/admin/images', { method: 'POST', body: form });
      update('featuredImage', data.url); setMessage(`Image uploaded (${data.width}×${data.height}, optimized WebP).`);
    } catch (error) { setMessage((error as Error).message); }
    finally { setWorking(''); }
  };

  const applyPaste = () => {
    const parsed = parseStructuredPaste(pasteValue);
    setArticle((current) => ({ ...current, ...parsed }));
    setPasteOpen(false); setPasteValue(''); setMessage('Structured article pasted. Review the fields and preview before publishing.');
  };

  const visibleItems = useMemo(() => items.filter((item) => `${item.title} ${item.slug} ${item.category}`.toLowerCase().includes(filter.toLowerCase())), [items, filter]);
  const words = article.body.trim() ? article.body.trim().split(/\s+/).length : 0;

  if (loading) return <div className="studio-loading">Opening InnStack Studio…</div>;

  return <div className="studio-shell">
    <aside className="studio-sidebar">
      <div className="studio-brand"><strong>InnStack<span>.</span></strong><small>STUDIO</small></div>
      <button className="studio-new" onClick={createNew}>＋ New article</button>
      <input className="studio-search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search articles" aria-label="Search articles" />
      <div className="studio-article-list" aria-label="Articles">
        {visibleItems.map((item) => <button key={item.id} className={id === item.id ? 'active' : ''} onClick={() => selectArticle(item)}>
          <span>{item.title}</span><small><i className={`status-dot ${item.status}`} />{item.status}{item.deploymentState && ` · ${item.deploymentState}`}</small>
        </button>)}
        {!visibleItems.length && <p>No matching articles.</p>}
      </div>
      <button className="studio-logout" onClick={async () => { await request('/api/admin/logout', { method: 'POST' }); window.location.reload(); }}>Sign out</button>
    </aside>

    <main className="studio-main">
      <header className="studio-toolbar">
        <div><span className={`studio-status ${status}`}>{status}</span><strong>{article.title || 'Untitled article'}</strong></div>
        <div className="studio-actions">
          {id && <button className="studio-quiet" onClick={checkLive} disabled={Boolean(working)}>Check live</button>}
          <button className="studio-quiet" onClick={() => save()} disabled={Boolean(working)}>{working === 'save' ? 'Saving…' : 'Save draft'}</button>
          {status === 'published' && <button className="studio-danger-text" onClick={unpublish} disabled={Boolean(working)}>Unpublish</button>}
          <button className="studio-publish" onClick={publish} disabled={Boolean(working)}>{working === 'publish' ? 'Publishing…' : status === 'published' ? 'Publish update' : 'Publish'}</button>
        </div>
      </header>
      {message && <div className="studio-message" role="status">{message}</div>}
      <div className="studio-mobile-tabs"><button className={mobilePanel === 'write' ? 'active' : ''} onClick={() => setMobilePanel('write')}>Write</button><button className={mobilePanel === 'preview' ? 'active' : ''} onClick={() => setMobilePanel('preview')}>Preview</button></div>
      <div className="studio-workspace">
        <section className={`studio-editor ${mobilePanel !== 'write' ? 'mobile-hidden' : ''}`}>
          <div className="studio-section-head"><div><span className="eyebrow">ARTICLE</span><h1>Write and refine.</h1></div><button className="studio-paste" onClick={() => setPasteOpen((value) => !value)}>Paste ChatGPT article</button></div>
          {pasteOpen && <div className="studio-paste-box"><label htmlFor="structured-paste">Paste the complete structured output</label><textarea id="structured-paste" value={pasteValue} onChange={(event) => setPasteValue(event.target.value)} placeholder={'Title: …\nExcerpt: …\nCategory: …\nMeta Title: …\nMeta Description: …\nKeywords: …\n\nArticle Body:\n## First heading…'} /><div><button onClick={() => setPasteOpen(false)}>Cancel</button><button className="studio-publish" onClick={applyPaste} disabled={!pasteValue.trim()}>Fill editor</button></div></div>}
          <div className="studio-field"><label htmlFor="article-title">Title</label><input id="article-title" value={article.title} onChange={(event) => { const previous = makeSlug(article.title); const title = event.target.value; update('title', title); if (!article.slug || article.slug === previous) update('slug', makeSlug(title)); }} placeholder="A clear, useful article title" />{errors.title && <em>{errors.title}</em>}</div>
          <div className="studio-field"><label htmlFor="article-slug">URL slug</label><div className="slug-input"><span>innstack.online/guides/</span><input id="article-slug" value={article.slug} onChange={(event) => update('slug', makeSlug(event.target.value))} disabled={status === 'published'} /></div>{errors.slug && <em>{errors.slug}</em>}</div>
          <div className="studio-grid-two"><div className="studio-field"><label htmlFor="article-category">Category</label><input id="article-category" value={article.category} onChange={(event) => update('category', event.target.value)} placeholder="Distribution" />{errors.category && <em>{errors.category}</em>}</div><div className="studio-field"><label htmlFor="article-date">Publication date</label><input id="article-date" type="date" value={article.publicationDate} onChange={(event) => update('publicationDate', event.target.value)} />{errors.publicationDate && <em>{errors.publicationDate}</em>}</div></div>
          <div className="studio-field"><label htmlFor="article-excerpt">Excerpt</label><textarea id="article-excerpt" className="short" value={article.excerpt} onChange={(event) => update('excerpt', event.target.value)} placeholder="A concise summary for guide listings." /><small>{article.excerpt.length}/320</small>{errors.excerpt && <em>{errors.excerpt}</em>}</div>
          <div className="studio-field"><div className="body-label"><label htmlFor="article-body">Article body</label><small>{words.toLocaleString()} words · about {Math.max(1, Math.ceil(words / 220))} min</small></div><textarea id="article-body" className="markdown-editor" value={article.body} onChange={(event) => update('body', event.target.value)} placeholder="Paste or write Markdown here…" spellCheck />{errors.body && <em>{errors.body}</em>}</div>

          <section className="studio-panel"><div><span className="eyebrow">FEATURED IMAGE</span><h2>Article cover</h2></div><div className="image-uploader">{article.featuredImage ? <img src={article.featuredImage} alt={article.featuredImageAlt || ''} /> : <div>JPG, PNG or WebP<br /><small>Optimized to WebP before upload</small></div>}<label className="studio-quiet">{working === 'image' ? 'Uploading…' : 'Choose image'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event.target.files?.[0])} hidden /></label></div><div className="studio-field"><label htmlFor="image-alt">Alt text</label><input id="image-alt" value={article.featuredImageAlt} onChange={(event) => update('featuredImageAlt', event.target.value)} placeholder="Describe what the image shows" />{errors.featuredImageAlt && <em>{errors.featuredImageAlt}</em>}</div></section>

          <section className="studio-panel"><div><span className="eyebrow">SEO</span><h2>Search appearance</h2></div><div className="studio-field"><label htmlFor="meta-title">Meta title</label><input id="meta-title" value={article.metaTitle} onChange={(event) => update('metaTitle', event.target.value)} placeholder={article.title || 'Defaults to article title'} /><small>{article.metaTitle.length}/70</small>{errors.metaTitle && <em>{errors.metaTitle}</em>}</div><div className="studio-field"><label htmlFor="meta-description">Meta description</label><textarea id="meta-description" className="short" value={article.metaDescription} onChange={(event) => update('metaDescription', event.target.value)} placeholder={article.excerpt || 'Defaults to excerpt'} /><small>{article.metaDescription.length}/180</small>{errors.metaDescription && <em>{errors.metaDescription}</em>}</div><div className="studio-field"><label htmlFor="keywords">Keywords</label><input id="keywords" value={article.keywords.join(', ')} onChange={(event) => update('keywords', event.target.value.split(',').map((value) => value.trim()).filter(Boolean))} placeholder="hotel software, direct bookings, PMS" />{errors.keywords && <em>{errors.keywords}</em>}</div></section>
          <div className="studio-bottom-actions">{id && status === 'draft' && <button className="studio-danger-text" onClick={remove} disabled={Boolean(working)}>Delete draft</button>}<span /><button className="studio-quiet" onClick={() => save()} disabled={Boolean(working)}>Save draft</button><button className="studio-publish" onClick={publish} disabled={Boolean(working)}>Publish</button></div>
        </section>

        <aside className={`studio-preview ${mobilePanel !== 'preview' ? 'mobile-hidden' : ''}`}>
          <div className="preview-label"><span>LIVE PREVIEW</span><small>Markdown is rendered safely; raw HTML is ignored.</small></div>
          <article className="preview-paper">
            {article.featuredImage && <img className="preview-image" src={article.featuredImage} alt={article.featuredImageAlt || ''} />}
            <span className="eyebrow">{article.category || 'CATEGORY'}</span><h1>{article.title || 'Your article title'}</h1><p className="deck">{article.excerpt || 'Your excerpt will appear here.'}</p><div className="preview-byline">INNSTACK EDITORIAL TEAM · {article.publicationDate || 'DRAFT'} · {Math.max(1, Math.ceil(words / 220))} MIN READ</div>
            <div className="prose"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>, table: ({ children }) => <div className="table-scroll"><table>{children}</table></div> }}>{article.body || '*Start writing to see a rendered preview.*'}</ReactMarkdown></div>
          </article>
        </aside>
      </div>
    </main>
  </div>;
}
