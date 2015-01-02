
angular.module("app", [])

.controller("ctrl", function ($scope, $http) {
    $http.get("/api/records")
        .success(function (data) {
            $scope.records = data;

            if($scope.records.length > 0) {
                $scope.selected = $scope.records[0];
            }
        })
        .error(function () {
            $scope.loadError = true;
        });


    $scope.select = function (record) {
        $scope.selected = record;
    };

    $scope.add = function () {
        var record = {
            date: "2015-01-02",
            text: "dummy" // TODO: make it empty
        };

        $scope.selected = record;
        $scope.records.push(record);
    };

    $scope.edit = function (record) {
        $scope.editing = true;
    };

    $scope.view = function (record) {
        $scope.editing = false;
    };
})

;


