var lockCtrl = function ($scope, $http, encryptionService, lockService) {

    var devPassphrase = "Very secret phrase";

    var acceptPassphrase = function (passphrase) {
        encryptionService.setPassphrase($scope.passphrase);
        lockService.unlock();

        // TODO: preserve and go to the previous state
        $state.go("records");
    };

    var processServerHash = function (hash) {
        var devHash = encryptionService.computeHash(devPassphrase);

        if (hash && hash === devHash) {
            // Dev mode - development pass phrase to be used
            acceptPassphrase(devPassphrase);
        }
    };

    if (settingsService.initialized) {
        // All right; nothing to do
    }
    else {
        $http.get("/api/settings")
            .success(function (settings) {
                settingsService.initialize(settings);
                processServerHash(settingsService.hash);
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

    $scope.enter = function () {
        var hash = encryptionService.computeHash($scope.passphrase);

        $http.put("/api/settings/hash", hash)
            .success(function () {
                acceptPassphrase($scope.passphrase);
            })
            .error(function () {
                var msg = "failure setting hash for the pass phrase";
                errorService.reportError(msg);
            });

    };
};
