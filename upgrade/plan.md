# Upgrade Plan

Quick review of the stack (AngularJS 1.4 + ui-router 0.2.x, Bower, Web SQL,
AppCache manifest, PhantomJS/Jasmine, old Dropbox SDK, cryptojslib) and what
it would take to bring it forward.

## The blocker, not just staleness

Two of the core architectural choices are gone from browsers, not just old:

- **Web SQL** — fully removed from Chrome and Safari now (it lingered on a
  deprecation path for years, but it's gone). This is the entire local data
  layer (`www/dbService.js`). Not a version bump — needs a rewrite onto
  IndexedDB (or a wrapper like Dexie).
- **AppCache** (`manifest="site.manifest"`) — removed from all browsers.
  Offline support needs a Service Worker rewrite from scratch.

## Dead tooling, needs replacing outright

- **Bower** — deprecated since 2017, registry is effectively unmaintained.
  Move to npm + a bundler (Vite is the easy fit for a script-tag Angular 1
  app).
- **PhantomJS** — abandoned since 2018, won't run on modern systems easily.
  Swap for Karma+headless Chrome or migrate tests to Jest/Vitest.

## EOL but still functions

- **AngularJS 1.x** — EOL since Jan 2022, zero security patches since. Runs
  fine today but is a standing risk if this ever handles more than your own
  local encrypted diary. Biggest strategic fork in the road: keep it pinned
  (cheap) vs. migrate to something maintained (expensive).
- `ui-router` 0.2.13, `dropbox` SDK v10, `cryptojslib`, `underscore`,
  `moment`, `bootstrap` 3 — all ancient but each is an isolated swap
  (moment → date-fns, cryptojslib → Web Crypto API or crypto-js,
  underscore → delete it, native JS covers it).

## Effort tiers

- **Keep it running as-is**: no work needed for now, but it's living on
  borrowed time — Web SQL removal means it may already be partially broken
  for new users.
- **Minimal unblock** (fix what's actually broken, keep AngularJS): rewrite
  `dbService.js` for IndexedDB, add a Service Worker for offline, drop Bower
  for npm/Vite, drop PhantomJS for a modern test runner. Rough order: a few
  focused days for someone who knows the codebase — the data layer rewrite
  is the bulk of it.
- **Full modernization** (also leave AngularJS): add a framework migration
  (React/Vue/Svelte, or Angular 2+) on top of the above — that's a rewrite
  of every controller/service, easily weeks, not days.

## Recommendation

The Web SQL removal makes this non-optional homework, not a nice-to-have —
scope the "minimal unblock" tier first and treat the framework migration as
a separate decision later.
