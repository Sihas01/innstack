import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateReadingTime, parseImage, serializeArticle, slugify, validateArticle } from '../worker/cms-core.mjs';

const validArticle = {
  title: 'A practical guide to direct hotel bookings',
  slug: 'practical-guide-direct-hotel-bookings',
  excerpt: 'A practical explanation of the steps independent hotels can take to improve direct booking performance.',
  category: 'Direct bookings',
  body: '## Start here\n\n' + 'Useful article content for an independent hospitality operator. '.repeat(12),
  metaTitle: 'Direct Hotel Booking Guide',
  metaDescription: 'Learn the practical steps independent hotels can take to increase direct booking performance without adding unnecessary complexity.',
  keywords: ['direct bookings', 'independent hotel'],
  featuredImage: '/studio-media/2026-10-25/example.webp',
  featuredImageAlt: 'An independent hotel reception desk',
  publicationDate: '2026-10-25',
  featured: false,
};

test('CMS creates stable URL slugs', () => {
  assert.equal(slugify('PMS & Booking Engine: A Guide!'), 'pms-and-booking-engine-a-guide');
});

test('CMS accepts a complete article and rejects duplicate-unsafe slug syntax', () => {
  assert.equal(validateArticle(validArticle).valid, true);
  const invalid = validateArticle({ ...validArticle, slug: '../article' });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.slug);
});

test('CMS requires alt text for uploaded images', () => {
  const invalid = validateArticle({ ...validArticle, featuredImageAlt: '' });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.featuredImageAlt);
});

test('published Markdown contains SEO fields and a deployment marker', () => {
  const markdown = serializeArticle(validArticle, { publishId: 'publish-123', today: '2026-10-25' });
  assert.match(markdown, /metaTitle: "Direct Hotel Booking Guide"/);
  assert.match(markdown, /publishId: "publish-123"/);
  assert.match(markdown, /featuredImageAlt: "An independent hotel reception desk"/);
  assert.equal(estimateReadingTime('word '.repeat(440)), 2);
});

test('server image inspection accepts PNG dimensions and rejects fake image bytes', () => {
  const png = new Uint8Array(24);
  png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  new DataView(png.buffer).setUint32(16, 1200);
  new DataView(png.buffer).setUint32(20, 630);
  assert.deepEqual(parseImage(png), { type: 'image/png', extension: 'png', width: 1200, height: 630 });
  assert.equal(parseImage(new Uint8Array([1, 2, 3, 4])), null);
});
