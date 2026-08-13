// Marks the page the dev server puts up, so it is not mistaken for the
// production site with both open in one browser - see README.
//
// This is a server plugin rather than something the app does to itself at
// runtime, because of the favicon. index.html declares three icons, and a
// browser starts fetching them while it parses; a script removing those links
// afterwards and adding its own races the icon loader, which is why doing it
// that way left firefox flapping between the new icon, the aborted one
// (NS_BINDING_ABORTED on favicon.ico) and the default /favicon.ico. Serving
// HTML that declares the right icon in the first place has nothing to race.
var iconUrl = '/dev-favicon.svg';

// Explicit width and height, not a viewBox alone: an icon of no intrinsic
// size is rasterized inconsistently, firefox stretching it to its 300px
// default and others ignoring it.
var icon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"' +
    ' viewBox="0 0 32 32">' +
    '<rect width="32" height="32" fill="#e8a33d"/>' +
    '<text x="16" y="17" text-anchor="middle" dominant-baseline="central"' +
    ' fill="#ffffff" font-family="sans-serif" font-size="26"' +
    ' font-weight="bold">d</text>' +
    '</svg>';

export var devMarker = function () {
    return {
        name: 'dayary-dev-marker',
        apply: 'serve',

        configureServer: function (server) {
            server.middlewares.use(iconUrl, function (request, response) {
                response.setHeader('Content-Type', 'image/svg+xml');
                // The icon changes only when this file does, and the dev
                // server restarts then anyway.
                response.setHeader('Cache-Control', 'no-cache');
                response.end(icon);
            });
        },

        transformIndexHtml: {
            // Before the core plugins rewrite URLs, so the links this drops
            // are the ones written in the file.
            order: 'pre',

            handler: function (html, context) {
                // The app page only: the Dropbox login page is a transient
                // redirect and the test page is not the app.
                if (!context.filename.endsWith('index.html')) {
                    return html;
                }

                // Every icon the page declares goes, the apple touch one
                // included: a browser picks among all of them, and the point
                // is to leave it nothing to pick but the dev icon.
                return html
                    .replace(
                        /\s*<link[^>]*rel="(?:shortcut icon|icon|apple-touch-icon)"[^>]*>/g,
                        ''
                    )
                    .replace(
                        /<title>([^<]*)<\/title>/,
                        '<title>$1 dev</title>\n    ' +
                        '<link rel="icon" type="image/svg+xml" href="' +
                        iconUrl + '">'
                    )
                    .replace(/<body class="([^"]*)"/, '<body class="$1 dev"');
            }
        }
    };
};
