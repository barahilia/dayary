# Dayary

Dayary is a dairy tool that is different in two ways. First - it can be
deployed as a local web server. Second - encryption is done at the
client side. No one can read your private thoughts even if he gets
access to the server.

## Dairy tools

There are other dairy tools I had used or considered to use before I came to
conclusion I need something different. Here are them:
* Word from MS Office, Writer from LibreOffice or any other word processor
* Blogging platforms like Wordpress or Jekyll
* Moment Diary
* Dairy services online and apps for iOS and Android

## Requirements

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

There are two architectures. One is implemented already.
Implementation of the other is work in progress tha should be finished
in the coming weeks.

Current architecture - the classic
[3-tier architecture](https://en.wikipedia.org/wiki/Multitier_architecture#Three-tier_architecture).
Web client is used for the presentation tier and adresses the
*multiplatform* requirement which is the most costy.
The logic tier is quite thin and comprises an express.js web server
serving as API provider to the database. The last is a simple sqlite3 file.
The tool is intended for a single user hence no authentication
needed.

The simplest deployment model is running the server on a desktop computer
in home network and accessing it in browser from any device.

The target architecture assumes all the tiers to be merged into a single
web application. The application to be served by any hosting, I chose for
GitHub Pages. The application should be cached by browser and be available
offline. Web SQL is used for the in-browser local database. External cloud
service to be used for backup and synchronization between the clients.

## Design

## Powered by

The tool was built with the help of the following wonderful:
* Services: GitHub (including GitHub Pages), Dropbox
* Tools: Chrome, npm, bower, jshint
* Frameworks: Angular.js, Jasmine.js, node.js, express.js
* Libraries: bootstrap, font-awesome, ui-router, Moment.js, Underscore.js, dropbox.js, sqlite3, cryptojslib
