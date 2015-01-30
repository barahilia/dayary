var mainCtrl = function (
    $scope, $http, $timeout, $interval,
    errorService, recordService, encryptionService
) {
    var stopAutosave;

    // TODO: extract settings controller (service) and view
    // TODO: enter twice at the first time
    // TODO: disable sample value at production
    var devPassphrase = "Very secret phrase";
    $scope.autosaveInterval = 30; // In seconds

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
            return;
        }

        $http.put("/api/hash", computed)
            .success(function () {
                encryptionService.setPassphrase($scope.passphrase);
                $scope.settingsEdit = false;
            })
            .error(function () {
                var msg = "failure setting hash for the pass phrase";
                errorService.reportError(msg);
            });
    };

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
                $scope.settingsEdit = true;
            }
        })
        .error(function () {
            errorService.reportError("failure getting pass phrase hash");
        });

    var saveRecord = function (record) {
        var encrypted = encryptionService.encrypt(record.text);

        $http.put("/api/records/" + record.id, encrypted)
            .success(function () {
                // TODO: use moment.js instead of Date
                $scope.saved = "saved on " + (new Date());
                $timeout(
                    function () {
                        $scope.saved = "";
                    },
                    3000
                );
            })
            .error(function () {
                errorService.reportError("failure while saving the record");
            });
    };

    var savePrevious = function () {
        if ($scope.selected && $scope.editing) {
            saveRecord($scope.selected);
        }
    };

    var select = function (recordId) {
        savePrevious();

        $http.get("/api/records/" + recordId)
            .success(function (record) {
                try {
                    record.text = encryptionService.decrypt(record.text);

                    $scope.stopEdit($scope.selected);
                    // TODO: rename selected to record
                    $scope.selected = record;
                }
                catch (e) {
                    errorService.reportError(
                        "Unable to decrypt [" + record.created + "]"
                    );

                    return;
                }
            })
            .error(function () {
                errorService.reportError(
                    "failure while loading the data for record: " + recordId
                );
            });
    };

    recordService.setCallback(select);

    var stopAutosaving = function () {
        if (stopAutosave) {
            $interval.cancel(stopAutosave);
        }
    };

    $scope.startEdit = function (record) {
        $scope.editing = true;

        stopAutosave = $interval(
            function () {
                saveRecord(record);
            },
            $scope.autosaveInterval * 1000 // seconds -> milliseconds
        );
    };
    
    $scope.stopEdit = function (record) {
        $scope.editing = false;
        stopAutosaving();

        if (record) {
            saveRecord(record);
        }
    };

    $scope.view = function (record) {
        $scope.stopEdit(record);
    };

    $scope.$on('$destroy', function() {
        // Make sure that the interval is destroyed too
        stopAutosaving();
    });
}

