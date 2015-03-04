var settingsCtrl = function (
    $scope, $http, $state,
    errorService, settingsService, encryptionService, lockService
) {
    var devPassphrase = "Very secret phrase";

    var saveSettings = function () {
        // TODO: consider moving this to settingsService
        encryptionService.setPassphrase($scope.settings.passphrase);
        lockService.setLockTimeout($scope.settings.lockTimeoutMin);
        lockService.setLockOnBlur($scope.settings.lockOnBlur);

        lockService.unlock();



        $state.go("records");
    };

    var processServerHash = function (hash) {
        var devHash = encryptionService.computeHash(devPassphrase);
        // TODO: possibly not needed any more - settingsService.settings.hash
        encryptionService.hash = hash;

        if (hash && hash === devHash) {
            // Dev mode - development pass phrase to be used
            settingsService.settings.passphrase = devPassphrase;
            saveSettings();
        }
    };

    $scope.settings = settingsService.settings;

    if (settingsService.initialized) {
        // Do nothing
    }
    else {
        $http.get("/api/settings")
            .success(function (settings) {
                _.extend($scope.settings, settings);
                processServerHash(settings.hash);
                settingsService.initialized = true;
            })
            .error(function () {
                errorService.reportError("failure requesting settings");
            });
    }

    $scope.invalidPassphrase = function () {
        var computed = encryptionService.computeHash(
            $scope.settings.passphrase
        );

        if ($scope.settings.passphrase) {
            if (encryptionService.hash) {
                return encryptionService.hash !== computed;
            }
            else {
                return false;
            }
        }
        else {
            return true;
        }
    };

    $scope.done = function () {
        // TODO: return immediately if nothing has changed

        var computed = encryptionService.computeHash(
            $scope.settings.passphrase
        );

        // TODO: consider running simply $q.all() instead
        $http.put("/api/settings/hash", computed)
            .success(function () {
                var settingsNoHash = _.omit($scope.settings, 'hash');

                $http.put("/api/settings", settingsNoHash)
                    .success(function () {
                        // TODO: call saveSettings() - ?
                        $state.go("records");
                    })
                    .error(function () {
                        var msg = "failure saving settings";
                        errorService.reportError(msg);
                    });
            })
            .error(function () {
                var msg = "failure setting hash for the pass phrase";
                errorService.reportError(msg);
            })
    };
};
