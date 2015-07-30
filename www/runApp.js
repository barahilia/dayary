var runApp = function ($rootScope, $state) {
    var initialized = false;

    $rootScope.$on('$stateChangeStart', function(e, to) {
        if (initialized) {
            return;
        }

        initialized = true;

        if (to.name === "lock") {
            return;
        }

        e.preventDefault();
        // TODO: make it possible to return to current 'to' state after
        //       done with settings editing
        $state.go("lock");
    });
};

