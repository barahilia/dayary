
angular.module("app", [])

.controller("ctrl", function ($scope) {
    $scope.records = [
        {
            date: "2014-09-23",
            text: "Lorem Ipsum is simply dummy text of the printing and " +
                "typesetting industry. Lorem Ipsum has been the industry's " +
                "standard dummy text ever since the 1500s"
        },
        {
            date: "2014-10-27",
            text: "second"
        },
        {
            date: "2014-12-31",
            text: "third"
        }
    ];
    
    if($scope.records.length > 0) {
        $scope.selected = $scope.records[0];
    }
    
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
        record.editing = true;
    };
})

;


