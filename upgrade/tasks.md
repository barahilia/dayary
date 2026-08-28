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
- [x] ~~Stop with the changes and upgrades; make sure everything works in
      browser~~ — done 2026-08-13. The app was exercised by hand on the dev
      server at `localhost:3000`, the Dropbox flow included: that was the one
      path every upgrade so far had only reached through a stubbed `fetch`,
      the SDK bump being verified against recorded requests rather than the
      real API. Nothing needed changing, so the branch stands as it is and
      3.0.0 goes out. What is left for production is not a code question but
      a deployment one, and it turns out `gh-pages` cannot take a merge from
      `master` any more: it still holds the pre-Vite source tree, while what
      has to be served now is the contents of `dist/`, which is gitignored.
      `upgrade/production.md` carries the release runbook - build, tag,
      publish from a worktree that wipes the old tree first, verify, and the
      rollback, which needs a service worker kill switch rather than a plain
      force push. Checked against the deployed 2.1.3 before writing it: the
      IndexedDB name, version, stores and `created` index are identical, so
      existing diaries survive; the ciphertext format, the Dropbox redirect
      URI and the refresh token in `localStorage` all carry over; hash
      routing means no rewrite rules; and there is no `CNAME` to preserve.
- [ ] Decide: keep AngularJS 1.x pinned vs. migrate to a maintained
      framework (separate, larger decision)
- [x] ~~Fix all Jasmine tests; see README for details~~ — done 2026-08-12.
      39 specs, 0 failures, three runs in a row. No production code changed:
      every failure was a spec still describing Web SQL behaviour or the
      jasmine 5 semantics. Four causes.
      - Jasmine 5 randomizes specs by default, and the `db service` and
        `sync db` suites are sequences over a single database, so a shuffle
        alone accounted for one failure that moved between runs. `test/main.js`
        now calls `configure({ random: false })`.
      - `done` takes any argument as a failure, so `cleanDb().then(done)` in
        both db suites failed the first spec of each - and, since a failing
        `beforeEach` skips the spec body, denied the following specs the state
        they expect. Now `.then(function () { done(); })`.
      - `db-service-spec` called `cleanDb()` before `init()` had resolved, so
        `newDb` was undefined and every spec threw; it inits first now. Its
        expectations were Web SQL's too: `rowsAffected` for a write, where
        IndexedDB resolves with the key; numbers read back as `'1.0'` strings;
        records without `text`, which `getAll()` cannot do; and a failing
        update of a missing row, where `put()` upserts - the renamed spec now
        states that. Ids are no longer assumed to be 1 and 2, as `clear()`
        leaves the key generator running.
      - `sync db` compared the exported JSON as text, but key order follows
        how each record was stored - a synced record ends up with `id` last -
        so it parses the argument now. Same `text` field fix in the record
        expectations, and `exportYear`/`importFile` resolve with the sync
        status key rather than undefined.
      - `lock-service-spec` unlocked through a `dbService` that suite never
        inits; it stubs `setHash`, being about the lock state alone.
      Then a second round, for what only the browser showed: `npm test` opens
      a fresh profile every run, but a page reloaded in a real browser keeps
      the database, and the `sync db` ids - 1 to 5, written out - climb with
      each run, since `clear()` leaves the key generator alone. Reproduced by
      loading the page three times in one browser session: 7 specs fail on the
      second load, one of them as a bare timeout, being a unique index
      violation nobody handled. So `test/main.js` now deletes the database in
      a root `beforeAll`, which also covers a leftover schema from an older
      build, and reports Q's unhandled reasons in a root `afterEach`, so a
      rejection names its spec instead of reading as a 5 s hang. An app tab on
      the same origin blocks the delete - see the task below - and that is
      reported at once rather than waited out. Verified: three loads in one
      session green, `npm test` green, and the blocked case failing
      immediately with the tab to close named on the page.
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
- [ ] Close the database connection on `versionchange`. `dbService.init()`
      opens `db` and holds the connection for the life of the page, with no
      `onversionchange` handler on it and no `onblocked` on the open request.
      So one tab of the app blocks every schema change for the others: the day
      `init()` opens version 2, a tab still on version 1 keeps
      `onupgradeneeded` from firing, and the new tab hangs - `open()` neither
      succeeds nor errors, so `init()`'s promise never settles and the app
      shows an empty diary rather than a message. The same wall is what the
      test page meets today, which is how this surfaced: it deletes the
      database before running and an app tab on the origin blocks that. The
      common case is two lines - `newDb.onversionchange = function () {
      newDb.close(); };` - but the tab whose connection just closed cannot
      read or write any more, so decide what it should do: reload itself,
      or tell the user to.
- [x] ~~Keep the version in a single place~~ — done 2026-08-13, and the
      version went to **3.0.0** with it. `package.json` is now the only place
      it is written: `vite.config.js` reads it and `define`s
      `__APP_VERSION__`, `www/environment.js` exports it beside
      `isDevelopment`, and `bannerCtrl` puts it on the scope next to the `dev`
      flag, the banner reading `v{{version}}` - the template is a raw string
      and can no more see the constant than the module. The dev server shows
      the same version, and that is not the `define` substitution: Vite runs
      it only in a build (`if (!ssr && !isBuild) return` in `vite:define`),
      while in development the value arrives as a global that the injected
      Vite client sets, in `/@vite/env`, before any app module runs. Either
      way `environment.js` reads one name, so `.jshintrc` declares it a
      global. `checklist.version` is down to `npm version <type>`: the manual
      banner edit is gone and the `site.manifest` it also listed went with
      AppCache. Verified by lint, build, `npm test` (39 specs, 0 failures),
      and reading the banner in headless Firefox off both a dev server and
      `npm run preview` - `v3.0.0` in both, with the ` dev` suffix on
      `localhost:3000` as before.
- [ ] Replace `font-awesome` 4.7.0. It is unmaintained - 4.7.0 is from October
      2016 and the project moved on to Font Awesome 5/6 under a different
      package and a different licence - and its `fontawesome-webfont.woff2`
      ships a bad `glyf` bounding box, which Firefox reports on every load:
      "downloadable font: glyf: Glyph bbox was incorrect; adjusting (glyph
      691)". Harmless in itself, the font renders fine once Firefox recomputes
      the box, but it is a dead dependency serving five icons: `fa-spinner`
      with `fa-spin` (viewer, settings x2, dropbox x3), `fa-chevron-left` and
      `fa-chevron-right` and `fa-plus` (records), `fa-bars` (banner).
      `bootstrap-icons` covers all five - `bi-arrow-repeat`,
      `bi-chevron-left`/`right`, `bi-plus`, `bi-list` - and is the natural
      match now that bootstrap is 5.3.8, though it has no animation helper, so
      `fa-spin` needs a keyframes rule in `site.css`. Inline SVG is the other
      option and would drop the web font altogether. Note `sw.js` precaches
      the `?v=4.7.0` font URLs through `ignoreSearch`; check what that list
      turns into.
- [x] ~~Record which device an entry was written on~~ — done 2026-08-19.
      A `device` string on the record, stamped once at creation and never
      touched again: `editorCtrl` rebuilds a record field by field on every
      save and `dbService.syncRecord` does the same when merging a newer
      copy, so both had to carry it over explicitly or the first edit or
      sync would have dropped it. The merge keeps the local answer and takes
      the incoming one only where there is none, which backfills records made
      before the field. No schema change - the store is schemaless and the
      field is not indexed, so the database stays at version 1 - and records
      without it stay without it, the viewer showing "written on X - last
      updated on ..." only when there is an X. The value is unencrypted, in
      the database as in the Dropbox export, which is a deliberate choice:
      only `text` is secret.
      The name comes from `www/deviceService.js`. No browser gives away the
      machine it runs on - `location.hostname` is the server - so it reads
      the user agent: platform plus browser ("Linux Firefox"), the Chromium
      client hints where they exist, and their `model` for the one case a
      browser comes near a real device name ("Pixel 8 Chrome"). It names a
      browser profile rather than a machine, which is where the diary lives
      anyway. `runApp` seeds it into settings on the first run - it has to
      hold still across loads - and Settings has a "Device name" field.
      One thing this uncovered: `settingsService.init` replaced the whole
      settings object with what was stored, so every setting added from here
      on would read as undefined for anyone who already had a diary. It
      merges over the defaults now.
      Verified by lint, build and `npm test` (42 specs, 0 failures - three
      new ones in `sync-db-spec` for the merge), by driving `deviceService`
      in node over recorded user agents from eight browser/platform pairs
      with and without client hints, and by 20 checks against the real app in
      headless Firefox: first run seeds and persists a name, a new record
      carries it, the viewer shows it, an edit does not drop it, a rename in
      Settings survives a reload and only later records take it - and, on
      the upgrade path, a diary whose settings predate the field gets a name
      without losing its other settings, while its records keep no device
      through both viewing and editing.
- [x] ~~Sync a single year only~~ - done 2026-08-22. A `syncYear` setting
      names the one year the sync is limited to, empty meaning all of them,
      which is what the sync did before and what a complete sync goes back
      to. `syncService.filesToImport` and `yearsToExport` take the year as an
      optional third argument and filter ahead of the status comparison, so a
      year left out is left out whatever its status says - its file is
      neither read nor written; both callers read the setting at every sync
      through `syncService.syncYear()`, so a change takes effect without a
      reload. Settings holds the choice - a checkbox plus a year, offering
      the current one - saved by its own Save with the rest of the settings,
      which is what makes it hold for the following syncs; the two controls
      are folded back into the one setting on save, so an edit left unsaved
      changes nothing. The Dropbox view only says which years the next sync
      covers, off the live settings object, so a change in Settings shows
      there without a reload. It started out in the Dropbox view, saved by
      `autoSync` - moved on request 2026-08-23.
      No schema change; a diary whose settings predate the field reads it as
      empty and keeps syncing every year.
      The year is a number on the scope and a string everywhere else. That
      cost a round: `<input type="number">` rejects a string model with
      `ngModel:numfmt` and renders *empty*, so the field came up blank with
      the checkbox on - and the button, disabled while the year is blank,
      came up dead with it. Caught only by driving the view; nothing in the
      services or the specs sees it.
      Verified by lint, build and `npm test` (48 specs, 0 failures - six new
      ones in `sync-service-spec` for the filtering), and by 37 checks
      against the real app in headless Firefox with the Dropbox client
      stubbed and everything else the app's own: a complete sync reading and
      writing every year, an unsaved choice leaving the sync alone, a single
      year sync touching one file only, the choice reaching the database and
      coming back after a reload - in both views as much as in the sync - a
      chosen year with nothing on either side passing quietly, Save refused
      while the box is on and the year blank, clearing the box going back to
      a complete sync, and a diary whose stored settings predate the field
      syncing every year and keeping its other settings.
- [x] ~~Refresh the Dropbox access token in the background~~ - done
      2026-08-28. The Dropbox view used to open on "Preparing Dropbox
      service..." and hold the buttons back until the token refresh returned.
      `runApp` now starts that refresh itself, 7 seconds after load and
      whichever page is open, so by the time the view is asked for the wait
      is usually over. The progress moved from `dropboxCtrl` into
      `dropboxService` - `isPreparing()` and `isReady()` - since two places
      show it now; the view binds to the service instead of its own flag.
      `prepareDropbox` keeps the in-flight promise and hands it to later
      callers, so the view joins the background refresh rather than starting
      a second one, and drops it once settled, so a call after the token
      expires refreshes again - on a still valid token the SDK makes no
      request at all. It resolves through `$q` and not the SDK's native
      promise, so the flags reach the templates in the digest they change in,
      and a re-check of a ready service leaves `isPreparing()` off, keeping
      the banner still.
      The banner carries the sign, next to the version: a spinner while the
      refresh runs, the Dropbox mark when the service is ready, nothing
      before it starts, without a login, or after a failure. A background
      failure - no network being the usual one - only goes to the console:
      the Dropbox view reports it when the user actually asks for Dropbox,
      as it did before.
      Verified by lint, build and `npm test` (48 specs, 0 failures), and by
      26 checks against the real app in headless Firefox with the Dropbox
      HTTP calls stubbed and everything else the app's own: no sign and no
      request without a login, the spinner giving way to the mark on a
      successful refresh, the view opened afterwards showing its buttons at
      once with no second request and reading the account off the prepared
      client, the view opened during the refresh waiting and then filling in
      on the same single request, and a failing refresh leaving the banner
      empty, logging to the console, and reporting itself on the view.
