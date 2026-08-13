import { readFileSync } from 'node:fs';

import { defineConfig } from 'vite';

import { serviceWorker } from './tools/viteServiceWorker.js';
import { devMarker } from './tools/viteDevMarker.js';

// The one place the version is written is package.json; everything else reads
// it from here. Read rather than imported, so no JSON import attribute is
// needed and the file is re-read whenever the config is.
var packageVersion = JSON.parse(readFileSync('./package.json', 'utf8')).version;

export default defineConfig({
    plugins: [serviceWorker(), devMarker()],

    // Substituted into the sources at build time and served the same way by
    // the dev server, so the app shows its version in both. The templates are
    // bundled as raw strings and get no substitution - the value reaches them
    // through the scope, see www/bannerCtrl.js.
    define: {
        __APP_VERSION__: JSON.stringify(packageVersion)
    },

    // Relative asset URLs, so the build works both under the GitHub Pages
    // project path (/dayary/) and at a domain root.
    base: './',

    server: {
        // Dropbox redirects back to this exact port after authentication.
        port: 3000,
        strictPort: true
    },

    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                dropboxLogin: 'www/login/dropbox.html'
            }
        }
    }
});
