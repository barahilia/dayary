# Upgrade Tasks

- [x] ~~Rewrite `www/dbService.js` off Web SQL onto IndexedDB~~ — already done, confirmed 2026-08-02
- [x] ~~Drop Bower, move to npm + Vite~~ — done 2026-08-03. Sources are ES modules; templates bundled via `?raw`; explicit `$inject` annotations added so DI survives minification. AppCache manifest dropped (it was listing `bower_components/` paths, and AppCache is gone from all browsers) — offline support returns with the Service Worker task. PhantomJS devDependency removed early: its install script crashes on Node 22 and blocked every `npm install`.
- [x] ~~Replace `moment` with `date-fns`~~ — done 2026-08-08. Stored timestamps keep the exact same wire format: `moment().format()` → `formatISO(new Date())`, both `2026-08-08T11:35:57+03:00`, so the IndexedDB `created` index and Dropbox JSON stay comparable with existing data. `moment.duration()` in `lockService` became plain millisecond arithmetic (`minutesToMilliseconds`/`secondsToMilliseconds`); `moment.months()` became a generated `format(date, 'LLLL')` list. Verified by build + lint and by running `syncService.filesToImport`/`yearsToExport` in node; not browser-tested (tests are broken).
- [x] ~~Remove `underscore` (cover with native JS)~~ — done 2026-08-02, not test-verified (PhantomJS/jshint unavailable in this env)
- [x] ~~Replace AppCache manifest with a Service Worker for offline support~~ — done 2026-08-08. `www/sw.js` holds the worker; `tools/viteServiceWorker.js` is a build plugin that copies it to the build root with the precache list taken from the bundle and a revision hashed from the built files' content. Precache on install, cache-first afterwards, `ignoreSearch` for the `?v=4.7.0` font URLs, index page as the fallback for in-app navigations, cross-origin and non-GET requests passed through untouched so Dropbox keeps working. Registered from `www/registerServiceWorker.js` only in the production build. Verified by build + lint, by fetching every precached URL off `npm run preview` (all 200), and by running the built `dist/sw.js` under a Cache API stand-in in node - install, stale-cache cleanup, and each fetch case behave as intended; not verified in a real browser (no browser in this env).
- [x] ~~Drop PhantomJS, migrate tests to Karma+headless Chrome or Jest/Vitest~~ — done 2026-08-09, but not as written. Went to headless **Firefox** over WebDriver, not Chrome: no Chrome or Chromium on the dev machine, while the Firefox snap ships both Firefox and `geckodriver`, so the only new dependency is `selenium-webdriver` (pure JS, no binary download). Karma is dead (EOL 2023) and handles neither ES modules nor Vite's `?raw` template imports. Vitest was rejected on cost and fidelity: it supports no `done` callback (the first argument is a `TestContext`) and its `vi.spyOn().mockReturnValue()` is not jasmine's `spyOn().and.returnValue()`, so all 661 spec lines would need rewriting - and running under jsdom + `fake-indexeddb` would mock away the very IndexedDB that `db-service-spec` and `sync-db-spec` exist to test. Instead `npm test` runs `tools/runTests.js`, which serves the unchanged `test/jasmine.html` from a Vite server on its own port and drives it headless. Specs unchanged. Baseline at landing: 39 specs, 22-23 failures (one is order-dependent, the suite runs randomized).
- [ ] Replace `cryptojslib` with Web Crypto API or `crypto-js`
- [ ] Upgrade `ui-router` 0.2.13 to a maintained version
- [ ] Upgrade `dropbox` SDK from v10
- [ ] Upgrade `bootstrap` 3
- [ ] Decide: keep AngularJS 1.x pinned vs. migrate to a maintained framework (separate, larger decision)
- [ ] Fix all Jasmine tests; see README for details
- [ ] Consider replacing Jasmine itself. The WebDriver runner keeps the specs
      as they are, which was the point of it, but it leaves the suite on
      globals (`describe`, `inject`, `spyOn`), on `done` callbacks, and on
      scraping results out of the reporter's DOM instead of reading them from
      a runner. Worth revisiting once the specs pass and the `done` callbacks
      have become promises anyway - at that point the move to Vitest is a much
      smaller step than it is today. Not urgent: jasmine 5 is maintained.
      Other options: Vitest, Playwright, Puppeteer.
