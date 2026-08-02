# Upgrade Tasks

- [x] ~~Rewrite `www/dbService.js` off Web SQL onto IndexedDB~~ — already done, confirmed 2026-08-02
- [ ] Drop Bower, move to npm + Vite — blocks the `date-fns` swap below (moment is a global script tag today; date-fns has no browser-global bundle)
- [ ] Replace `moment` with `date-fns` (do after Bower→Vite)
- [x] ~~Remove `underscore` (cover with native JS)~~ — done 2026-08-02, not test-verified (PhantomJS/jshint unavailable in this env)
- [ ] Replace AppCache manifest with a Service Worker for offline support
- [ ] Drop PhantomJS, migrate tests to Karma+headless Chrome or Jest/Vitest
- [ ] Replace `cryptojslib` with Web Crypto API or `crypto-js`
- [ ] Upgrade `ui-router` 0.2.13 to a maintained version
- [ ] Upgrade `dropbox` SDK from v10
- [ ] Upgrade `bootstrap` 3
- [ ] Decide: keep AngularJS 1.x pinned vs. migrate to a maintained framework (separate, larger decision)
