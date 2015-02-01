var recordsCtrl = function ($scope, $http, errorService, recordService) {
    $http.get("/api/records")
        .success(function (data) {
            data = _.sortBy(data, 'created');
            data = data.reverse();

            $scope.records = data;

            if($scope.records.length > 0) {
                recordService.setRecordId($scope.records[0].id);
            }
        })
        .error(function () {
            errorService.reportError("failure while loading records list");
        });

    $scope.add = function () {
        $http.post("/api/records")
            .success(function (record) {
                $scope.records.unshift(_.omit(record, 'text'));
                recordService.setRecordId(record.id);
            })
            .error(function () {
                errorService.reportError("can't add new record");
            });
    };

    $scope.remove = function (record) {
        $http.delete("/api/records/" + record.id)
            .success(function () {
                // TODO: make sure of no attempt to save the removed record
                $scope.records = _.without($scope.records, record);
            })
            .error(function () {
                errorService.reportError("can't remove this record");
            });
    };

    $scope.select = function (recordId) {
        recordService.setRecordId(recordId);
    };

};

