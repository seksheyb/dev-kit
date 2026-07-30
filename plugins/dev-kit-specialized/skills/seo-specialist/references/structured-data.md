# Structured Data / Schema Markup Reference

Guidance for implementing schema.org structured data to earn Google rich results.
Markup validity and rich-result eligibility are two separate things — Google only
renders a rich result for a subset of schema.org types it has chosen to support,
and that supported subset changes over time independent of the schema.org
vocabulary itself.

## Implementation Basics

- Prefer **JSON-LD** in a `<script type="application/ld+json">` block in the
  `<head>` or `<body>` — Google's preferred format, and decoupled from the visible
  DOM (unlike Microdata/RDFa, which require inline attributes on the rendered
  markup).
- Markup must describe content that is actually visible to users on the page —
  don't mark up data the page doesn't display.
- Validate with **Google's Rich Results Test** (checks eligibility for Google
  Search features specifically) and a general schema.org validator (checks spec
  conformance) — a page can pass one and fail the other.
- Monitor **Search Console → Enhancements** reports per markup type for errors
  and warnings surfaced after Google actually crawls the page.

## Currently Supported Rich Result Types (verify against Google's Search Gallery before relying on this list)

As of this writing, Google continues to support rich results for: Article,
Product, Review/AggregateRating snippets, BreadcrumbList, Video, Event, Recipe,
LocalBusiness, Organization, Sitelinks Searchbox, JobPosting, and Course markup.
Google's supported-type list changes over time — always cross-check
`developers.google.com/search/docs/appearance/structured-data/search-gallery`
before committing to a type, rather than relying on a static list.

## Deprecated / Removed Rich Result Types — do not lead with these

- **FAQPage**: Google discontinued the FAQ rich result on 2026-05-07. The
  `FAQPage` schema.org type is still valid markup and won't cause errors, but it
  no longer produces the expandable FAQ snippet in Google Search — don't
  recommend it as a rich-result tactic. (Search Console reporting for it is
  slated to wind down afterward.)
- **HowTo**: Google removed the HowTo rich result (desktop and mobile). Don't
  prioritize `HowTo` markup for SERP appearance; it may still be useful as
  general semantic markup but won't render a rich result.
- Google has also dropped several narrower types over time (e.g. Book Actions,
  Course Info, Claim Review, Estimated Salary, Learning Video, Special
  Announcement, Practice Problem) — treat any list of "supported types" as
  perishable and re-verify before an implementation.

## Common High-Value Types

| Type | Use For | Key Required Properties |
|------|---------|--------------------------|
| `Product` | E-commerce listings | `name`, `image`, `offers` (price/currency/availability) |
| `Article` / `NewsArticle` | Blog posts, news | `headline`, `image`, `datePublished`, `author` |
| `LocalBusiness` | Location pages | `name`, `address`, `telephone` |
| `BreadcrumbList` | Site navigation trail | ordered `itemListElement` with `position`, `name`, `item` |
| `Organization` | Brand/site identity | `name`, `logo`, `url`, `sameAs` (social profiles) |
| `Review` / `AggregateRating` | Product/service ratings | `itemReviewed`, `ratingValue`, `reviewCount` |
| `JobPosting` | Job listings | `title`, `datePosted`, `validThrough`, `hiringOrganization` |
| `VideoObject` | Video content | `name`, `description`, `thumbnailUrl`, `uploadDate` |

## Testing and Maintenance Workflow

1. Implement JSON-LD for the target type using the current required/recommended
   property list from Google's own documentation for that type (not a cached
   copy — required fields change).
2. Validate with the Rich Results Test before deploy.
3. After deploy, watch Search Console's per-type Enhancement report for a few
   weeks for crawl errors or warnings.
4. Re-audit markup after any Google structured-data documentation update
   (announced as changelog entries on Google's Search Central site) — rich
   result eligibility for a given type can be added or withdrawn without a
   dedicated announcement.
