// Registers the "app" angular module and pulls in angular itself.
import '../www/app.js';
// Provides the module() and inject() globals; needs window.angular in place.
import 'angular-mocks';

import './globals.js';

import './sync-db-spec.js';
import './lock-service-spec.js';
import './encryption-service-spec.js';
import './db-service-spec.js';
import './sync-service-spec.js';

// Imports are hoisted, so the specs above are registered by the time this
// runs; jasmine executes nothing before the load event, and hooks declared
// here belong to the root suite, so they still come first.

// The db suites are written as a sequence: each spec leaves the database in
// the state the next one expects. Jasmine 5 randomizes specs by default,
// which shuffles that sequence into failures, so keep the declared order.
jasmine.getEnv().configure({ random: false });

// Start every run from a database this build has just created. A leftover one
// keeps its schema, whatever version of the app wrote it, and clear() does not
// reset a store's key generator - so ids would go on climbing from wherever
// the previous run stopped, which is exactly what the specs pin down. The
// automated runner never noticed: it gets a fresh browser profile each time,
// while a developer's browser keeps the database between reloads.
// NB: this drops the diary stored on this origin, as clearing it always did.
beforeAll(function (done) {
    var request = window.indexedDB.deleteDatabase('db');

    // The app keeps its connection open for the life of its page and never
    // listens for versionchange, so a tab of it on this origin blocks the
    // delete. Say so at once: waiting it out only ends in a timeout whose
    // message names nothing the developer can act on.
    request.onblocked = function () {
        done(new Error(
            'another tab on this origin holds the database open - close ' +
            'the app tabs and reload the tests'
        ));
    };

    request.onsuccess = function () {
        done();
    };

    request.onerror = function (event) {
        done(new Error('cannot delete the test database: ' +
                       event.target.error));
    };
}, 30000);

// A rejected promise inside a spec's chain reaches no handler and surfaces
// only as "did not complete within 5000ms", which says nothing about what
// broke. Q keeps the reasons - already stringified, so a rejection carrying
// an IndexedDB event reads as "[object Event]" - and reporting them at least
// names the spec that produced one and separates a rejection from a hang.
afterEach(function () {
    var reasons = Q.getUnhandledReasons();

    Q.resetUnhandledRejections();

    if (reasons.length) {
        fail('unhandled rejection: ' + reasons.join('; '));
    }
});
