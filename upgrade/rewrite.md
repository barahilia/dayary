# Prompt: plan the rewrite

Use the text below as the prompt for the planning session. It is meant to
produce a design, not code.

---

## Task

Design a ground-up rewrite of **Dayary**, a personal diary that runs entirely
in the browser. Produce an architecture and technology plan: the shape of the
application, the layers it splits into, and the frameworks and libraries it is
built from. Write the plan to `upgrade/rewrite-plan.md`. Do not write
application code in this session.

## What the app is

Read `README.md` for the current state - it describes the existing stack, the
record format, the encryption format, the Dropbox sync scheme and the build.
`index.html` and `www/app.js` show how small the app really is: a handful of
services and views. `upgrade/plan.md` and `upgrade/tasks.md` are the history
of the incremental upgrade that got the old stack this far and are the reason
a rewrite is now on the table.

Treat all of that as background, not as a specification to reproduce. The
existing code is an AngularJS 1.x application kept alive past the framework's
end of life; the point of the rewrite is to stop carrying it.

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
  Dropbox. State how it is read, migrated or converted; a plan that silently
  strands it is not acceptable.

## Out of scope

Do **not** enumerate or design features. The feature set will be specified
later, one at a time, on top of whatever architecture this plan settles. Keep
the plan at the level where it constrains those later decisions and no lower:
no screen-by-screen UI design, no data model beyond what the constraints
force, no task breakdown of individual features.

## Decisions the plan must make

For each one, give the realistic options, the trade-offs that matter for this
project, and a single recommendation. Where a choice is genuinely close, say
so and name what would break the tie.

- **UI framework** and, with it, the language (plain JS or TypeScript),
  routing, and how state is held.
- **Build and tooling** - bundler, dev server, linting, formatting.
- **Local persistence** - the storage API and whether a wrapper library
  earns its place; how encrypted records are indexed for the views.
- **Cryptography** - what does the encrypting now, whether to stay on the
  current OpenSSL-compatible crypto-js format or move to authenticated
  encryption with a modern KDF, and how old records are handled either way.
  README.md records the known weaknesses of the current format.
- **Offline and installability** - service worker strategy, whether to lean
  on a framework's PWA tooling or keep hand-written control, and how cache
  versioning stays tied to the build.
- **Dropbox integration** - SDK choice, the OAuth flow that works without a
  server, where tokens live, and what the sync model is: chunking, conflict
  resolution, and what happens when two devices edit while offline.
- **Styling** - CSS framework or none, icons, theming, and how the app
  behaves on a phone as well as a desktop.
- **Testing** - what runs in a real browser, what runs headless, and how
  crypto and sync are covered.
- **Deployment** - how a build reaches the static host, versioning, and how
  a development build stays distinguishable from production.

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

`upgrade/rewrite-plan.md`, holding:

1. A short statement of the target architecture - the layers and how they
   talk to each other.
2. The decisions above, each with options, trade-offs and a recommendation.
3. One recommended stack, listed plainly, so it can be read at a glance.
4. The migration story for existing data.
5. Risks and open questions that need my input before implementation starts.
6. A coarse phasing - what has to exist before anything else can, and where
   the first working end-to-end slice is. Not a task list.

Keep lines under 80 characters, 87 at the very most, as the other documents
in `upgrade/` do. Ask me about anything where two readings would lead to
materially different plans, rather than guessing.
