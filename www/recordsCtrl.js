var recordsCtrl = function (
    $scope, $http, $state, errorService
) {
    $scope.loadingRecordsList = true;

    $http.get("/api/records")
        .success(function (data) {
            $scope.loadingRecordsList = false;

            data = _.sortBy(data, 'created');
            data = data.reverse();

            $scope.records = data;

            if($scope.records.length > 0) {
                $state.go("records.item", { id: $scope.records[0].id });
            }
        })
        .error(function () {
            $scope.loadingRecordsList = false;
            errorService.reportError("failure while loading records list");
        });

    $scope.add = function () {
        var addition = {
            created: moment().format(),
            updated: moment().format()
        };

        $http.post("/api/records", addition)
            .success(function (record) {
                $scope.records.unshift(record);
                $state.go("records.item.edit", { id: record.id });
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
};
