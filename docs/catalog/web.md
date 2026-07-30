# Frontend / Web Engineer

## Frameworks

#### `react-expert`

- **Why needed:** React's flexibility around state management, data fetching, and component structure means a model left to its own devices will happily mix patterns (class components, stale hooks, ad-hoc fetch calls) that no longer match how React 18/19 apps are actually built.
- **What it does:** Builds React 18/19 components and custom hooks, migrates class components to functional/RSC, and implements state management (Context, Redux Toolkit, Zustand, TanStack Query). Names React 19-specific mechanics — `useActionState` for form submission with pending state, the `use()` hook, Server Components without `"use client"` — and enforces cleanup functions, stable `key` props, and Suspense boundaries.
- **Why not vanilla Claude Code:** Without it, Claude tends to default to React patterns circa 2021 (class components, `useEffect` for everything, index-as-key) rather than React 19's action-based forms and Server Component boundaries, and won't reliably run `tsc --noEmit` or React Testing Library as a validation loop.
- **When to use:** "Use when building React 18+ applications in .jsx or .tsx files, Next.js App Router projects, or create-react-app setups... Invoke for Server Components, Suspense boundaries, useActionState forms, performance optimization, or React 19 features."
- **Then what:** Components come out as TypeScript-strict, with error boundaries, memoized callbacks passed to memoized children, semantic HTML/ARIA, and either RSC-first architecture or client-boundary isolation at the leaf.
- **Notes:** Overlaps with `nextjs-developer` on Server Components — react-expert covers the React-level component/hook mechanics, nextjs-developer covers the Next.js routing, caching, and deployment layer around them.

#### `nextjs-developer`

- **Why needed:** Next.js 14+'s App Router inverts defaults from the Pages Router era (server-first rendering, colocated loading/error boundaries, `fetch`-based caching) and a model without this context will reach for Pages Router idioms or hardcode `<title>` tags instead of the Metadata API.
- **What it does:** Configures App Router structure, route handlers, middleware, streaming SSR, and `generateMetadata` for SEO. Enforces that components stay Server Components by default with `'use client'` only at leaf boundaries, requires explicit `cache`/`next.revalidate` options on `fetch` rather than relying on implicit caching, and mandates `loading.tsx`/`error.tsx` at every async route segment.
- **Why not vanilla Claude Code:** Generic Next.js knowledge tends to be stale on the App Router vs. Pages Router split and on caching semantics that changed release to release; this skill pins the workflow to `next build` validation and Core Web Vitals checks before calling anything done.
- **When to use:** "Use when building Next.js 14+ applications with App Router, server components, or server actions... Triggers on: Next.js, Next.js 14, App Router, RSC, use server, Server Components, Server Actions."
- **Then what:** Claude scaffolds route segments with layouts/templates, writes Server Actions with `revalidatePath`/`revalidateTag`, uses `next/image` and `next/font` instead of raw tags, and validates with a real `next build` plus a Lighthouse pass targeting >90 Core Web Vitals.
- **Notes:** Deploy-target relevant when Vercel is in play; see also `react-expert` for the component-level React patterns this skill wraps.

#### `angular-architect`

- **Why needed:** Angular's enterprise conventions (NgModules, Zone.js change detection, RxJS subscription lifecycles) have shifted hard toward standalone components and signals in v17+, and a model not anchored to this version will write NgModule boilerplate and forget to unsubscribe from observables.
- **What it does:** Generates Angular 17+ standalone components with `input()`/`output()`/`computed()` signals and OnPush change detection, wires up NgRx actions/reducers/selectors, and applies RxJS cleanup via `takeUntilDestroyed`. Requires `ng build --configuration production` to catch bundle regressions and TestBed-based tests hitting an 85% coverage bar.
- **Why not vanilla Claude Code:** Angular's API surface changes significantly release-to-release (View Engine vs Ivy, NgModules vs standalone, decorators vs signals); without this skill Claude is likely to blend outdated and current Angular idioms in the same file.
- **When to use:** "Use when building Angular 17+ applications with standalone components or signals, setting up NgRx stores, establishing RxJS reactive patterns, performance tuning, or writing Angular tests for enterprise apps."
- **Then what:** Output shifts to standalone (non-NgModule) components with strict TypeScript, `trackBy` on every `*ngFor`, immutable NgRx state updates, and DevTools-verified store hydration before moving on.

#### `vue-expert`

- **Why needed:** Vue 3's Composition API, Nuxt 3 SSR, and Pinia have replaced the Options API and Vuex, but a lot of ambient Vue knowledge and existing codebases still lean on the old patterns, producing a mismatched mix if left unguided.
- **What it does:** Builds Vue 3 components with `<script setup lang="ts">` and the Composition API, configures Nuxt 3 SSR/SSG and Fastify-based hydration, sets up Pinia stores, and extends into Quasar/Capacitor for hybrid mobile apps and PWA/service-worker setups. Validation runs `vue-tsc --noEmit` and Vue Test Utils/Vitest component tests.
- **Why not vanilla Claude Code:** This is the TypeScript-first Vue skill — it assumes `lang="ts"`, typed props via `defineProps<T>()`, and a `vue-tsc` type-check loop, none of which a generic Vue answer reliably includes, and it explicitly forbids Options API and Vuex which older training data still surfaces.
- **When to use:** "Use when creating Vue 3 applications with Composition API, writing reusable composables, managing state with Pinia, building hybrid mobile apps with Quasar or Capacitor, configuring service workers, or tuning Vite configuration and TypeScript integration."
- **Then what:** Components use `ref()` for primitives / `reactive()` for objects, `computed()` over `watch()` where possible, Pinia instead of Vuex, and cleanup wired into `onUnmounted`.
- **Notes:** Distinct from `vue-expert-js` — this is the TypeScript variant; use this one whenever `.ts`/`lang="ts"` or `vue-tsc` is in scope.

#### `vue-expert-js`

- **Why needed:** Vue 3 projects that deliberately avoid a TypeScript compiler (JS-only teams, quick prototypes, legacy JS codebases) still want type safety, and a model asked for "Vue in JavaScript" will often introduce TypeScript syntax by habit or skip type documentation entirely.
- **What it does:** Builds Vue 3 components in plain JavaScript with `<script setup>` (no `lang` attribute) and full JSDoc typing — `@typedef`, `@param`, `@returns`, `@type` — instead of TS syntax, including typed `defineProps`/`defineEmits` via JSDoc and `.mjs` composables. Validates JSDoc coverage with `eslint-plugin-jsdoc` and tests with Vitest on `.js` files.
- **Why not vanilla Claude Code:** Without an explicit "no TypeScript" constraint, a model that knows modern Vue will reflexively add `lang="ts"` or `.ts` extensions; this skill actively forbids that and substitutes a comprehensive JSDoc convention in its place.
- **When to use:** "Use when building Vue 3 applications with JavaScript only (no TypeScript), when projects require JSDoc-based type hints, when migrating from Vue 2 Options API to Composition API in JS, or when teams prefer vanilla JavaScript, .mjs modules, or need quick prototypes without TypeScript setup."
- **Then what:** Every public function and prop shape gets a `@typedef`/`@param`/`@returns` block, `.mjs` is used for ESM composables, and no `.ts` files or `require()` appear anywhere in the output.
- **Notes:** Sibling to `vue-expert`; defers to it for shared reactivity/component/Pinia concepts and only diverges on typing mechanism (JSDoc vs. TS) and file extensions.

## Language

#### `javascript-pro`

- **Why needed:** "Just write JavaScript" invites inconsistency — callback soup vs. Promises, CJS `require` mixed into ESM, `var` habits — especially in vanilla (non-framework) JS work where no framework skill is around to impose structure.
- **What it does:** Writes and refactors vanilla JS using ES2023+ features, async/await, ESM modules, and Node.js/browser APIs (Fetch, Web Workers, `fs/promises`, streams, EventEmitter). Enforces `const`/`let` over `var`, optional chaining/nullish coalescing, and named ESM exports, then validates with `eslint --fix` and Jest at 85%+ coverage, checking for unhandled Promise rejections and memory leaks via DevTools/`--inspect`.
- **Why not vanilla Claude Code:** Generic completions frequently blend callback and Promise-based async styles or mix `require()` into a file with `import`/`export`; this skill's MUST-NOT-DO list specifically targets those failure modes with a lint-and-retest loop to catch them.
- **When to use:** "Use when building vanilla JavaScript applications, implementing Promise-based async flows, optimising browser or Node.js performance, working with Web Workers or Fetch API, or reviewing .js/.mjs/.cjs files for correctness and best practices."
- **Then what:** Output is ESM-only, uses `try/catch` around every `await`, includes JSDoc on complex functions, and ships with a Jest test file rather than untested logic.

#### `typescript-pro`

- **Why needed:** Advanced TypeScript — branded types, discriminated unions with exhaustive checks, conditional/mapped types, tRPC end-to-end typing — is easy to get "close enough but unsound" without deliberate design, e.g. using `any` or `as` casts to route around a type error rather than modeling it correctly.
- **What it does:** Implements branded types (`Brand<T, B>`) for domain modeling, discriminated unions with type-predicate guards and exhaustive `never`-checked switches, custom utility types (`DeepReadonly`, `RequireExactlyOne`), and a strict `tsconfig.json` (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `NodeNext` modules). Runs `tsc --noEmit` and a `type-coverage` check as gates.
- **Why not vanilla Claude Code:** A model without this skill will silence type errors with `any` or `as` rather than modeling the actual union/generic, and won't consistently enable the stricter, less well-known compiler flags that catch real bugs (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- **When to use:** "Use when building TypeScript applications requiring advanced generics, conditional or mapped types, discriminated unions, monorepo setup, or full-stack type safety with tRPC."
- **Then what:** Types get designed before implementation, `satisfies` replaces unsafe assertions, enums are avoided in favor of `as const` objects, and every public API gets an explicit return type and declaration file.
- **Notes:** Cross-cutting — react-expert, angular-architect, nextjs-developer, and vue-expert all assume TypeScript; this skill is the one to reach for when the type system itself (not the framework) is the crux of the problem.

## Testing

#### `playwright-expert`

- **Why needed:** E2E browser tests are notoriously flaky, and the easy path — CSS class selectors, `waitForTimeout()`, shared state between tests — produces suites that pass locally and fail intermittently in CI, which is exactly the failure mode this skill targets.
- **What it does:** Writes Playwright tests using the Page Object Model, role-based selectors (`getByRole`, `getByLabel`) over brittle CSS classes, and auto-waiting instead of arbitrary timeouts. Lays out a concrete flaky-test debugging loop: enable `trace: 'on-first-retry'`, re-run with `--retries=2`, inspect via `show-trace`, replace timeouts with `waitFor({ state: 'visible' })`, then confirm stability with `--repeat-each=10`.
- **Why not vanilla Claude Code:** Generic test-writing defaults to whatever selector is visually obvious (often a CSS class) and to `waitForTimeout` as a quick fix for timing issues — both of which this skill explicitly bans in favor of resilient, auto-waiting alternatives.
- **When to use:** "Use when writing E2E tests with Playwright, setting up test infrastructure, or debugging flaky browser tests... Trigger terms: Playwright, E2E test, end-to-end, browser testing, automation, UI testing, visual testing, Page Object Model, test flakiness."
- **Then what:** Tests come out as independent (no shared state), organized into Page Object classes, asserting via role-based locators, and configured with traces/screenshots on failure for future debugging.
- **Notes:** Related to `react-expert` (testing React UI flows) but operates at the browser/E2E layer, not the component-unit layer.

## Platforms / CMS / Desktop

#### `shopify-expert`

- **Why needed:** Shopify spans three very different surfaces — Liquid theme templating, custom app development with OAuth/webhooks, and headless Storefront API/Hydrogen storefronts — each with its own idioms, rate limits, and deprecated-API traps that generic e-commerce knowledge won't distinguish.
- **What it does:** Builds Liquid templates with metafield access and Online Store 2.0 collection filtering, scaffolds Shopify apps with `shopify.app.toml` and authenticated Admin API GraphQL calls, and writes Storefront API GraphQL queries for headless/Hydrogen storefronts. Names concrete tooling (`shopify theme check`, `shopify app dev`, App Bridge, Polaris) and a hard rate-limit ceiling (2000 points/sec on Storefront API).
- **Why not vanilla Claude Code:** Without this skill, Claude is prone to reaching for deprecated REST Admin API endpoints or synchronous Liquid API calls instead of the current GraphQL/Storefront API 2024-10 approach, and won't know to gate every theme deployment behind `shopify theme check`.
- **When to use:** "Use when building or customizing Shopify themes, creating Hydrogen or custom React storefronts, developing Shopify apps, implementing checkout UI extensions or Shopify Functions, optimizing performance, or integrating third-party services."
- **Then what:** Liquid code uses 2.0 syntax and metafields correctly, app code authenticates via `authenticate.admin(request)` before any Admin GraphQL call, checkout extensions get sandbox-tested, and API credentials never get hardcoded into theme files.

#### `wordpress-pro`

- **Why needed:** WordPress plugin/theme code is a classic injection and XSS minefield — unsanitized `$_POST` access, unescaped output, missing nonce checks — and PHP's permissiveness means insecure code runs without complaint, so the gap here is security discipline as much as WordPress API knowledge.
- **What it does:** Develops themes, plugins, and Gutenberg blocks; configures WooCommerce and ACF; implements REST API endpoints. Codifies the full security chain — `wp_nonce_field`/`wp_verify_nonce` on every form, `sanitize_text_field`/`wp_kses_post`/`esc_url_raw` on input, `esc_html`/`esc_attr`/`esc_url` on output, `$wpdb->prepare` for every query, and `current_user_can` capability checks before privileged actions — and validates with `phpcs --standard=WordPress`.
- **Why not vanilla Claude Code:** Generic PHP/WordPress completions frequently skip escaping on output or interpolate `$wpdb` queries directly rather than using `prepare()`; this skill's MUST-NOT-DO list treats those as hard blockers, not style preferences.
- **When to use:** "Use when building WordPress themes, writing plugins, customizing Gutenberg blocks, extending WooCommerce, working with ACF, using the WordPress REST API, applying hooks and filters, or improving WordPress performance and security."
- **Then what:** Every form gets a nonce, every input gets sanitized before storage, every output gets escaped, every raw SQL query goes through `$wpdb->prepare`, and scripts/styles get enqueued via `wp_enqueue_scripts` rather than inlined.

#### `electron-pro`

- **Why needed:** Electron's main/renderer split is a real security boundary — a misconfigured renderer with Node integration enabled or context isolation off gives arbitrary code execution to anything the app renders — and this is easy to get wrong without a checklist forcing the secure-by-default configuration.
- **What it does:** Covers cross-platform Electron 27+ desktop apps end to end: main/renderer process architecture, preload-script-mediated IPC, context isolation, auto-updates with signature verification, code signing/notarization, native OS integration (system tray, menus, protocol handlers), and installer builds. Sets concrete performance budgets (startup under 3s, idle memory under 200MB, installer under 100MB).
- **Why not vanilla Claude Code:** Electron security misconfiguration (Node integration in renderers, disabled context isolation, disabled web security) is a common and dangerous default that generic guidance doesn't reliably flag as a checklist item before any feature work starts.
- **When to use:** "Use when the task involves Electron desktop applications — cross-platform desktop apps for Windows/macOS/Linux, main/renderer processes, IPC, preload scripts, context isolation, native OS integration, system tray, auto-updates, code signing, notarization, installers, electron-builder."
- **Then what:** New Electron code enables context isolation and a strict CSP by default, disables Node integration and the remote module in renderers, routes all renderer-to-main communication through validated preload-exposed IPC channels, and plans code signing/notarization as part of the build, not an afterthought.
