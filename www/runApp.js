var runApp = function (
    $rootScope, $state,
    lockService, dbService, settingsService
) {

    dbService.init()
        .then(lockService.init)
        .then(dbService.getSettings)
        .then(function (settings) {
            if (!_.isEmpty(settings)) {
                settingsService.init(settings);
            }
        });

    $rootScope.$on('$stateChangeStart', function(e, to) {
        lockService.previousState($state.current.name, $state.params);

        if (to.name === "lock") {
            return;
        }

        if (lockService.locked()) {
            e.preventDefault();

            if(!$state.is("lock")) {
                $state.go("lock");
            }
        }
    });
};
