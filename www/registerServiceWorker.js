// jshint esversion: 11
// (for `import.meta`, which Vite replaces at build time)

// Only the production build has a service worker; in development Vite serves
// modules that must not be cached. The path is relative to this page, and the
// scope it gives - the app root - covers the Dropbox login page as well.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js')
            .catch(function (error) {
                console.error("Service worker registration failed", error);
            });
    });
}
