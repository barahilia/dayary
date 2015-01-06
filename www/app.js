
angular.module("app", [])

.controller("ctrl", function ($scope, $http, $timeout) {
    // TODO: get this from the user
    var passphrase = "Very secret phrase";

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
                    .decrypt(record.text, passphrase)
                    .toString(CryptoJS.enc.Utf8);

                if (decrypted) {
                    record.text = decrypted;
                }
                else {
                    $scope.setError("Unable to dectype [" + record.date + "]");
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

    $scope.edit = function (record) {
        $scope.editing = true;
        // TODO: run auto-save every 1 minute, notify when done/failed
    };

    $scope.view = function (record) {
        var encrypted;

        $scope.editing = false;

        encrypted = CryptoJS.AES.encrypt(record.text, passphrase);
        encrypted = encrypted.toString();

        // TODO: decide if to send the entire records instead of text only
        $http.put("/api/records/" + record.id, encrypted)
            .success(function () {
                $scope.saved = true;
                $timeout(
                    function () {
                        $scope.saved = false;
                    },
                    3000
                );
            })
            .error(function () {
                $scope.setError("failure while saving the record");
            });
    };
})

;


