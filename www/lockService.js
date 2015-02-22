var lockService = function (
    $window, $interval, $state, encryptionService
) {
    var locked = true;
    var lockOnBlur = true;
    var lockTimeout = moment.duration(1, 'minutes');
    var lastUserAction = new Date();

    var lock = function () {
        encryptionService.setPassphrase();
        locked = true;
        $state.go("settings");
    };

    var updateUserAction = function () {
        lastUserAction = moment();
    };

    // TODO: choose $window.onclick vs angular.element($window).bind vs
    //       angular.element($window).on("click") vs ...
    $window.onclick = updateUserAction;
    $window.onkeypress = updateUserAction;

    $window.onblur = function () {
        if (lockOnBlur) {
            lock();
        }
    };


    $interval(
        function () {
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

    service.setLockOnBlur = function (flag) {
        lockOnBlur = flag;
    };

    service.setLockTimeout = function (timeout) {
        lockTimeout = moment.duration(timeout, 'minutes');
    };

    service.setUnlocked = function () {
        locked = false;
    };

    return service;
};
