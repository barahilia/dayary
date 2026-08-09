# General guidelines
- Add new tasks at the end, keep lines under 80 chars long, max 87.
- Some tests are still broken; do not fix them until specific task comes.
- Take the first open task.
- See README.md for more context; update it if needed.

# Upgrade Tasks

- [x] ~~Rewrite `www/dbService.js` off Web SQL onto IndexedDB~~ — already
      done, confirmed 2026-08-02
- [x] ~~Drop Bower, move to npm + Vite~~ — done 2026-08-03. Sources are ES
      modules; templates bundled via `?raw`; explicit `$inject` annotations
      added so DI survives minification. AppCache manifest dropped (it was
      listing `bower_components/` paths, and AppCache is gone from all
      browsers) — offline support returns with the Service Worker task.
      PhantomJS devDependency removed early: its install script crashes on
      Node 22 and blocked every `npm install`.
- [x] ~~Replace `moment` with `date-fns`~~ — done 2026-08-08. Stored
      timestamps keep the exact same wire format: `moment().format()` →
      `formatISO(new Date())`, both `2026-08-08T11:35:57+03:00`, so the
      IndexedDB `created` index and Dropbox JSON stay comparable with
      existing data. `moment.duration()` in `lockService` became plain
      millisecond arithmetic (`minutesToMilliseconds`/`secondsToMilliseconds`);
      `moment.months()` became a generated `format(date, 'LLLL')` list.
      Verified by build + lint and by running
      `syncService.filesToImport`/`yearsToExport` in node; not browser-tested
      (tests are broken).
- [x] ~~Remove `underscore` (cover with native JS)~~ — done 2026-08-02, not
      test-verified (PhantomJS/jshint unavailable in this env)
- [x] ~~Replace AppCache manifest with a Service Worker for offline
      support~~ — done 2026-08-08. `www/sw.js` holds the worker;
      `tools/viteServiceWorker.js` is a build plugin that copies it to the
      build root with the precache list taken from the bundle and a revision
      hashed from the built files' content. Precache on install, cache-first
      afterwards, `ignoreSearch` for the `?v=4.7.0` font URLs, index page as
      the fallback for in-app navigations, cross-origin and non-GET requests
      passed through untouched so Dropbox keeps working. Registered from
      `www/registerServiceWorker.js` only in the production build. Verified
      by build + lint, by fetching every precached URL off `npm run preview`
      (all 200), and by running the built `dist/sw.js` under a Cache API
      stand-in in node - install, stale-cache cleanup, and each fetch case
      behave as intended; not verified in a real browser (no browser in this
      env).
- [x] ~~Drop PhantomJS, migrate tests to Karma+headless Chrome or
      Jest/Vitest~~ — done 2026-08-09, but not as written. Went to headless
      **Firefox** over WebDriver, not Chrome: no Chrome or Chromium on the
      dev machine, while the Firefox snap ships both Firefox and
      `geckodriver`, so the only new dependency is `selenium-webdriver`
      (pure JS, no binary download). Karma is dead (EOL 2023) and handles
      neither ES modules nor Vite's `?raw` template imports. Vitest was
      rejected on cost and fidelity: it supports no `done` callback (the
      first argument is a `TestContext`) and its
      `vi.spyOn().mockReturnValue()` is not jasmine's
      `spyOn().and.returnValue()`, so all 661 spec lines would need
      rewriting - and running under jsdom + `fake-indexeddb` would mock away
      the very IndexedDB that `db-service-spec` and `sync-db-spec` exist to
      test. Instead `npm test` runs `tools/runTests.js`, which serves the
      unchanged `test/jasmine.html` from a Vite server on its own port and
      drives it headless. Specs unchanged. Baseline at landing: 39 specs,
      22-23 failures (one is order-dependent, the suite runs randomized).
- [x] ~~Replace `cryptojslib` with Web Crypto API or `crypto-js`~~ — done
      2026-08-09. The bower `cryptojslib` was already gone with Bower itself;
      what was left was npm `crypto-js` pinned at **3.3.0**, which carries two
      advisories, one of them critical. The one that mattered here: 3.x builds
      salts and IVs out of `Math.random()`, so every record's salt was
      predictable. Bumped to **4.2.0**, the last release ever (the project is
      discontinued and the package is marked deprecated on npm) - the bundle
      now takes randomness from `crypto.getRandomValues` and contains no
      `Math.random` at all. Web Crypto was rejected for now, see the task
      below: it can neither read the existing ciphertext nor be called
      synchronously, so it is a data migration, not a library swap. The 4.x
      wire format is unchanged - OpenSSL `Salted__` + AES-256-CBC - and both
      directions were verified in node: records encrypted by 3.3.0 decrypt
      under 4.2.0 and vice versa (an old cached build on another device keeps
      working), `computeHash` still returns the same SHA-256 as before and as
      node's own `createHash`, and a wrong passphrase still throws rather than
      returning empty. Verified by build + lint and by driving
      `encryptionService` in node; not browser-tested (tests are broken).
- [x] ~~Upgrade `ui-router` 0.2.13 to a maintained version~~ — done
      2026-08-09. It was already 0.2.18, still under the deprecated
      `angular-ui-router` name; now `@uirouter/angularjs` **1.1.2**, the
      current release of the same project, which pulls `@uirouter/core`
      6.1.2 in as a peer. Four code changes: `app.js` imports the new
      package (it imports angular itself, so the load-order comment went
      away); `configApp` takes `$urlServiceProvider` and calls
      `rules.otherwise('/')` instead of the deprecated `$urlRouterProvider`;
      `runApp`'s `$stateChangeStart` listener - the event is gone in 1.x -
      became `$transitions.onStart` returning `$state.target("lock")` in
      place of `preventDefault()` plus `$state.go`; and `<ui-view />` in the
      root state's template got a closing tag. Verified by lint, build and a
      throwaway WebDriver script run against both the dev server and the
      production build: deep link while locked redirects to lock, unlock,
      `ui-sref` navigation, nested `records.item.edit` views,
      `ui-sref-active`, and lock-then-unlock returning to `#/records/2` with
      its params. The suite is unchanged - with a fixed jasmine seed it
      fails the same 23 of 39 specs before and after. The bundle grows from
      334 kB to 409 kB (gzip 116 to 138).
- [ ] Upgrade `dropbox` SDK from v10
- [ ] Upgrade `bootstrap` 3
- [ ] Stop with the changes and upgrades; make sure everything works in browser
- [ ] Decide: keep AngularJS 1.x pinned vs. migrate to a maintained
      framework (separate, larger decision)
- [ ] Fix all Jasmine tests; see README for details
- [ ] Strengthen the key derivation, most likely by moving to Web Crypto.
      `CryptoJS.AES.encrypt(text, passphrase)` derives the key with OpenSSL's
      `EvpKDF`: **MD5, one iteration**. A passphrase is therefore about as
      strong as a single hash of it, and crypto-js is unmaintained, so this
      will not improve on its own. Web Crypto has PBKDF2 with a real iteration
      count (or Argon2 via wasm) and AES-GCM, which authenticates - today a
      wrong passphrase is detected only by the plaintext coming out as
      non-UTF-8. The cost is what makes this its own task: Web Crypto is async,
      so `encrypt`/`decrypt` become promises for every caller, and it has no
      MD5, so old records cannot be read without keeping crypto-js or hand
      rolling `EvpKDF`. Wants a versioned ciphertext prefix and a
      re-encrypt-on-read migration, both of which touch stored data.
- [ ] Consider replacing Jasmine itself. The WebDriver runner keeps the specs
      as they are, which was the point of it, but it leaves the suite on
      globals (`describe`, `inject`, `spyOn`), on `done` callbacks, and on
      scraping results out of the reporter's DOM instead of reading them from
      a runner. Worth revisiting once the specs pass and the `done` callbacks
      have become promises anyway - at that point the move to Vitest is a much
      smaller step than it is today. Not urgent: jasmine 5 is maintained.
      Other options: Vitest, Playwright, Puppeteer.
