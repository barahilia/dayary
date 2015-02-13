var lockService = function (
    $window, $interval, $state, encryptionService
) {
    var locked = true;
    var lockTimeoutMin = 1;
    var lastUserAction = new Date();

    var lock = function () {
        encryptionService.setPassphrase();
        locked = true;
        $state.go("settings");
    };

    var updateUserAction = function () {
        lastUserAction = new Date();
    };

    // TODO: use moment.js for all date operations
    // TODO: choose $window.onclick vs angular.element($window).bind vs
    //       angular.element($window).on("click") vs ...
    $window.onclick = updateUserAction;
    $window.onkeypress = updateUserAction;

    $window.onblur = lock;


    $interval(
        function () {
            var now = new Date();

            if (locked) {
                return;
            }

            if ((now - lastUserAction) > lockTimeoutMin * 60 * 1000) {
                lock();
            }
        },
        5 * 1000 // 5 sec
    );


    var service = {};

    service.setLockTimeout = function (timeoutMin) {
        lockTimeoutMin = timeoutMin;
    };

    service.setUnlocked = function () {
        locked = false;
    };

    return service;
};
