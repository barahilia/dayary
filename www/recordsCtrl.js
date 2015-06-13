var recordsCtrl = function (
    $scope, $http, $state,
    recordsService, errorService
) {
    $scope.loadingRecordsList = true;

    $scope.records = function () {
        return recordsService.records();
    };

    recordsService.getAll(function (err, records) {
        $scope.loadingRecordsList = false;

        if (err) {
            return;
        }

        if($state.params.id) {
            // Do nothing - we are heading to some specific record
        }
        else {
            if(records.length > 0) {
                $state.go("records.item", { id: records[0].id });
            }
        }
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
