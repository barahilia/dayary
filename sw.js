/* globals self, caches, clients, Request */

// The service worker that replaced the old AppCache manifest. It is not
// bundled with the app: tools/viteServiceWorker.js copies this file to the
// build root, filling in the two placeholders below with the names of the
// files Vite has just emitted and with a revision derived from their content.

var VERSION = "e35277a718bf17bf";
var PRECACHE = ["./","./assets/Dropbox-sdk.min-D-xgJ5QG.js","./assets/apple-touch-icon-152x152-VYLGuUYt.png","./assets/dropboxLogin-DYb6VBQ9.js","./assets/favicon-BMIDwjwg.ico","./assets/fontawesome-webfont-B-jkhYfk.woff2","./assets/fontawesome-webfont-CDK5bt4p.woff","./assets/fontawesome-webfont-CQDK8MU3.ttf","./assets/fontawesome-webfont-D13rzr4g.svg","./assets/fontawesome-webfont-G5YE5S7X.eot","./assets/icon-192x192-CWgR4zdy.png","./assets/main-CGO2hOCj.js","./assets/main-CNVsw6c6.css","./index.html","./www/login/dropbox.html"];

// URLs are relative to this script, which sits at the app root - so the same
// build works under the GitHub Pages project path and at a domain root, just
// like the relative asset URLs in the pages themselves.
var CACHE = "dayary-" + VERSION;
var INDEX = new URL("index.html", self.location.href).href;

var openCache = function () {
    return caches.open(CACHE);
};

// Assets carry a content hash in their name, and the two pages are precached
// under both their own and the directory URL, so a hit is always current.
// Queries are ignored for the sake of the `?v=4.7.0` on the font files.
var fromCache = function (request) {
    return openCache().then(function (cache) {
        return cache.match(request, { ignoreSearch: true });
    });
};

self.addEventListener('install', function (event) {
    event.waitUntil(
        openCache()
            .then(function (cache) { return cache.addAll(PRECACHE); })
            // Take over at once: a diary that is one launch behind is worse
            // than the app updating under a session that has all it needs
            // loaded already.
            .then(function () { return self.skipWaiting(); })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys()
            .then(function (names) {
                var stale = names.filter(function (name) {
                    return name !== CACHE && name.indexOf("dayary-") === 0;
                });

                return Promise.all(stale.map(function (name) {
                    return caches.delete(name);
                }));
            })
            .then(function () { return clients.claim(); })
    );
});

self.addEventListener('fetch', function (event) {
    var request = event.request;

    // Anything else - the Dropbox API above all - has to reach the network.
    // Records themselves are in IndexedDB, so the app is fully usable while
    // those calls fail.
    if (request.method !== 'GET') {
        return;
    }

    if (new URL(request.url).origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fromCache(request)
            .then(function (response) {
                if (response) {
                    return response;
                }

                // ui-router keeps the state in the fragment, so any navigation
                // within the app is a request for the index page.
                if (request.mode === 'navigate') {
                    return fromCache(new Request(INDEX));
                }
            })
            .then(function (response) {
                return response || fetch(request);
            })
    );
});
