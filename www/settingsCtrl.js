var settingsCtrl = function (
    $scope, $http, $state,
    errorService, settingsService, encryptionService, lockService
) {
    var devPassphrase = "Very secret phrase";

    var saveSettings = function () {
        // TODO: consider moving this to settingsService
        encryptionService.setPassphrase($scope.passphrase);
        $scope.passphrase = null;

        lockService.setLockTimeout($scope.settings.lockTimeoutMin);
        lockService.setLockOnBlur($scope.settings.lockOnBlur);

        lockService.unlock();

        $state.go("records");
    };

    var processServerHash = function (hash) {
        var devHash = encryptionService.computeHash(devPassphrase);

        settingsService.hash = hash;

        if (hash && hash === devHash) {
            // Dev mode - development pass phrase to be used
            $scope.passphrase = devPassphrase;
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
                // TODO: extract a function; possibly in settingsService
                // TODO: save serialized values in backend, not string - then
                // no need to parse here
                $scope.settings.autosaveIntervalSec = +settings.autosaveIntervalSec;
                $scope.settings.lockTimeoutMin = +settings.lockTimeoutMin;
                $scope.settings.lockOnBlur = !!(+settings.lockOnBlur);
                $scope.settings.dropboxFolder = settings.dropboxFolder;

                settingsService.initialized = true;
                processServerHash(settings.hash);
            })
            .error(function () {
                errorService.reportError("failure requesting settings");
            });
    }

    $scope.invalidPassphrase = function () {
        var computed = encryptionService.computeHash($scope.passphrase);

        if ($scope.passphrase) {
            if (settingsService.hash) {
                return settingsService.hash !== computed;
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

        var hash = encryptionService.computeHash($scope.passphrase);

        // TODO: consider running simply $q.all() instead
        $http.put("/api/settings/hash", hash)
            .success(function () {

                $http.put("/api/settings", $scope.settings)
                    .success(function () {
                        saveSettings();
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
