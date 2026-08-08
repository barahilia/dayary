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

## Design

The main unit of work is dairy `record`:
```
{
    id: Number, internal identificator
    created: Datetime, creation time and visual and sync identificator
    updated: Datetime, last update time, to sync the latest udpate
    text: String, encrypted textual entry
}
```
AES-256 algorithm is used for encryption. A passphrase is saved for
the session time to decrypt existing and encrypt updated records.
Decrypted text is only shown to the user. Database has only encrypted
text. A SHA-256 hash of the passphrase is presisted to guide the user
against the incorrect and inconsistent passphrase. A workspace is
locked after timeout and other conditions; this erases local copy of
the passphrase.

Views are organazed into states with **ui-router**. The main one
shows a list of records and allows to read and edit a record.

Backup and sync are done with Dropbox. Records are split to yearly
chunks and saved to JSON files to allow for relatively small units
for faster upload and download.

## Development

Start with:
```sh
cd dayary
npm install
npm start
```
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

Tests are jasmine specs run in a real browser: with `npm start` running, open
http://localhost:3000/test/jasmine.html. Several specs are currently failing
on their own async setup - they call into the database before `init()` has
resolved. Moving them to an automated runner is a separate upgrade task.

## Powered by

The tool was built with the help of the following wonderful:
* Services: GitHub (including GitHub Pages), Dropbox
* Tools: Chrome, npm, Vite, jshint
* Frameworks: Angular.js, Jasmine.js, node.js
* Libraries: bootstrap, font-awesome, ui-router, Moment.js, dropbox.js, crypto-js

