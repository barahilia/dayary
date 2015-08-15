var lockService = function (
    $window, $interval, $state,
    dbService, settingsService, encryptionService
) {
    // TODO: extract relevant code to new autolockerService
    // TODO: consider moving this futher to encryptionService
    var hash;
    var devPassphrase = "Very secret phrase";

    var locked = true;

    var lastState = "records";
    var lastStateParams = {};
    var lastUserAction = new Date();


    var setHash = function (passphrase) {
        if (hash) {
            return;
        }

        hash = encryptionService.computeHash(passphrase);

        dbService.setHash(hash);
    };

    var lock = function () {
        encryptionService.setPassphrase();
        locked = true;

        if (!$state.is("lock")) {
            $state.go("lock");
        }
    };

    var updateUserAction = function () {
        lastUserAction = moment();
    };

    $window.onclick = updateUserAction;
    $window.onkeypress = updateUserAction;

    // TODO: the following works properly on desktop and in Safari iPad. But
    // doesn't work for Chrome iPad. Refer:
    // https://code.google.com/p/chromium/issues/detail?id=515461
    // If I really need this, can be implemented with setInterval(), notice
    // a large gap between two callbacks and assume it happened due to window
    // got out of focus.
    $window.onblur = function () {
        if (settingsService.settings.lockOnBlur) {
            lock();
        }
    };

    $interval(
        function () {
            var lockTimeout = moment.duration(
                settingsService.settings.lockTimeoutMin,
                'minutes'
            );

            if (locked) {
                return;
            }

            if (moment().subtract(lockTimeout) > lastUserAction) {
                lock();
            }
        },
        moment.duration(5, 'seconds').asMilliseconds()
    );


    var service = {};

    service.init= function () {
        var devHash = encryptionService.computeHash(devPassphrase);

        dbService.getHash()
            .then(function (dbHash) {
                hash = dbHash;

                if (hash === devHash) {
                    // Dev mode - development pass phrase to be used
                    service.unlock(devPassphrase);
                }
            });
    };

    service.validPassphrase = function (passphrase) {
        if (passphrase) {
            if (hash) {
                return hash === encryptionService.computeHash(passphrase);
            }
            else {
                return true;
            }
        }
        else {
            return false;
        }
    };

    service.locked = function () {
        return locked;
    };

    service.lock = lock;

    service.unlock = function (passphrase) {
        setHash(passphrase);
        encryptionService.setPassphrase(passphrase);
        locked = false;
        $state.go(lastState, lastStateParams);
    };

    service.previousState = function(state, params) {
        if (state && state !== "lock") {
            lastState = state;
            lastStateParams = params;
        }
    };

    return service;
};

