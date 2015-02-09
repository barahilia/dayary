angular.module("app", ['ui.router'])
    .config(configApp)
    // TODO: extract to runApp
    .run(function ($rootScope, $state) {
        var initialized = false;

        $rootScope.$on('$stateChangeStart', function(e, to) {
            if (initialized || to.name === "settings") {
                return;
            }

            e.preventDefault();
            $state.go("settings");
            initialized = true;
        });
    })
    .factory("encryptionService", encryptionService)
    .factory("errorService", errorService)
    .controller("errorCtrl", errorCtrl)
    .controller("settingsCtrl", settingsCtrl)
    .factory("recordService", recordService)
    .controller("recordsCtrl", recordsCtrl)
    .controller("viewerCtrl", viewerCtrl)
    .controller("editorCtrl", editorCtrl)
    .controller("mainCtrl", mainCtrl)
    ;


