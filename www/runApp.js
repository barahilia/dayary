var runApp = function ($rootScope, $state, lockService) {
    $rootScope.$on('$stateChangeStart', function(e, to) {
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

