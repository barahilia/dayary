
angular.module("app", [])

.controller("ctrl", function ($scope, $http, $timeout, $interval) {
    var stopAutosave;

    // TODO: compare it against the hash saved in localStorage
    // TODO: enter twice at the first time
    // TODO: disable sample value at production
    // TODO: allow to save it at localStorage, explain security/convenience
    $scope.passphrase = "Very secret phrase";
    $scope.autosaveInterval = 30; // In seconds

    $scope.setError = function (error) {
        $scope.error = error;
    };

    $scope.unsetError = function () {
        $scope.error = null;
    };

    $http.get("/api/records")
        .success(function (data) {
            _.each(data, function(record) {
                if (!record.text) {
                    return;
                }

                var decrypted = CryptoJS.AES
                    .decrypt(record.text, $scope.passphrase)
                    .toString(CryptoJS.enc.Utf8);

                if (decrypted) {
                    record.text = decrypted;
                }
                else {
                    $scope.setError("Unable to decrypt [" + record.date + "]");
                }
            });

            $scope.records = data;

            if($scope.records.length > 0) {
                $scope.selected = $scope.records[0];
            }
        })
        .error(function () {
            $scope.setError("failure while loading the data");
        });


    $scope.select = function (record) {
        $scope.selected = record;
    };

    $scope.add = function () {
        $http.post("/api/records")
            .success(function (record) {
                $scope.selected = record;
                $scope.records.push(record);
            })
            .error(function () {
                $scope.setError("can't add new record");
            });
    };

    var saveRecord = function (record) {
        var encrypted = CryptoJS.AES.encrypt(record.text, $scope.passphrase);
        encrypted = encrypted.toString();

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


