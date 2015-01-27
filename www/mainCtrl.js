var mainCtrl = function (
    $scope, $http, $timeout, $interval,
    errorService, recordService, encryptionService
) {
    var stopAutosave;

    // TODO: compare it against the hash saved in localStorage
    // TODO: enter twice at the first time
    // TODO: disable sample value at production
    // TODO: allow to save it at localStorage, explain security/convenience
    $scope.passphrase = "Very secret phrase";
    $scope.autosaveInterval = 30; // In seconds

    $scope.saveSettings = function () {
        encryptionService.setPassphrase($scope.passphrase);
        $scope.settingsEdit = false;
    };

    $scope.saveSettings();

    var saveRecord = function (record) {
        var encrypted = encryptionService.encrypt(record.text);

        // TODO: decide if to send the entire records instead of text only
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

