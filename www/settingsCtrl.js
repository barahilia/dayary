var settingsCtrl = function (
    $scope, $http,
    $timeout, $window,
    encryptionService, recordService
) {
    var devPassphrase = "Very secret phrase";
    $scope.autosaveInterval = recordService.autosaveInterval;
    $scope.lockTimeout = { minutes: 5 };

    $scope.invalidPassphrase = function () {
        var computed = encryptionService.computeHash($scope.passphrase);

        if ($scope.passphrase) {
            if ($scope.hash) {
                return $scope.hash !== computed;
            }
            else {
                return false;
            }
        }
        else {
            return true;
        }
    };

    $scope.saveSettings = function () {
        computed = encryptionService.computeHash($scope.passphrase);

        if (computed === $scope.hash) {
            encryptionService.setPassphrase($scope.passphrase);
            $scope.settingsEdit.show = false;
            return;
        }

        $http.put("/api/hash", computed)
            .success(function () {
                encryptionService.setPassphrase($scope.passphrase);
                $scope.settingsEdit.show = false;
            })
            .error(function () {
                var msg = "failure setting hash for the pass phrase";
                errorService.reportError(msg);
            });
    };

    // TODO: consider moving this to recordsCtrl
    var lock = function () {
        $scope.settingsEdit.show = true;
        encryptionService.lock();
    };

    $timeout(
        lock,
        $scope.lockTimeout.minutes * 60 * 1000
    );

    $window.onblur = lock;

    $http.get("/api/hash")
        .success(function (hash) {
            var devHash = encryptionService.computeHash(devPassphrase);
            $scope.hash = hash;

            if (hash && hash === devHash) {
                // Dev mode - development pass phrase to be used
                $scope.passphrase = devPassphrase;
                $scope.saveSettings();
            }
            else {
                $scope.settingsEdit.show = true;
            }
        })
        .error(function () {
            errorService.reportError("failure getting pass phrase hash");
        });
};

