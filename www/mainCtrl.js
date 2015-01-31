var mainCtrl = function (
    $scope, $http, $timeout, $interval,
    errorService, recordService, encryptionService
) {
    var stopAutosave;

    $scope.settingsEdit = { show: false };

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
            recordService.autosaveInterval.seconds * 1000
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

