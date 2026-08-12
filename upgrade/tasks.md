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
- [x] ~~Upgrade `dropbox` SDK from v10~~ — done 2026-08-12, and it stays on
      v10: there is no newer major. The `latest` tag is **10.45.0** and the
      only other tag, `alpha`, points at the much older 4.1.0-alpha. So the
      upgrade was `^10.31.0`, resolving to 10.41.0, pinned to **10.45.0**,
      the same exact-version style as the other dependencies. The line had
      been dormant since 2022 and resumed releasing in July 2026; what came
      with it: `node-fetch` is gone in favour of the platform `fetch` (the
      SDK now declares `engines.node >= 22`, so package.json declares it
      too), `res.buffer()` became `res.arrayBuffer()`, the browser and node
      PKCE paths merged onto Web Crypto, and requests take an optional last
      `options` argument for `signal`/`timeout`/`extraHeaders`. There is
      also a new `downloadFile`, but it is node-only and unused here. No
      code change: all four calls the app makes - `filesListFolder`,
      `filesDownload`, `filesUpload`, `usersGetCurrentAccount` - plus the
      auth flow keep their signatures, and downloads still arrive as
      `fileBlob` in a browser. Verified by lint, build, and two harnesses:
      one in node recording every HTTP request the SDK emits for those
      calls, which comes out byte identical between 10.41.0 and 10.45.0
      (URL, method, headers, body), and one driving the real
      `dropboxService.js` in headless Firefox against a stubbed `fetch` -
      token refresh, account info, listing, `readFile` through the
      `FileReader`/`fileBlob` path, `writeFile` with its overwrite mode,
      the bearer header on every request, and the login page's PKCE:
      128-char RFC 7636 verifier, challenge equal to
      base64url(sha256(verifier)), and the code-for-refresh-token
      exchange. All 14 checks pass on both versions. Not tested against
      the real Dropbox API (no account credentials in this env). The suite
      is unchanged at 23 of 39 failing; the bundle grows 409.19 kB to
      410.72 kB (gzip 137.63 to 138.21).
- [x] ~~Upgrade `bootstrap` 3~~ — done 2026-08-12. 3.3.7 to **5.3.8**, the
      current release; 4 was skipped as it is itself a legacy line now. Only
      the CSS is used - the app loads no bootstrap JavaScript and no jQuery -
      so this is a class rename plus one structural fix. Renames: `pull-right`
      to `float-end`, `.close` to `.btn-close` (its own `&times;` glyph
      dropped, the component draws one), `.btn-block` to `.w-100`,
      `hidden-xs`/`visible-xs-block` to `d-none d-md-block`/`d-md-none`, and
      `bg-success`/`bg-danger` to `bg-success-subtle`/`bg-danger-subtle`,
      since plain `bg-success` in 5 is the solid brand green, not the pale
      highlight it was in 3. That last one also touches `ui-sref-active`,
      `scroll-if-class` and `ng-class` in the templates and the
      `.remove-record` rule in `site.css`, all of which name the class as a
      string. Grid prefixes moved up one step - `col-xs-*` to `col-*`,
      `col-sm-*` to `col-md-*`, `col-md-*` to `col-lg-*` - so the breakpoints
      stay at the pixel widths bootstrap 3 had. The structural fix: bootstrap
      5 columns are flex children, so they have to be direct children of
      `.row`; ui-router fills state templates into a `<ui-view>` element, so
      the `row` class moved off the wrapper in `index.html` onto that
      `<ui-view>` in the root state's template - without it every two column
      view stacked. Verified by lint, build, and screenshots of every view
      (lock, records, viewer, editor, years, settings, dropbox, error banner,
      and the phone width banner menu) taken in headless Firefox before and
      after, on the dev server and again on the built `dist/`: the pages come
      out the same layout, with bootstrap 5's darker buttons and larger close
      icon. The suite is unchanged at 23 of 39 failing. The CSS bundle grows
      147.95 kB to 261.41 kB (gzip 27.34 to 38.57); the JS bundle is
      untouched.
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
- [ ] Review and handle expired Dropbox access properly. `dropboxCtrl` reacts
      to an `expired_access_token` tag by calling `dropboxService.expire()` -
      a method that does not exist, so the handler itself throws a
      `TypeError` and the user sees nothing useful. It is a leftover: back
      when the app stored a long lived access token, `expire()` cleared
      `localStorage.dropboxAuthToken`; the move to refresh tokens
      (`59c2b99`, 2022) deleted the method and left the call behind. Decide
      what the app should actually do now. Points to cover:
      - the refresh token in `localStorage` is the real credential, and it
        also expires or gets revoked - the user unlinks the app, changes the
        password, or simply does not open the app for long enough. Then
        `checkAndRefreshAccessToken` in `prepareDropbox` is what fails, not
        the individual call, and `dropboxCtrl` reports it as a raw JSON
        blob through `errorService`.
      - `isAuthenticated` only asks whether the key is present in
        `localStorage`, never whether it still works, so the view offers
        "Get data" and "Auto sync" against a dead token.
      - recovery should clear the stale refresh token and put the user back
        on the Login button in `dropbox.html`, ideally without losing the
        sync that was in flight.
      - `syncService` goes through the same service, so a token that dies
        mid sync has to surface there too, not only on the Dropbox view.
      - decide whether re-login can be silent, and confirm which errors
        Dropbox actually returns today for a bad refresh token as against a
        bad access token - the `.tag` the code tests for may not be the one
        that arrives.
