
angular.module("app", [])

.controller("ctrl", function ($scope, $http, $timeout) {
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
        $scope.editing = false;

        // TODO: decide if to send the entire records instead of text only
        $http.put("/api/records/" + record.id, record.text)
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


