# InnStack

A complete, static Next.js publication for independent hospitality operators. TypeScript, Tailwind CSS 4, Markdown content, no database, no authentication and no runtime backend.

## Run locally

Requires Node.js 22 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. To check the deployable static version:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm start` serves `out/`. The static build contains every generated detail route and a custom 404 page. Never deploy `.next/` for this project.

## Deploy to Cloudflare Pages

1. Push this repository to your Git provider and create a Cloudflare Pages project.
2. Choose the Next.js Static HTML Export preset or configure build command `npm run build`, output directory `out`, and Node version `22`.
3. Set `NEXT_PUBLIC_SITE_URL` to the actual Pages origin, for example `https://your-project.pages.dev`, with no trailing slash. The checked-in fallback is an example, not a claimed deployment.
4. Set `NEXT_PUBLIC_CONTACT_EMAIL` to your selected contact address. The contact page labels it as a placeholder until you update that status.
5. Deploy. No Worker, Pages Functions, database, or Next.js server is required.

For a custom domain, add it in Cloudflare Pages, change `NEXT_PUBLIC_SITE_URL` to its HTTPS origin, and rebuild. Canonicals, social metadata, publisher schema, robots and sitemap derive from this value. Preview branch builds should be access-controlled or marked noindex in your hosting configuration to avoid indexing duplicate origins.

`public/_headers` supplies baseline security headers. The output uses directory index pages and trailing slashes; Cloudflare serves these directly. No SPA fallback rule is needed.

## Publishing content

- Guides live in `content/guides/*.md` and are rendered at build time with `react-markdown` and GFM support. Raw HTML is not enabled. Frontmatter supplies title, description, slug, category, author, publication/update dates, reading time, optional image, featured status, tags, affiliate status and software mentions. Add a Markdown file and rebuild to add a route and search entry.
- Software profiles live in `data/software.ts`, with typed metadata for official and affiliate URLs, pricing, property fit, testing status and comparisons. Current profiles are explicitly sample content. Their sections are evaluation prompts, not factual vendor findings.
- Legal and editorial pages live in `data/pages.ts`. Review the marked legal drafts, operator details and applicable policies before public launch.
- Property playbooks use the six configured property types. Comparison structure lives in `data/software.ts` and its route template.
- Reusable content components are exported from `components/ui.tsx`: callouts, tips, FAQ, pros/cons, screenshots, comparison tables, software cards, affiliate buttons, disclosures, breadcrumbs and table of contents. These can be used from React templates. Markdown blockquotes are the plain-Markdown callout format. MDX execution is intentionally not needed.
- `TestedBadge` renders only when `tested` is true. Do not enable this until real testing is documented.
- Affiliate buttons include `sponsored nofollow noopener noreferrer` when enabled. No sample profile currently uses affiliate links. There is no link cloaking.
- Ad placeholders render only in development. No advertising or analytics scripts ship in production.

## Interactive features

Search indexes software, guides and comparisons at build time. It supports the search button and Ctrl/Cmd+K, a native modal dialog with keyboard focus containment and Escape dismissal, and a mobile full-screen layout.

The software directory includes text and property-type filters. Category anchors and six property playbooks provide workflow-based browsing.

Five calculators run locally: OTA commission, incremental direct-booking savings, occupancy, ADR and RevPAR. Direct savings assume revenue is entirely OTA or direct and total revenue is constant; the UI shows assumptions and excludes other operating costs. Empty, out-of-range and zero-denominator inputs do not display misleading results.

## Integrations intentionally awaiting configuration

Newsletter and contact forms are honest frontend previews. They validate input but do not submit, persist, or claim successful signup/delivery. To connect a provider, replace their submit handlers in `components/forms.tsx`, use a provider's supported public endpoint or an appropriately secured server-side service, and never embed private API keys in client code. Add rate limiting and error handling to the submission service and update privacy copy to reflect real behavior.

No vendor testing, product rankings, affiliate relationship, contact inbox or live deployment is claimed. Replace sample product evidence and complete marked legal/contact details before presenting this as a launched research publication.
