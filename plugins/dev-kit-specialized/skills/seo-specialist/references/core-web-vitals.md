# Core Web Vitals Reference

Google's page-experience metrics, current thresholds, and the optimization levers
for each. Ratings are assessed at the 75th percentile of real-user sessions
(field data from the Chrome User Experience Report, CrUX, over a rolling 28-day
window) — lab tools (PageSpeed Insights, Lighthouse) approximate the same metrics
but only field/CrUX data determines the Search Console pass/fail verdict.

## The Three Metrics

| Metric | Measures | Good | Needs Improvement | Poor |
|--------|----------|------|--------------------|------|
| **LCP** (Largest Contentful Paint) | Loading — time until the largest visible element renders | ≤ 2.5s | 2.5s–4.0s | > 4.0s |
| **INP** (Interaction to Next Paint) | Responsiveness — latency of the slowest (or near-slowest) interaction across the whole page visit | ≤ 200ms | 200ms–500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | Visual stability — sum of unexpected layout shift scores | ≤ 0.1 | 0.1–0.25 | > 0.25 |

Note: INP replaced FID (First Input Delay) as the official responsiveness Core Web
Vital in March 2024. Any legacy content or tooling still citing FID as a ranking
metric is out of date — treat FID as a historical/diagnostic signal only.

## LCP Optimization

- Preload the LCP resource (hero image, key web font) with `<link rel="preload">`.
- Serve responsive, compressed, modern-format images (AVIF/WebP) sized to the
  actual rendered dimensions; avoid oversized source images scaled down by CSS.
- Eliminate render-blocking CSS/JS above the fold; inline critical CSS, defer the
  rest.
- Use a CDN and server-side caching to cut Time to First Byte, which gates every
  downstream paint metric.
- Avoid client-side-rendered hero content that waits on a JS bundle + data fetch
  before the LCP element appears — prefer SSR/SSG for above-the-fold content.

## INP Optimization

- Break up long JavaScript tasks (> 50ms) with `requestIdleCallback` / task
  yielding (`scheduler.yield()` where supported) so input handlers aren't blocked.
- Minimize main-thread work from third-party scripts (tag managers, chat widgets,
  ad tech) — load them lazily or behind user interaction where possible.
- Avoid large, synchronous DOM updates in response to a single interaction; batch
  and virtualize where lists are long.
- Reduce JavaScript bundle size and hydration cost for interactive components,
  especially on initial page load when a user may interact before hydration
  completes.

## CLS Optimization

- Always set explicit `width`/`height` (or `aspect-ratio`) on images, video
  embeds, and ad slots so the browser reserves space before the asset loads.
- Reserve space for web fonts (`font-display: optional` or matched fallback
  metrics) to avoid reflow on font swap.
- Never inject content above existing content (banners, cookie notices) without
  reserving the space up front.
- Avoid animations that trigger layout (animate `transform`/`opacity`, not
  `top`/`left`/`width`/`height`).

## Measurement Tools

- **PageSpeed Insights** — combines field data (CrUX, when available for the URL)
  with a lab Lighthouse run; field data is authoritative for the pass/fail verdict.
- **Search Console → Core Web Vitals report** — site-wide field data grouped by
  URL pattern, the same data source Google uses for the page-experience signal.
- **Chrome DevTools → Performance panel** — lab-only, useful for diagnosing the
  root cause of a slow LCP/INP on a specific page.
- **`web-vitals` JS library** — instrument real-user monitoring (RUM) directly
  in the page to capture field data segmented by device, connection, or route
  beyond what CrUX exposes.

## Notes on Ranking Impact

Core Web Vitals are one of many ranking signals (part of the broader "page
experience" signal set) — they function more as a tie-breaker between otherwise
comparable results than as a dominant ranking factor. Prioritize fixes on
high-traffic templates first; a perfect score on a low-traffic page has limited
business value.
