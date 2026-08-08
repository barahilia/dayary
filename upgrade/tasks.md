# Upgrade Tasks

- [x] ~~Rewrite `www/dbService.js` off Web SQL onto IndexedDB~~ — already done, confirmed 2026-08-02
- [x] ~~Drop Bower, move to npm + Vite~~ — done 2026-08-03. Sources are ES modules; templates bundled via `?raw`; explicit `$inject` annotations added so DI survives minification. AppCache manifest dropped (it was listing `bower_components/` paths, and AppCache is gone from all browsers) — offline support returns with the Service Worker task. PhantomJS devDependency removed early: its install script crashes on Node 22 and blocked every `npm install`.
- [x] ~~Replace `moment` with `date-fns`~~ — done 2026-08-08. Stored timestamps keep the exact same wire format: `moment().format()` → `formatISO(new Date())`, both `2026-08-08T11:35:57+03:00`, so the IndexedDB `created` index and Dropbox JSON stay comparable with existing data. `moment.duration()` in `lockService` became plain millisecond arithmetic (`minutesToMilliseconds`/`secondsToMilliseconds`); `moment.months()` became a generated `format(date, 'LLLL')` list. Verified by build + lint and by running `syncService.filesToImport`/`yearsToExport` in node; not browser-tested (tests are broken).
- [x] ~~Remove `underscore` (cover with native JS)~~ — done 2026-08-02, not test-verified (PhantomJS/jshint unavailable in this env)
- [ ] Replace AppCache manifest with a Service Worker for offline support
- [ ] Drop PhantomJS, migrate tests to Karma+headless Chrome or Jest/Vitest
- [ ] Replace `cryptojslib` with Web Crypto API or `crypto-js`
- [ ] Upgrade `ui-router` 0.2.13 to a maintained version
- [ ] Upgrade `dropbox` SDK from v10
- [ ] Upgrade `bootstrap` 3
- [ ] Decide: keep AngularJS 1.x pinned vs. migrate to a maintained framework (separate, larger decision)
- [ ] Fix all Jasmine tests; see README for details
