export var runApp = function (
    $transitions, $state,
    lockService, dbService, settingsService
) {

    dbService.init()
        .then(lockService.init)
        .then(dbService.getSettings)
        .then(function (settings) {
            if (Object.keys(settings).length > 0) {
                settingsService.init(settings);
            }
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

runApp.$inject = ['$transitions', '$state', 'lockService', 'dbService', 'settingsService'];
