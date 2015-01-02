
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
        $http.post("/api/records")
            .success(function (record) {
                $scope.selected = record;
                $scope.records.push(record);
            })
            .error(function () {
                // TODO: report an error
            });
    };

    $scope.edit = function (record) {
        $scope.editing = true;
    };

    $scope.view = function (record) {
        $scope.editing = false;
    };
})

;


