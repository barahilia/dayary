var recordsCtrl = function (
    $scope, $state, dbService
) {

    $scope.loadingRecordsList = true;
    $scope.records = [];

    dbService.getAllRecords()
        .then(function (records) {
            $scope.records = records;
            $scope.loadingRecordsList = false;

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

        dbService.addRecord(addition)
            .then(function (record) {
                $state.go("records.item.edit", { id: record.id });
            });
    };

    $scope.remove = function (record) {
        dbService.deleteRecord(record);
    };
};
