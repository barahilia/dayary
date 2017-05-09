var recordsCtrl = function (
    $scope, $state, dbService
) {
    $scope.records = [];

    var loadMonth = function (dbGetter, chooser, goToState) {
        var currentRecordId = $state.params.id;
        $scope.loadingRecordsList = true;

        dbGetter(currentRecordId)
            .then(function (records) {
                $scope.loadingRecordsList = false;

                if (records.length === 0) {
                    return;
                }

                records = _.sortBy(records, 'created');
                records = records.reverse();
                $scope.records = records;

                if (goToState || !currentRecordId) {
                    $state.go("records.item", { id: chooser(records).id });
                }
            });
    };

    loadMonth(dbService.getMonthlyRecordsAt, _.first);

    $scope.add = function () {
        var addition = {
            created: moment().format(),
            updated: moment().format(),
            text: ""
        };

        dbService.addRecord(addition)
            .then(function (record) {
                $scope.records.unshift(record);
                $state.go("records.item.edit", { id: record.id });
            });
    };

    $scope.remove = function (record) {
        dbService.deleteRecord(record.id)
            .then(function () {
                $scope.records = _.without($scope.records, record);
            });
    };

    $scope.loadPrevious = function () {
        loadMonth(dbService.getPreviousMonthlyRecords, _.first, true);
    };

    $scope.loadNext = function () {
        loadMonth(dbService.getNextMonthlyRecords, _.last, true);
    };
};
