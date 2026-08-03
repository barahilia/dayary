import moment from 'moment';

export var recordsCtrl = function (
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

                records = records.slice().sort(function (a, b) {
                    return a.created < b.created ? -1 : a.created > b.created ? 1 : 0;
                });
                records = records.reverse();
                $scope.records = records;

                if (goToState || !currentRecordId) {
                    $state.go("records.item", { id: chooser(records).id });
                }
            });
    };

    var first = function (records) {
        return records[0];
    };

    var last = function (records) {
        return records[records.length - 1];
    };

    loadMonth(dbService.getMonthlyRecordsAt, first);

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
                $scope.records = $scope.records.filter(function (r) {
                    return r !== record;
                });
            });
    };

    $scope.loadPrevious = function () {
        loadMonth(dbService.getPreviousMonthlyRecords, first, true);
    };

    $scope.loadNext = function () {
        loadMonth(dbService.getNextMonthlyRecords, last, true);
    };
};

recordsCtrl.$inject = ['$scope', '$state', 'dbService'];
