import { existsSync } from 'node:fs';

import { createServer } from 'vite';
import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

// Runs test/jasmine.html in a headless Firefox and reports what jasmine put
// on the page. The specs and the page itself are the same ones a developer
// opens by hand - this only takes the browser out of the loop, so there is no
// second module resolution path that could disagree with Vite's.

// selenium looks for /usr/bin/firefox, which on a snap install is a shell
// wrapper that geckodriver rejects with "binary is not a Firefox executable".
// So point it at the real binary when one of the known ones is present, and
// fall back to selenium's own lookup otherwise. FIREFOX_BIN overrides both.
var firefoxBinary = function () {
    var candidates = [
        '/snap/firefox/current/usr/lib/firefox/firefox',
        '/usr/lib/firefox/firefox',
        '/usr/lib/firefox-esr/firefox-esr',
        '/opt/firefox/firefox'
    ];

    if (process.env.FIREFOX_BIN) {
        return process.env.FIREFOX_BIN;
    }

    return candidates.find(existsSync);
};

var startServer = async function () {
    // Not the port npm start uses: tests need no Dropbox redirect, and this
    // way they run while a dev server is up. strictPort off, so a busy port
    // moves the tests rather than failing them.
    var server = await createServer({
        server: { port: 3100, strictPort: false }
    });

    await server.listen();

    return server;
};

var startBrowser = function () {
    var options = new firefox.Options().addArguments('-headless');
    var binary = firefoxBinary();

    if (binary) {
        options.setBinary(binary);
    }

    return new Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .build();
};

var reportFailures = async function (driver) {
    var failures = await driver.findElements(
        By.css('.jasmine-failures .jasmine-spec-detail')
    );

    for (var failure of failures) {
        console.log('');
        console.log(await failure.getText());
    }
};

var run = async function () {
    var server = await startServer();
    var driver;

    try {
        var url = server.resolvedUrls.local[0];

        driver = await startBrowser();
        await driver.get(url + 'test/jasmine.html');

        // jasmine-html only writes the summary bar once the whole suite is
        // done, so this is both the wait and the done signal.
        var summary = await driver.wait(
            until.elementLocated(By.css('.jasmine-overall-result')),
            120000
        );

        var passed = (await summary.getAttribute('class'))
            .includes('jasmine-passed');

        if (!passed) {
            await reportFailures(driver);
        }

        console.log('');
        console.log(await summary.getText());

        return passed;
    }
    finally {
        if (driver) {
            await driver.quit();
        }

        await server.close();
    }
};

process.exitCode = (await run()) ? 0 : 1;
