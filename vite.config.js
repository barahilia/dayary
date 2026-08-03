import { defineConfig } from 'vite';

export default defineConfig({
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
