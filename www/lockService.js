var lockService = function (
    $window, $interval, $state,
    settingsService, encryptionService
) {
    var locked = true;
    var lastState = "records";
    var lastStateParams = {};
    var lastUserAction = new Date();

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

    // TODO: choose $window.onclick vs angular.element($window).bind vs
    //       angular.element($window).on("click") vs ...
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

    service.locked = function () {
        return locked;
    };

    service.lock = lock;

    service.unlock = function () {
        // TODO: consider to get the passphrase for encryptionService
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
