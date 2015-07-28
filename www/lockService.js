var lockService = function (
    $window, $interval, $state,
    settingsService, encryptionService
) {
    var locked = true;
    var lastUserAction = new Date();

    var lock = function () {
        encryptionService.setPassphrase();
        locked = true;
        $state.go("lock");
    };

    var updateUserAction = function () {
        lastUserAction = moment();
    };

    // TODO: choose $window.onclick vs angular.element($window).bind vs
    //       angular.element($window).on("click") vs ...
    $window.onclick = updateUserAction;
    $window.onkeypress = updateUserAction;

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

    service.unlock = function () {
        locked = false;
    };

    return service;
};
