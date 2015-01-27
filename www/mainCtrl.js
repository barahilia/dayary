var mainCtrl = function (
    $scope, $http, $timeout, $interval,
    errorService, recordService
) {
    var stopAutosave;

    // TODO: compare it against the hash saved in localStorage
    // TODO: enter twice at the first time
    // TODO: disable sample value at production
    // TODO: allow to save it at localStorage, explain security/convenience
    $scope.passphrase = "Very secret phrase";
    $scope.autosaveInterval = 30; // In seconds

    var saveRecord = function (record) {
        var encrypted;

        if (record.text) {
            encrypted = CryptoJS.AES.encrypt(record.text, $scope.passphrase);
            encrypted = encrypted.toString();
        }
        else {
            encrypted = "";
        }

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
                // TODO: extract encryption service
                var decrypted;

                if (!record.text) {
                    $scope.selected = record;
                    return;
                }

                try {
                    decrypted = CryptoJS.AES
                        .decrypt(record.text, $scope.passphrase)
                        .toString(CryptoJS.enc.Utf8);
                }
                catch (e) {
                    // Nothing doing
                }

                if (decrypted) {
                    record.text = decrypted;

                    $scope.stopEdit($scope.selected);
                    // TODO: rename selected to record
                    $scope.selected = record;
                }
                else {
                    errorService.reportError(
                        "Unable to decrypt [" + record.created + "]"
                    );
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

