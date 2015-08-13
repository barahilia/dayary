var yearsCtrl = function ($scope, dbService, errorService) {

    var initiateYear = function () {
        var months = [];

        _.each(_.range(12), function (n) {
            months[n] = [];
        });

        return { count: 0, months: months };
    };

    // { year: { count: n, months: [ 12 x [ record ] ] } }
    var organizeRecords = function (records) {
        $scope.records = {};

        _.each(
            records,
            function (record) {
                var created = moment(record.created),
                    year = created.year(),
                    month = created.month();

                var yearRecords = $scope.records[year] =
                    $scope.records[year] || initiateYear();
                var monthRecords = yearRecords.months[month];

                yearRecords.count ++;
                monthRecords.push(record);
            }
        );
    };

    $scope.months = moment.months();

    $scope.selectYear = function (year) {
        $scope.selectedYear = year;

        $scope.selectMonth(_.find(
            _.range(12),
            function (month) {
                return _.some($scope.records[year].months[month]);
            }
        ));
    };

    $scope.selectMonth = function (month) {
        $scope.selectedMonth = month;
    };

    dbService.getAllRecords()
        .then(function (records) {
            organizeRecords(records);

            if (_.some($scope.records)) {
                $scope.selectYear(_.min(_.keys($scope.records)));
            }
        });
};
