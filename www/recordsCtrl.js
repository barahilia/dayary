var recordsCtrl = function (
    $scope, $state, recordsService
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

        recordsService.addRecord(
            addition,
            function (err, record) {
                if (!err) {
                    $state.go("records.item.edit", { id: record.id });
                }
            }
        );
    };

    $scope.remove = function (record) {
        recordsService.deleteRecord(record, function () {});
    };
};
