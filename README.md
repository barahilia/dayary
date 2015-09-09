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
and business logic layers. [Web SQL](http://www.w3.org/TR/webdatabase/) serves
for the local data layer. [Dropbox](https://www.dropbox.com) was chosen for
external data storage in the cloud.

It should be noted, that Web SQL is a deprecated specification, but it is fully
supported by the target browsers - Chrome and Safari, - and by phantom.js used
for headless testing.

The application to be served by any hosting, I chose for GitHub Pages. The
application should be cached by the browser and be available offline.

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

## Powered by

The tool was built with the help of the following wonderful:
* Services: GitHub (including GitHub Pages), Dropbox
* Tools: Chrome, npm, bower, jshint
* Frameworks: Angular.js, Jasmine.js, node.js, express.js
* Libraries: bootstrap, font-awesome, ui-router, Moment.js, Underscore.js, dropbox.js, sqlite3, cryptojslib

