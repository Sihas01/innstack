export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export function estimateReadingTime(markdown) {
  const words = String(markdown || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function validateArticle(input) {
  const article = {
    title: String(input?.title || '').trim(),
    slug: String(input?.slug || '').trim(),
    excerpt: String(input?.excerpt || '').trim(),
    category: String(input?.category || '').trim(),
    body: String(input?.body || '').trim(),
    metaTitle: String(input?.metaTitle || '').trim(),
    metaDescription: String(input?.metaDescription || '').trim(),
    keywords: Array.isArray(input?.keywords) ? input.keywords.map(String).map((v) => v.trim()).filter(Boolean) : String(input?.keywords || '').split(',').map((v) => v.trim()).filter(Boolean),
    featuredImage: input?.featuredImage ? String(input.featuredImage).trim() : '',
    featuredImageAlt: String(input?.featuredImageAlt || '').trim(),
    publicationDate: String(input?.publicationDate || '').trim(),
    featured: Boolean(input?.featured),
  };
  const errors = {};
  if (article.title.length < 8 || article.title.length > 160) errors.title = 'Use a title between 8 and 160 characters.';
  if (!SLUG_PATTERN.test(article.slug) || article.slug.length > 100) errors.slug = 'Use a lowercase URL slug with letters, numbers and hyphens.';
  if (article.excerpt.length < 40 || article.excerpt.length > 320) errors.excerpt = 'Use an excerpt between 40 and 320 characters.';
  if (!article.category || article.category.length > 80) errors.category = 'Choose a category (80 characters maximum).';
  if (article.body.length < 100) errors.body = 'The article body must contain at least 100 characters.';
  if (article.metaTitle.length > 70) errors.metaTitle = 'Keep the meta title to 70 characters or fewer.';
  if (article.metaDescription.length > 180) errors.metaDescription = 'Keep the meta description to 180 characters or fewer.';
  if (article.keywords.length > 20 || article.keywords.some((value) => value.length > 60)) errors.keywords = 'Use no more than 20 keywords, each under 60 characters.';
  if (article.featuredImage && !/^\/studio-media\/[a-zA-Z0-9._/-]+$/.test(article.featuredImage)) errors.featuredImage = 'Choose an image uploaded through InnStack Studio.';
  if (article.featuredImage && !article.featuredImageAlt) errors.featuredImageAlt = 'Alt text is required for a featured image.';
  if (article.featuredImageAlt.length > 180) errors.featuredImageAlt = 'Keep alt text to 180 characters or fewer.';
  if (article.publicationDate && Number.isNaN(Date.parse(`${article.publicationDate}T00:00:00Z`))) errors.publicationDate = 'Choose a valid publication date.';
  return { article, errors, valid: Object.keys(errors).length === 0 };
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function yamlList(values) {
  return `[${values.map(yamlString).join(', ')}]`;
}

export function serializeArticle(article, options = {}) {
  const today = options.today || new Date().toISOString().slice(0, 10);
  const publishedAt = article.publicationDate || today;
  const lines = [
    '---',
    `title: ${yamlString(article.title)}`,
    `description: ${yamlString(article.excerpt)}`,
    `slug: ${article.slug}`,
    `category: ${yamlString(article.category)}`,
    'author: InnStack Editorial Team',
    `publishedAt: '${publishedAt}'`,
    `updatedAt: '${today}'`,
    `readingTime: ${estimateReadingTime(article.body)}`,
    `featuredImage: ${article.featuredImage ? yamlString(article.featuredImage) : 'null'}`,
    `featuredImageAlt: ${yamlString(article.featuredImageAlt || '')}`,
    `metaTitle: ${yamlString(article.metaTitle || article.title)}`,
    `metaDescription: ${yamlString(article.metaDescription || article.excerpt)}`,
    `keywords: ${yamlList(article.keywords || [])}`,
    `publishId: ${yamlString(options.publishId || '')}`,
    `featured: ${article.featured ? 'true' : 'false'}`,
    `tags: ${yamlList(article.keywords || [])}`,
    'affiliate: false',
    'softwareMentioned: []',
    '---',
    '',
    article.body.trim(),
    '',
  ];
  return lines.join('\n');
}

export function parseImage(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length >= 24 && view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a) {
    return { type: 'image/png', extension: 'png', width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes.length >= 30 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') {
    const kind = String.fromCharCode(...bytes.slice(12, 16));
    if (kind === 'VP8X') return { type: 'image/webp', extension: 'webp', width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16), height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16) };
    if (kind === 'VP8 ' && bytes.length >= 30) return { type: 'image/webp', extension: 'webp', width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
    if (kind === 'VP8L' && bytes.length >= 25) {
      const bits = view.getUint32(21, true);
      return { type: 'image/webp', extension: 'webp', width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { type: 'image/jpeg', extension: 'jpg', width: view.getUint16(offset + 7), height: view.getUint16(offset + 5) };
      }
      if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
      const size = view.getUint16(offset + 2);
      if (size < 2) break;
      offset += size + 2;
    }
  }
  return null;
}
