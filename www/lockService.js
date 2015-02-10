var lockService = function (
    $window, $interval, $state, encryptionService
) {
    var service = {};

    var locked = true;
    var lastUserAction = new Date();

    var lock = function () {
        encryptionService.setPassphrase();
        locked = true;
        $state.go("settings");
    };

    // TODO: move $window.onblur here too
    var updateUserAction = function () {
        lastUserAction = new Date();
    };

    // TODO: extract to the lock service
    // TODO: use moment.js for all date operations
    // TODO: choose $window.onclick vs angular.element($window).bind vs
    //       angular.element($window).on("click") vs ...
    $window.onclick = updateUserAction;
    $window.onkeypress = updateUserAction;

    $interval(
        function () {
            var now = new Date();

            if (locked) {
                return;
            }

            //if ((now - lastUserAction) > 15 * 60 * 1000) { // 15 min
            if ((now - lastUserAction) > 15 * 1000) { // 15 sec
                lock();
            }
        },
        5 * 1000 // 5 sec
    );

    return service;
};

