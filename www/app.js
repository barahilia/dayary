
angular.module("app", [])

.controller("ctrl", function ($scope, $http, $timeout, $interval) {
    var stopAutosave;

    // TODO: compare it against the hash saved in localStorage
    // TODO: enter twice at the first time
    // TODO: disable sample value at production
    // TODO: allow to save it at localStorage, explain security/convenience
    $scope.passphrase = "Very secret phrase";
    $scope.autosaveInterval = 30; // In seconds

    // TODO: extract to a dedicated controller (with glueing service)
    $scope.setError = function (error) {
        $scope.error = error;
    };

    $scope.unsetError = function () {
        $scope.error = null;
    };

    $http.get("/api/records")
        .success(function (data) {
            $scope.records = data;

            if($scope.records.length > 0) {
                $scope.select($scope.records[0].id);
            }
        })
        .error(function () {
            $scope.setError("failure while loading records list");
        });


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
                $scope.setError("failure while saving the record");
            });
    };

    var savePrevious = function () {
        if ($scope.selected && $scope.editing) {
            saveRecord($scope.selected);
        }
    };

    $scope.select = function (recordId) {
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

                    // TODO: rename selected to record
                    $scope.selected = record;
                    $scope.editing = false;
                }
                else {
                    $scope.setError("Unable to decrypt [" + record.date + "]");
                }
            })
            .error(function () {
                $scope.setError(
                    "failure while loading the data for record: " + recordId
                );
            });
    };

    $scope.add = function () {
        savePrevious();

        $http.post("/api/records")
            .success(function (record) {
                // TODO: need to push record without 'text'
                $scope.records.push(record);
                $scope.selected = record;
                $scope.editing = true;
            })
            .error(function () {
                $scope.setError("can't add new record");
            });
    };

    var stopAutosaving = function () {
        if (stopAutosave) {
            $interval.cancel(stopAutosave);
        }
    };

    $scope.edit = function (record) {
        $scope.editing = true;

        stopAutosave = $interval(
            function () {
                saveRecord(record);
            },
            $scope.autosaveInterval * 1000 // seconds -> milliseconds
        );
    };

    $scope.view = function (record) {
        $scope.editing = false;

        stopAutosaving();
        saveRecord(record);
    };

    $scope.$on('$destroy', function() {
        // Make sure that the interval is destroyed too
        stopAutosaving();
    });
})

;


