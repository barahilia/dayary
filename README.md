# Dayary

Dayary is a dairy tool that runs in a web app, ecrypts records and allows to
sync them with a cloud storage.

To use it simply browse https://barahilia.github.io/dayary in Chrome or Safary.

All the records are storred locally, encrypted before save and decrypted at
viewing or editing only. [Dropbox](https://www.dropbox.com/) can be used for
backup and restore of encrypted records.

## Other dairy tools

There are other dairy tools I had used or considered to use before deciding to
build something different. Here are them:
* [Word](https://products.office.com/en-us/word) from MS Office, [Writer](https://www.libreoffice.org/discover/writer/) from LibreOffice or any other word processor
* Blogging platforms like [Wordpress](https://wordpress.com/) or [Jekyll](http://jekyllrb.com/)
* [Moment Diary](http://www.utagoe.com/en/) app for iPad and Android
* Dairy services online and apps for iOS and Android

## Features

And here are what I needed from the dairy tool and haven't found in the existing ones:
* Multiplatform - ability to read and write the diary at least on PC, iOS and Android devices
* Autosaving and autobackup to a cloud storage
* Security - records must be encrypted with strong security locally and decrypted only at the user access time
* Data organization as entries with convenient and accessible view for all the entries
* Convertion - ability to import and export entries with the other tools
* Lockable workspace
* Customisable - ability to add features
* Offline work - availability without network access and ability to sync

## Architecture

The tool is an HTML 5 web app loaded by and running in a browser.
[AngularJS](https://angularjs.org/) framework is used to build the presentation
and business logic layers.
[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
serves for the local data layer. [Dropbox](https://www.dropbox.com) was chosen
for external data storage in the cloud.

Sources are ES modules bundled by [Vite](https://vitejs.dev/), with all
dependencies coming from npm. The view templates are bundled as strings rather
than fetched at runtime.

The application to be served by any hosting, I chose for GitHub Pages. Assets
are referenced by relative paths, so the build works both under the project
path and at a domain root.

Offline work is provided by a service worker, replacing the AppCache manifest
that browsers no longer support. `www/sw.js` is copied to the build root by
`tools/viteServiceWorker.js`, which fills in the list of files Vite has just
emitted and a revision hashed from their content - so the cached set can never
drift from the build the way a hand-written manifest did. The worker precaches
the whole app on install and then serves it cache-first; requests to other
origins, the Dropbox API above all, always go to the network. A new build has a
new revision, hence a new cache, which installs and takes over immediately,
dropping the previous one.

## Design

The main unit of work is dairy `record`:
```
{
    id: Number, internal identificator
    created: Datetime, creation time and visual and sync identificator
    updated: Datetime, last update time, to sync the latest udpate
    text: String, encrypted textual entry
    device: String, where the record was written; optional
}
```
Both datetimes are ISO 8601 strings with the local UTC offset, like
`2026-08-08T11:35:57+03:00`. `created` is also the IndexedDB index key
that monthly and yearly views range over, and such keys compare as
plain strings - so the format must stay fixed width. The local offset
keeps an entry on the day its author lived it.

`device` is stamped once, when the record is written, and no later edit
or sync touches it - it answers where an entry was made, not where it
was last opened. Records written before the field existed simply have
none, and the viewer then says nothing about it. The name itself is a
setting, so it is one per browser profile rather than per record; the
first run guesses it and the user renames it in Settings. Note it is
stored and exported in clear text: only `text` is encrypted.

Nothing in a browser names the machine it runs on - `location.hostname`
is the server, identical everywhere - so the guess in
`www/deviceService.js` comes from the user agent: the platform and the
browser, as "Linux Firefox", plus the phone's own model where Chromium's
client hints give one, as "Pixel 8 Chrome". That names a browser profile
and not a device, which is where a diary lives anyway, each profile
having its own IndexedDB.

AES-256 algorithm is used for encryption. A passphrase is saved for
the session time to decrypt existing and encrypt updated records.
Decrypted text is only shown to the user. Database has only encrypted
text. A SHA-256 hash of the passphrase is presisted to guide the user
against the incorrect and inconsistent passphrase. A workspace is
locked after timeout and other conditions; this erases local copy of
the passphrase.

Encryption is **crypto-js**, in its OpenSSL compatible form: each record
is a fresh random salt, an AES-256-CBC ciphertext and the `Salted__`
header, all base64. The format is fixed by the records already stored
locally and in Dropbox, so any future change to it has to keep reading
the old one. Note the weak point of that format: the key comes from the
passphrase through `EvpKDF`, which is MD5 with a single iteration, and
nothing authenticates the ciphertext - a wrong passphrase is noticed
only by the plaintext failing to decode as UTF-8. Both are on the
upgrade list.

Views are organazed into states with **ui-router**, the maintained
`@uirouter/angularjs` 1.x. The main state shows a list of records and
allows to read and edit a record. The lock guard is a transition hook -
`$transitions.onStart` returning a target state - since the 0.2.x
`$stateChangeStart` event no longer exists.

The look is **bootstrap** 5, its CSS only - no bootstrap JavaScript and no
jQuery are loaded, as the app uses none of the JavaScript components. Coming
from bootstrap 3 the class names moved: `pull-right` to `float-end`, `.close`
to `.btn-close`, `.btn-block` to `.w-100`, `hidden-xs` and `visible-xs-block`
to the `d-*` display utilities, and the pale `bg-success`/`bg-danger`
highlights to `bg-success-subtle`/`bg-danger-subtle`, which is what 5.3 gives
that role to. The grid prefixes shifted by one - `xs` to none, `sm` to `md`,
`md` to `lg` - because bootstrap 5 has a breakpoint below the old `sm`; the
shift keeps every layout switching at the same pixel width as before. Columns
are flex children of `.row` in bootstrap 5, so the `row` class sits on the
`<ui-view>` element that state templates are filled into - see the root state
in `configApp` - rather than on a wrapper in `index.html`; the floats of
bootstrap 3 did not mind an element in between.

The development page is marked as such, since it is the same app as the
production one and with both open in a browser they are indistinguishable -
while their diaries are entirely separate, IndexedDB being per origin, so an
entry written into the wrong one is quietly lost.

`tools/viteDevMarker.js` marks it, being a `apply: 'serve'` plugin and so
running for the dev server and never for a build. It appends `dev` to the tab
title, drops every icon `index.html` declares and puts an amber one it serves
at `/dev-favicon.svg` in their place, and adds a `dev` class to `<body>`, off
which `site.css` greys the page background. Only `index.html` is transformed,
leaving the Dropbox login and the test pages alone.

Marking the page from the server, rather than having the app do it to itself
at load, is what the favicon costs. A browser starts fetching the icons a page
declares while it parses it and picks among all of them; a script that removes
those links afterwards and adds its own is racing the icon loader, and firefox
flapped between the new icon, the aborted old one - `NS_BINDING_ABORTED` on
`favicon.ico` - and the default `/favicon.ico` it falls back to when a page
declares none. HTML that names the right icon to begin with has nothing to
race. The icon carries an explicit width and height too: a `viewBox` alone
gives no intrinsic size, and a favicon of no size is rasterized
inconsistently.

The banner turns amber and writes `dev` next to the version, both from a flag
`bannerCtrl` puts on the scope - the template is a bundled raw string and
cannot read a module itself. That flag is `www/environment.js`, which knows
the development page by its host, `localhost:3000`, the port `strictPort` in
`vite.config.js` holds fixed for the Dropbox redirect. A preview or a
production build is marked in neither way.

The version next to it is written by hand in one place, `package.json`.
`vite.config.js` reads it from there and `define`s it as `__APP_VERSION__`,
which `www/environment.js` exports and `bannerCtrl` puts on the scope beside
the dev flag - the template being a raw string, it can no more read the
constant than it can the module. Vite's `define` reaches the dev server too,
by a different route: the substitution itself happens only in a build, and in
development the value arrives as a global the injected Vite client sets before
any of the app's modules run. So the dev page shows the same version as the
site, with `dev` after it. Releasing is `npm version <type>` and nothing else,
which is all `checklist.version` has left in it; the service worker's cache
name is a hash of the built files rather than the version, so it changes on
its own.

Backup and sync are done with Dropbox. Records are split to yearly
chunks and saved to JSON files to allow for relatively small units
for faster upload and download.

The sync covers every year by default. Settings also offers to limit it to
a single year - the current one unless another is typed in - which is the
year a running diary keeps writing to, so the other files are neither
downloaded nor uploaded. The choice is a setting of its own, `syncYear`,
saved with the rest of them: it holds for the following syncs on that
device until the checkbox is cleared and a complete sync is chosen again,
and an empty setting means all the years. The Dropbox view only says which
years the next sync will cover.

The Dropbox client is the official **dropbox** JS SDK, v10 - still the
current major line. Login is OAuth 2 with PKCE on a page of its own,
`www/login/dropbox.html`, which is also its own redirect URI; it keeps
the code verifier in `sessionStorage` for the one hop to Dropbox and
back, then stores the returned refresh token in `localStorage`. The app
itself never sees a long lived access token - `prepareDropbox` trades
the refresh token for a fresh one, which takes a network round trip.
`runApp` starts that trade in the background a few seconds after the app
loads, whichever page is open, so the Dropbox view usually finds the
service ready instead of making the user wait for it; the view asks for
it as well, joining the same refresh when one is still in flight.
`dropboxService` keeps the progress, and the banner shows it in small: a
spinner while the refresh runs, the Dropbox mark once the service can be
used, and nothing when there is no login or the refresh failed - a
failure in the background only goes to the console, the Dropbox view
being the place that reports it. Downloads come back as a `fileBlob`,
which is why `readFile` goes through a `FileReader`.

## Development

Start with:
```sh
cd dayary
npm install
npm start
```
Node 22.12 or newer is needed. The Dropbox SDK requires Node 22, having
dropped `node-fetch` for the platform `fetch`; Vite raises the bar to the
22.12 point release.

Then navigate to http://localhost:3000 in the browser. The choice of port,
3000 is deliberate, as Dropbox will redirect back to this address after
authentication - so the dev server refuses to start on any other port rather
than quietly moving to a free one.

To produce and check a production build:
```sh
npm run build     # writes dist/
npm run preview   # serves dist/
npm run lint
```
The service worker is only built into and registered by the production build -
in development Vite serves modules that must not be cached. So offline work is
to be checked under `npm run preview`, switching the browser or its dev tools
to offline once the page has loaded.

Tests are jasmine specs run in a real browser. To run them automatically:
```sh
npm test
```
`tools/runTests.js` starts a Vite server of its own, opens `test/jasmine.html`
in a headless Firefox over WebDriver, prints what the jasmine reporter put on
the page and exits non-zero unless everything passed. It needs Firefox and
`geckodriver` on the system - the Mozilla Firefox snap ships both. The real
Firefox binary is located by probing the usual paths, because on a snap install
`/usr/bin/firefox` is a shell wrapper that geckodriver refuses to launch; set
`FIREFOX_BIN` to override the probe.

The test server takes a port of its own rather than the 3000 that `npm start`
uses, so the two can run side by side; tests need no Dropbox redirect. The same
page can still be opened by hand at http://localhost:3000/test/jasmine.html
with `npm start` running, and that remains the way to debug a single spec.

The `db service` and `sync db` suites are sequences - each spec leaves the
database in the state the next one expects - so `test/main.js` turns jasmine's
spec randomization off. It also deletes the `db` database before anything runs.
The suites do empty it themselves, but `clear()` never resets a store's key
generator, and the record ids are part of what the specs pin down: `npm test`
sees them start at 1 because every run gets a fresh browser profile, while a
browser you reload the page in keeps the database and the ids climb. That
delete drops whatever diary is stored on the origin the tests are served from,
as emptying it always did - and it cannot proceed while another tab holds the
database open, so close the app before running the suite by hand; the page says
as much instead of waiting. Records in `db service` still take the ids that
follow the suite before it, and it remembers them rather than assuming.

Two jasmine habits to keep when writing specs here. `done` takes any argument
as a failure, so a chain ending on a promise that resolves with a value needs
`.then(function () { done(); })`, not `.then(done)`. And a rejection nothing
handles surfaces only as a 5 s timeout naming no cause, which is why
`test/main.js` reports Q's unhandled reasons after every spec.

## Powered by

The tool was built with the help of the following wonderful:
* Services: GitHub (including GitHub Pages), Dropbox
* Tools: Chrome, Firefox, npm, Vite, jshint, selenium-webdriver
* Frameworks: Angular.js, Jasmine.js, node.js
* Libraries: bootstrap, font-awesome, ui-router, date-fns, dropbox.js, crypto-js

