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

What gets published changed shape. `gh-pages` still mirrors the old
source tree - `external/`, individual `www/*.js`, `bower.json`,
`site.manifest`. From now on the *contents of* `dist/` go at the branch
root, and the old files must be **deleted**, not merely overwritten, or a
stale half-app is left sitting beside the new one.

`dist/` is in `.gitignore`, so the deploy step has to force-add it or
publish from a separate worktree.

A `.nojekyll` file at the branch root is optional insurance: GitHub Pages
runs Jekyll, which ignores paths starting with `_`. Vite's hashed asset
names do not start with underscores, so this is not currently a problem.

## AppCache is gone

The old `gh-pages` `index.html` carried `manifest="site.manifest"`; the
new one does not, and no `site.manifest` exists in the tree - the
intended drop from the Vite commit. AppCache has been removed from Chrome
and Firefox, so returning visitors hit no stale-cache trap. It does mean
no offline support until the Service Worker task lands.
