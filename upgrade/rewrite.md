# Prompt: plan the rewrite of Dayary

This file is the whole brief. The repository it sits in is empty on purpose -
there is no code to read yet. Everything you need to know about the existing
application is summarised below.

---

## Task

Design a ground-up rewrite of **Dayary**, a personal diary that runs entirely
in the browser. Produce an architecture and technology plan: the shape of the
application, the layers it splits into, and the frameworks and libraries it is
built from. Write the plan to `plan.md` next to this file. Do not write
application code in this session.

## What Dayary is

A single-user diary as a static web app. The user writes dated entries, they
are encrypted in the browser with a passphrase, they are stored locally so the
app works with no network, and they are synced to the user's own Dropbox for
backup and for moving between devices - a phone, a tablet and a desktop. There
is no server anywhere in the picture: the app is static files on a static host
and it talks to Dropbox directly.

It exists, is in daily use, and holds years of real entries. The current
implementation is an AngularJS 1.x application kept alive well past that
framework's end of life, incrementally patched onto IndexedDB, a service
worker and Vite. It works, but the foundation is dead and the point of the
rewrite is to stop carrying it.

## The existing implementation, in brief

This is background - what the app does today and what its data looks like.
Treat it as a description of the problem, not as a design to reproduce.

**Stack today:** AngularJS 1.8 with ui-router for views, IndexedDB for local
storage, a hand-written service worker for offline, crypto-js for encryption,
the official Dropbox JS SDK v10, Bootstrap 5 CSS, Vite for the build, jasmine
specs driven through WebDriver in a real browser, hosted on GitHub Pages.

**The record** is the unit of work:

```
{
    id:      Number,   internal identifier
    created: Datetime, creation time - the visual and sync identity
    updated: Datetime, last update time, used to pick the newer copy
    text:    String,   the encrypted entry
}
```

Both datetimes are ISO 8601 strings carrying the local UTC offset, such as
`2026-08-08T11:35:57+03:00`. `created` doubles as the sort and index key that
the monthly and yearly views range over, and such keys compare as plain
strings - so the format is fixed width and must stay that way. The local
offset is deliberate: it keeps an entry on the day its author lived it.

**Encryption** is AES-256 under a passphrase held only for the session. Stored
text is always ciphertext; plaintext exists only while the user reads or
writes an entry. A SHA-256 hash of the passphrase is persisted so the user can
be warned about a wrong or inconsistent one. The workspace locks on a timeout
and the local copy of the passphrase is erased.

The concrete format is crypto-js in its OpenSSL-compatible form: per record a
fresh random salt, AES-256-CBC ciphertext and the `Salted__` header, all
base64. It has two known weaknesses, both on the list to fix: the key comes
from the passphrase through `EvpKDF`, which is MD5 with a single iteration,
and nothing authenticates the ciphertext, so a wrong passphrase shows up only
as plaintext that fails to decode as UTF-8.

**Dropbox** holds the encrypted records split into yearly JSON files, so a
sync moves reasonably small units rather than one growing blob. Login is
OAuth 2 with PKCE on a small page of its own that doubles as the redirect
URI; the code verifier lives in `sessionStorage` for the one hop out and back
and the returned refresh token in `localStorage`. The app never holds a
long-lived access token - it trades the refresh token for a fresh access
token when it needs one.

**Offline** is a service worker that precaches the whole app on install and
then serves it cache-first, with the cache name derived from a hash of the
built files so a new build can never be served from an old cache. Requests to
other origins, Dropbox above all, always go to the network.

## Features to aim at

Do not design these in detail - the feature set will be specified later, one
at a time, on top of whatever architecture this plan settles. They are here so
the plan aims at real work rather than at an abstraction.

The app is a banner with the product name and version, an area for errors and
notifications, and a small set of top-level areas reachable from it. On a
narrow screen those become a menu behind a button; on a wide one they sit in a
row. All of them but the lock are hidden while the workspace is locked.

- **Records** - the diary itself: entries grouped by year and by month, with
  a view of a single entry and an editor for it. Creating, reading, editing.
  This is where the user spends effectively all of their time.
- **Years** - a higher-level index over the same entries, for reaching a
  distant year without scrolling through everything in between.
- **Dropbox** - connecting the account, choosing the directory the diary
  lives in, and running the sync in both directions.
- **Settings** - passphrase, lock timeout, and the like.
- **Lock** - drops the passphrase and hides everything until it is entered
  again.

Two things about scale to keep in mind. The number of entries only grows -
years of daily writing - so the views must page or range over the store
rather than load everything, and the sync must move only what changed. And
the Dropbox side is a directory of many files, chosen by the user, not a
single document.

## Hard constraints

These are not open questions. Any proposal must satisfy them:

- **Serverless.** Static files only, no backend of our own, no server-side
  state, no secrets that need a server to stay secret. Hosting is a static
  host - GitHub Pages today.
- **Encryption.** Records are encrypted locally with a user passphrase.
  Plaintext exists only in memory while the user is reading or writing it,
  never at rest, never in the cloud.
- **Local storage and offline work.** The diary lives in the browser and is
  fully usable with no network at all - reading, writing and searching.
- **Dropbox as the main cloud storage.** Sync and backup go to the user's own
  Dropbox account, browser to Dropbox directly, with no intermediary.
- **Existing diaries must survive.** There is real data in browsers and in
  Dropbox, in the shapes described above. State how it is read, migrated or
  converted; a plan that silently strands it is not acceptable.
- **Mobile is a first-class target, not a scaled-down desktop view.** A phone
  is where a good part of the writing happens. Every area of the app has to
  be usable one-handed on a small screen - reading, navigating between years
  and months, and above all writing an entry with a soft keyboard up. The
  app must also install to the home screen and run from there like any other
  app on the device.
- **Browsers: current Firefox and current Chrome, on desktop and on Android.**
  Those two are what gets supported and tested. Other modern browsers are
  welcome to work and none of them is a design input - do not spend
  complexity, polyfills or format compromises on anything outside those two,
  and say so explicitly if a recommendation is cheaper because of it.

## Out of scope

No feature design. No screen-by-screen UI. No data model beyond what the
constraints force. No task breakdown of individual features. Keep the plan at
the level where it constrains those later decisions and no lower.

## Decisions the plan must make

For each one, give the realistic options, the trade-offs that matter for this
project, and a single recommendation. Where a choice is genuinely close, say
so and name what would break the tie.

- **UI framework** and, with it, the language (plain JS or TypeScript),
  routing, and how state is held.
- **Build and tooling** - bundler, dev server, linting, formatting.
- **Local persistence** - the storage API and whether a wrapper library
  earns its place; how encrypted records are indexed so the year and month
  views stay fast as the diary grows.
- **Cryptography** - what does the encrypting, whether to stay on the current
  OpenSSL-compatible crypto-js format or move to authenticated encryption
  with a modern KDF, and how existing records are handled either way.
- **Offline and installability** - service worker strategy, whether to lean
  on a framework's PWA tooling or keep hand-written control, and how cache
  versioning stays tied to the build. Installability means a real one: a web
  app manifest, icons, standalone display, and the app launching from an
  Android home screen with no network at all.
- **Dropbox integration** - SDK choice, the OAuth flow that works without a
  server, where tokens live, how the diary directory is chosen and
  remembered, and what the sync model is: file granularity, change
  detection, conflict resolution, and what happens when two devices edit
  while offline.
- **Styling and layout** - CSS framework or none, icons, theming, and the
  responsive strategy: how one layout serves a phone and a desktop, what the
  navigation collapses into on a narrow screen, touch target sizes, and what
  the editor does when a soft keyboard takes half the viewport.
- **Testing** - what runs in a real browser, what runs headless, and how
  crypto and sync are covered.
- **Deployment** - how a build reaches the static host, versioning, and how
  a development build stays distinguishable from production. The two are the
  same app on different origins with separate diaries, and confusing them
  loses entries.

## What matters when choosing

- **Longevity.** This project was burned once by betting on a framework that
  went end of life. Prefer mature, widely used, actively maintained tools
  over new and clever ones. Few dependencies beat many.
- **A single part-time maintainer.** Complexity is paid for out of the same
  budget as features. Anything the plan adds has to be worth carrying alone
  for years.
- **The data outlives the app.** Storage and encryption formats are the
  hardest things to change later; give them more thought than the UI.
- **Verify, don't recall.** Check the current state of every library and
  framework you propose - latest version, maintenance activity, browser
  support - rather than relying on what you remember about it.

## Deliverable

`plan.md`, holding:

1. A short statement of the target architecture - the layers and how they
   talk to each other.
2. The decisions above, each with options, trade-offs and a recommendation.
3. One recommended stack, listed plainly, so it can be read at a glance.
4. The migration story for existing data.
5. Risks and open questions that need my input before implementation starts.
6. A coarse phasing - what has to exist before anything else can, and where
   the first working end-to-end slice is. Not a task list.

Keep lines under 80 characters, 87 at the very most. Ask me about anything
where two readings would lead to materially different plans, rather than
guessing.
