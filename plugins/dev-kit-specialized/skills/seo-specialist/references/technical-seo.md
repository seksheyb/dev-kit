# Technical SEO Audit Reference

Detailed checklist and diagnostic guidance for the crawl/index/render layer of a
technical SEO audit.

## Crawlability

- **robots.txt** — check for accidental `Disallow` on production paths, and confirm
  it doesn't block CSS/JS needed for rendering.
- **XML sitemaps** — submitted in Google Search Console/Bing Webmaster Tools,
  under the 50,000-URL / 50MB (uncompressed) per-file limit, split with a sitemap
  index when larger, and containing only canonical, indexable, 200-status URLs.
- **Crawl budget** — for large sites, check Search Console's Crawl Stats report for
  wasted crawl on faceted navigation, session IDs, or infinite calendar/pagination
  spaces; block or consolidate those patterns.
- **Internal linking** — no orphan pages (reachable only via sitemap, not via any
  internal link); important pages within 3-4 clicks of the homepage.

## Indexability

- **Canonical tags** — one canonical per page, self-referencing on canonical pages,
  pointing to the preferred version on duplicates (parameter variants, `http`/`https`,
  `www`/non-`www`, trailing slash).
- **Meta robots / `X-Robots-Tag`** — confirm `noindex` isn't present on pages that
  should rank; check response headers, not just page source, since `X-Robots-Tag`
  can be set at the server level and won't show up in rendered HTML.
- **Duplicate content** — near-duplicate templates (thin location pages, faceted
  filters, print/PDF variants) should be canonicalized, consolidated, or blocked.
- **Pagination** — paginated series should each be self-canonical (avoid pointing
  every page back to page 1) and internally linked in sequence.

## Site Architecture

- **Redirect chains and loops** — resolve any 3xx chain to a single hop; audit tools
  flag chains of 2+ redirects, which waste crawl budget and dilute link equity.
- **Broken links (4xx/5xx)** — fix or redirect internal links; monitor external
  inbound links pointing at now-404 URLs with a redirect to the closest live
  equivalent.
- **Mixed content** — HTTPS pages must not load HTTP subresources (images, scripts,
  stylesheets); browsers block or warn on this, which also erodes user trust.
- **HTTPS/security** — valid certificate, no certificate errors, HSTS configured,
  legacy `http://` and non-canonical hosts 301 to the canonical HTTPS host.

## Rendering

- **JavaScript rendering** — for JS-heavy frameworks, verify content and links are
  present in Google's rendered HTML (Search Console URL Inspection "View Crawled
  Page" / rendered screenshot), not just in the initial HTML response.
- **Dynamic rendering / SSR / SSG** — prefer server-side rendering or static
  generation for content that must be indexed reliably; client-side-only rendering
  adds a render queue delay before content is picked up.

## International SEO

- **hreflang** — every language/region variant should reciprocally reference every
  other variant (including itself), use valid ISO language/region codes, and match
  one-to-one with a corresponding canonical tag on each variant page.
- **URL structure** — consistent pattern per market (ccTLD, subdirectory, or
  subdomain) — don't mix strategies across the same site without a clear reason.

## Structured Diagnostic Workflow

1. Crawl the site with a crawler (e.g. Screaming Frog or equivalent) to inventory
   status codes, canonicals, titles/meta, and directives at scale.
2. Cross-reference crawl output against Search Console's Coverage/Indexing report
   to find pages Google excludes that the crawl expects to be indexable (and vice
   versa).
3. Spot-check rendering for JS-dependent templates via URL Inspection.
4. Prioritize fixes by traffic/revenue impact of the affected URL set, not by raw
   issue count.
