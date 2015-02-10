var runApp = function ($rootScope, $state) {
    var initialized = false;

    $rootScope.$on('$stateChangeStart', function(e, to) {
        if (initialized || to.name === "settings") {
            return;
        }

        e.preventDefault();
        // TODO: make it possible to return to current 'to' state after
        //       done with settings editing
        $state.go("settings");
        initialized = true;
    });
};

