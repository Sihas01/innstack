# InnStack Studio setup

InnStack Studio is the private CMS at `https://innstack.online/admin/`. The public website remains a static Next.js export. A small Cloudflare Worker protects the admin route and API, D1 stores sessions/drafts/revision snapshots, R2 stores featured images, and a fine-grained GitHub token commits published Markdown into `content/guides/`.

This is intentionally low-cost: it uses the existing Cloudflare deployment and GitHub repository, with D1 and R2 usage expected to fit comfortably within their free allowances for a single-editor publication.

## One-time Cloudflare setup

Run these commands while signed into the Cloudflare account that hosts InnStack:

```powershell
npx wrangler d1 create innstack-studio
npx wrangler r2 bucket create innstack-studio-media
```

Add the returned D1 ID and the R2 bucket binding to `wrangler.jsonc`, immediately before the `vars` section:

```jsonc
"d1_databases": [
  {
    "binding": "STUDIO_DB",
    "database_name": "innstack-studio",
    "database_id": "PASTE_THE_REAL_D1_DATABASE_ID",
    "migrations_dir": "migrations"
  }
],
"r2_buckets": [
  {
    "binding": "STUDIO_MEDIA",
    "bucket_name": "innstack-studio-media"
  }
],
```

The binding names must remain `STUDIO_DB` and `STUDIO_MEDIA`. They are deliberately omitted from the first GitHub push so the existing public deployment is not broken by placeholder resource IDs.

Apply the checked-in schema:

```powershell
npx wrangler d1 migrations apply innstack-studio --remote
```

Generate a strong password hash. The password itself is never stored:

```powershell
npm run studio:hash-password
npx wrangler secret put ADMIN_PASSWORD_HASH
```

Paste the generated `pbkdf2-sha256$…` value at the Wrangler prompt.

## GitHub credential

Create a fine-grained GitHub personal access token with:

- Repository access: only `Sihas01/innstack`
- Repository permission: **Contents — Read and write**
- Metadata: the automatically granted read permission
- No Actions, administration, issues, pull requests, account, or organization permissions
- A short expiration period that you are comfortable rotating

Save it only as a Worker secret:

```powershell
npx wrangler secret put GITHUB_TOKEN
```

Never put the token in `.env`, `wrangler.jsonc`, browser code, GitHub Actions output, or a Markdown article. The Worker is the only code that reads it.

`wrangler.jsonc` already declares the non-secret values:

- `PUBLIC_SITE_URL=https://innstack.online`
- `GITHUB_REPOSITORY=Sihas01/innstack`
- `GITHUB_BRANCH=main`
- `ENVIRONMENT=production`

Change these only if the production domain, repository, or deployment branch changes.

## Deploy

The Cloudflare Workers Builds project should use:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Node.js: 22 or newer
- Repository path: `/`

Push the configuration and code to `main`, or run the build and deploy commands from an authorized terminal. After deployment, open `https://innstack.online/admin/` and sign in with the password used to create the hash.

For a local end-to-end check after adding a real D1 ID:

```powershell
npm run build
npx wrangler d1 migrations apply innstack-studio --local
npx wrangler dev
```

Wrangler local development uses local D1/R2 data and local secrets. A plain `npm run dev` or `npm start` only previews the static Next.js output and cannot exercise authentication, drafts, uploads, or publication.

## Publishing behavior

1. Save creates or updates a D1 draft. Optimistic revision checks reject a stale browser tab rather than overwriting newer work.
2. Publish validates all fields again on the Worker, checks the slug in D1 and GitHub, and commits one Markdown file to `content/guides/`.
3. The response says **committed** once GitHub confirms the commit. It does not claim the page is live.
4. Cloudflare's existing Git integration sees the commit, runs the production build, and deploys the new static route, sitemap, canonical metadata, Open Graph metadata, and Article schema.
5. **Check live** fetches the public article and looks for that publication's unique marker. Only then does Studio report **live**.

Unpublish commits deletion of the Markdown file but keeps the article as a Studio draft. The public page disappears only after the corresponding Cloudflare deployment completes.

## Images

The browser scales large images to at most 2000×2000 and converts them to quality-optimized WebP before upload. The Worker then independently verifies the file signature, actual dimensions, maximum 3 MB size, and allowed formats (JPG, PNG, WebP). Accepted images are stored in R2 and served through `/studio-media/` with immutable caching. The public article uses a responsive, lazy-decodable image element and requires alt text.

R2 objects are not writable or listable from the browser. Only authenticated, CSRF-protected Studio requests can upload them. Public article pages can read an object only by its unguessable URL.

## Security controls

- PBKDF2-SHA256 password hash with at least 310,000 iterations; no plaintext password
- Seven-day random server-side sessions stored as SHA-256 token hashes in D1
- `HttpOnly`, `Secure`, `SameSite=Strict`, host-only cookie
- Per-session CSRF token on every mutation
- Sign-in throttling by hashed client IP
- Server-side validation for every article and upload
- Markdown rendered without raw HTML execution
- Fixed GitHub repository/content directory and generated safe filenames; no arbitrary paths
- Optimistic concurrency for draft saves and repository SHA conflict checks for publishing
- No secrets exposed to the static Next.js bundle

For stronger perimeter security, Cloudflare Access can additionally restrict `/admin/*`, but it is optional and does not replace Studio's own server-side session checks.

## Rollback and recovery

Every publish/unpublish produces a normal Git commit. To roll back a live article:

1. Open the commit linked by Studio (or the repository's commit history).
2. Use GitHub's **Revert** action, or revert that commit locally and push to `main`.
3. Wait for the Cloudflare rebuild and verify the public URL.

This is the authoritative rollback path because it restores the exact public Git state and automatically triggers deployment. Studio also keeps D1 snapshots for every save and publish for audit/recovery. If a repository file is changed outside Studio, its SHA check blocks publication; reopen/import the repository version before making the next Studio update.

Back up D1 and R2 using Cloudflare's export/download tools before deleting either resource. Deleting a draft from Studio is permanent; deleting a published article is intentionally blocked until it has been unpublished.

## Operational verification checklist

After the first configured deployment, verify without touching an existing published guide:

1. Sign in with a wrong password (rejected), then the correct password.
2. Create a new draft with a unique temporary slug and save it; refresh and reopen it.
3. In a second tab, save an edit, then confirm the stale first tab is rejected.
4. Try a known existing slug and confirm the duplicate is rejected.
5. Upload a valid image, then try a renamed non-image and an oversized image; only the valid image should succeed.
6. Preview headings, lists, links, emphasis, and a GFM table.
7. Publish the temporary article, confirm Studio first reports committed, then use **Check live** until it reports live.
8. Inspect the page source for canonical, description, keywords/Open Graph fields, Article JSON-LD, and the publication marker. Confirm the URL appears in `/sitemap.xml`.
9. Unpublish the test article, wait for deployment, and confirm **Check live** reports removed.
10. Delete the retained draft.

Do not use either of the existing published slugs for this test.
