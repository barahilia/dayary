import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Emits www/sw.js at the build root with its placeholders filled in. The
// precache list is taken from the bundle itself, so it can never drift from
// what was built - the way the hand-written AppCache manifest used to.
export var serviceWorker = function () {
    return {
        name: 'dayary-service-worker',
        apply: 'build',
        // After the core plugins, so the HTML pages are in the bundle too.
        enforce: 'post',

        generateBundle: function (options, bundle) {
            var names = Object.keys(bundle).sort();

            var revision = createHash('sha256');

            names.forEach(function (name) {
                var file = bundle[name];

                revision.update(name);
                revision.update(
                    file.type === 'chunk' ? file.code : Buffer.from(file.source)
                );
            });

            // The index page is cached under the directory URL as well, as
            // that is how a browser asks for the app: `/dayary/`. The Dropbox
            // login page is only ever reached by its full name.
            var urls = ['./'].concat(
                names.map(function (name) { return './' + name; })
            );

            var source = readFileSync(new URL('../www/sw.js', import.meta.url), 'utf8')
                .replace('"__VERSION__"', JSON.stringify(revision.digest('hex').slice(0, 16)))
                .replace('["__PRECACHE__"]', JSON.stringify(urls));

            this.emitFile({ type: 'asset', fileName: 'sw.js', source: source });
        }
    };
};
