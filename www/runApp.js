export var runApp = function (
    $transitions, $state,
    lockService, dbService, settingsService, deviceService
) {

    dbService.init()
        .then(lockService.init)
        .then(dbService.getSettings)
        .then(function (settings) {
            if (Object.keys(settings).length > 0) {
                settingsService.init(settings);
            }

            if (settingsService.settings.device) {
                return null;
            }

            // Nothing in a browser names the machine, so the first run
            // guesses and saves the guess: records are stamped with it, so it
            // has to hold still across loads. The user renames it in Settings.
            return deviceService.detect()
                .then(function (device) {
                    settingsService.settings.device = device;

                    return dbService.setSettings({ device: device });
                });
        });

    // The 0.2.x $stateChangeStart event is gone in ui-router 1.x; a start
    // hook takes its place. Returning a target state redirects the
    // transition, replacing the old preventDefault() plus $state.go() pair.
    $transitions.onStart({}, function (transition) {
        lockService.previousState(
            transition.from().name, transition.params('from')
        );

        if (transition.to().name === "lock") {
            return;
        }

        if (lockService.locked()) {
            return $state.target("lock");
        }
    });
};

runApp.$inject = ['$transitions', '$state', 'lockService', 'dbService', 'settingsService', 'deviceService'];
