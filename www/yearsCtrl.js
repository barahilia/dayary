var yearsCtrl = function ($scope, $http, errorService) {

    var initiateYear = function () {
        var months = {};

        _.each(_.range(12), function (n) {
            res[n] = [];
        });

        return { count: 0, months: months };
    };

    // { year: { count: n, months: { month: [ record ] } } }
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
        );
    };

    $scope.selectMonth = function (month) {
        $scope.selectedMonth = month;
    };

    $http.get("/api/records")
        .success(function (records) {
            organizeRecords(records);

            if (_.some(years)) {
                $scope.selectYear(_.min(years));
            }
        })
        .error(function () {
            errorService.reportError("failure while loading records list");
        });
};

