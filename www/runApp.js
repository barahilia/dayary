import { secondsToMilliseconds } from 'date-fns';

export var runApp = function (
    $transitions, $state, $timeout,
    lockService, dbService, settingsService, deviceService, dropboxService
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

    // Refreshing the Dropbox access token is a network round trip, and the
    // Dropbox page used to make the user wait for it. Doing it once here, a
    // few seconds in, leaves the page ready whenever it is opened. It is a
    // background job: the banner shows a small sign for it, and a failure -
    // no network being the usual one - only goes to the console, the page
    // itself reporting it when the user actually asks for Dropbox.
    if (dropboxService.isAuthenticated()) {
        $timeout(
            function () {
                dropboxService.prepareDropbox()
                    .catch(function (message) {
                        console.log("Background Dropbox prepare failed", message);
                    });
            },
            secondsToMilliseconds(7)
        );
    }

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

runApp.$inject = ['$transitions', '$state', '$timeout', 'lockService', 'dbService', 'settingsService', 'deviceService', 'dropboxService'];
