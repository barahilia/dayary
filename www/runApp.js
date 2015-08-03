var runApp = function ($rootScope, $state, lockService, dbService) {

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
