// Development and production pages are the same app and look alike, so with
// both open in one browser they are easy to confuse - and their diaries are
// entirely separate, IndexedDB being per origin, so an entry written into the
// wrong one is silently lost. This marks the development page in the two
// places it matters: the tab strip, where a tab is picked by its icon and
// title, and the page itself, which says which one it is once looked at.
import { isDevelopment } from './environment.js';

// Inline rather than a file, so the icon needs no build asset and stays out
// of the service worker's precache list.
var devFavicon = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">' +
    '<rect width="16" height="16" fill="#e8a33d"/>' +
    '<text x="8" y="12.5" text-anchor="middle" fill="#fff"' +
    ' font-family="sans-serif" font-size="13">d</text>' +
    '</svg>'
);

// The page declares several icons - a .ico and a 192x192 png - and a browser
// picks among all of them, chrome taking the largest, so one of them changing
// its href need not show. And an href edited in place may not be looked at
// again once the icon has been resolved. So drop every icon link and add the
// one, which also leaves nothing larger to prefer.
var setFavicon = function (href) {
    var links = document.querySelectorAll('link[rel~="icon"]');

    for (var i = 0; i < links.length; i++) {
        links[i].remove();
    }

    var link = document.createElement('link');

    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = href;

    document.head.appendChild(link);
};

if (isDevelopment) {
    document.title = document.title + " dev";

    setFavicon(devFavicon);

    // The banner and the page background follow from this class; see
    // `body.dev` in site.css.
    document.body.classList.add("dev");
}
