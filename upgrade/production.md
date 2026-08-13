# Production deployment (GitHub Pages)

Deployed at <https://barahilia.github.io/dayary/#/>, served from the
`gh-pages` branch. There is no production server - GitHub Pages only
hands out static files.

## `npm run build` produces a static directory

`dist/`, plain files, no runtime needed:

```
dist/index.html
dist/assets/main-<hash>.js          whole app, bundled + minified
dist/assets/main-<hash>.css         bootstrap + font-awesome + site.css
dist/assets/auth-<hash>.js          shared Dropbox chunk
dist/assets/dropboxLogin-<hash>.js
dist/assets/*.woff|woff2|ttf|eot|svg|png|ico
dist/www/login/dropbox.html
```

## Why it works under the project path

**Relative asset URLs.** `base: './'` in `vite.config.js` makes every
reference relative - `dist/index.html` emits `./assets/main-<hash>.js`,
resolving to `/dayary/assets/...`. The same build also works at a domain
root.

**Hash routing.** ui-router still uses `#/` URLs, so
`https://barahilia.github.io/dayary/#/` is a single real request for
`index.html`. No rewrite rules are needed, and the usual GitHub Pages
SPA 404 problem does not arise.

**Login entry point keeps its path.** Vite preserves the entry path, so
the login page stays at `dist/www/login/dropbox.html`. The redirect URI
registered in the Dropbox app console,
`https://barahilia.github.io/dayary/www/login/dropbox.html`, keeps
matching.

## OAuth redirect is derived at runtime

`www/login/dropbox.js` used to hardcode the redirect URI, so `master`
carried the localhost value and `gh-pages` a hand-edited production one.
That stopped being workable once Vite bundled the file into a hashed
asset - the deployed copy can no longer be patched by hand.

Both values are now computed from the page's own URL:

```js
var redirectUrl = window.location.origin + window.location.pathname;
var appUrl = redirectUrl.replace(/www\/login\/dropbox\.html$/, '');
```

The script only ever runs on the login page, so its own URL *is* the
redirect URI, exact in both environments. One build now serves local
development and production alike; no edit before deploying.

Two consequences worth remembering:

* Both URIs must be registered in the Dropbox app console - the
  production one and `http://localhost:3000/www/login/dropbox.html`.
  Dropbox matches verbatim.
* Locally, browse **`localhost:3000`**, not `127.0.0.1:3000`. The
  redirect URI now follows whichever host is in the address bar, and
  Dropbox will reject a host it has not been given.

## Publishing

What gets published changed shape. Until 3.0.0 `gh-pages` mirrored the
old source tree - `external/`, individual `www/*.js`, `bower.json`,
`site.manifest` - and a release was a merge of `master` into it. That
workflow is gone: from now on the *contents of* `dist/` go at the branch
root, and the old files must be **deleted**, not merely overwritten, or a
stale half-app is left sitting beside the new one.

`dist/` is in `.gitignore`, so the deploy step has to force-add it or
publish from a separate worktree. The runbook below takes the worktree
route, which leaves the `master` checkout untouched.

A `.nojekyll` file at the branch root is insurance: GitHub Pages runs
Jekyll, which ignores paths starting with `_`. Vite's hashed asset names
do not start with underscores, so this has never bitten, but the file
costs nothing.

## What carries over from the deployed version

Checked before the 2.1.3 to 3.0.0 deploy, and worth re-checking whenever
one of these moves:

* **Stored diaries.** Production was already IndexedDB, not Web SQL:
  both trees open `db` at version 1 with the same stores - `hash`,
  `settings`, `sync`, `records` - and the same unique `created` index.
  Nothing triggers `onupgradeneeded`, so the data is simply there.
* **Stored ciphertext.** crypto-js 4.2.0 keeps the 3.x wire format,
  OpenSSL `Salted__` + AES-256-CBC.
* **The Dropbox refresh token**, which lives in `localStorage` on an
  origin that does not change.
* **The redirect URI**, see above - Vite keeps the login page at
  `www/login/dropbox.html`.
* **Deep links.** Hash routing, so no 404 rewrite rules to lose.
* **No custom domain.** There is no `CNAME` on `gh-pages`, so wiping the
  branch loses nothing that has to be put back.

## Release runbook

### 1. Pre-flight on `master`

```sh
git status                 # clean, on master, nothing unpushed
npm ci
npm run lint
npm test                   # 39 specs, 0 failures
npm run build
npm run preview            # serves dist/ on http://localhost:4173
```

Then walk the whole app in the browser: unlock, list, view, edit, create,
delete, years, settings, and the banner reading `v<version>` with no
`dev` marker. Offline works only here and in production, never on the dev
server, so switch the dev tools to offline and reload.

`localhost:4173` is a different origin from `localhost:3000`, so it has
its own empty diary - convenient, but it means the Dropbox flow needs
`http://localhost:4173/www/login/dropbox.html` registered in the app
console before it will run. Testing Dropbox on the dev server instead is
the same code path.

### 2. Back up the live diary

Open the *current* production site, unlock, and export all years to
Dropbox. The data checks above say this is not needed; do it anyway,
because it is the only step that makes a bad deploy recoverable for the
records themselves.

### 3. Note the rollback point

```sh
git fetch origin
git rev-parse origin/gh-pages     # write it down
```

### 4. Tag the release

Every release has a tag - `v2.1.3` was the last of the old series.

```sh
git tag -a v3.0.0 -m "3.0.0"
git push origin v3.0.0
```

### 5. Publish `dist/` to `gh-pages`

```sh
npm run build                        # the build just tested, in dist/

git worktree add ../dayary-gh-pages gh-pages
cd ../dayary-gh-pages
git merge --ff-only origin/gh-pages  # local branch up to date

git rm -rq .                         # delete the previous deploy entirely
cp -r ../dayary/dist/. .
touch .nojekyll

git status                           # review before committing
git add -A
git commit -m "Deploy 3.0.0"
git push origin gh-pages

cd ../dayary
git worktree remove ../dayary-gh-pages
```

The tree that lands is the build plus `.nojekyll` - `index.html`,
`sw.js`, `assets/`, `www/login/dropbox.html` - and nothing else. Before
pushing, check that `sw.js`'s `PRECACHE` names the hashed files actually
present in `assets/`: the plugin generates the list at build time, so a
mismatch means a stale `dist/` was copied.

### 6. Verify production

Pages takes a minute or two to build, and serves assets with
`Cache-Control: max-age=600`, so allow ten minutes for a consistent view.

* Hard-reload the site; the banner reads the new version, no `dev`.
* Dev tools, Application: one activated worker from `/dayary/sw.js`, and
  a `dayary-<revision>` cache beside it.
* Unlock with the real passphrase and open an old record - the live
  check that the current crypto-js reads existing data.
* Run a Dropbox sync.
* Go offline and reload.

### 7. Rollback

A force push of the previous commit is **not enough on its own** once a
service worker has been deployed. The worker is registered against the
origin, serves cache-first, and removing `sw.js` from the branch does not
unregister it - those browsers would keep the rolled-back version
forever. The rollback has to ship a kill switch at the branch root:

```js
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys()
            .then(function (keys) {
                return Promise.all(keys.map(function (key) {
                    return caches.delete(key);
                }));
            })
            .then(function () { return self.registration.unregister(); })
            .then(function () { return clients.matchAll(); })
            .then(function (cs) {
                cs.forEach(function (c) { c.navigate(c.url); });
            })
    );
});
```

Browsers re-fetch `sw.js` on navigation and at least daily, so this
reaches everyone within the ten minute cache window. The same file is
what to deploy if the app ever stops using a service worker at all.

## AppCache is gone

The old `gh-pages` `index.html` carried `manifest="site.manifest"`; the
new one does not, and no `site.manifest` exists in the tree - the
intended drop from the Vite commit. AppCache has been removed from Chrome
and Firefox, so returning visitors hit no stale-cache trap; the deploy
also 404s the manifest, which obsoletes any cache a surviving browser
still holds. Offline support is the service worker's now, see README.
