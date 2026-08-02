var yearsCtrl = function ($scope, dbService, errorService) {

    var initiateYear = function () {
        var months = [];

        for (var n = 0; n < 12; n++) {
            months[n] = [];
        }

        return { count: 0, months: months };
    };

    // { year: { count: n, months: [ 12 x [ record ] ] } }
    var organizeRecords = function (records) {
        $scope.records = {};

        records.forEach(function (record) {
            var created = moment(record.created),
                year = created.year(),
                month = created.month();

            var yearRecords = $scope.records[year] =
                $scope.records[year] || initiateYear();
            var monthRecords = yearRecords.months[month];

            yearRecords.count ++;
            monthRecords.push(record);
        });
    };

    var orderRecords = function (organizedRecords) {
        Object.keys(organizedRecords).forEach(function (year) {
            var yearRecords = organizedRecords[year];

            yearRecords.months.forEach(function (monthRecords, month) {
                var sorted = monthRecords.slice().sort(function (a, b) {
                    return a.created < b.created ? -1 :
                        a.created > b.created ? 1 : 0;
                });
                yearRecords.months[month] = sorted;
            });
        });
    };

    $scope.months = moment.months();

    $scope.selectYear = function (year) {
        $scope.selectedYear = year;

        var months = $scope.records[year].months;
        var month;

        for (month = 0; month < 12; month++) {
            if (months[month].length > 0) {
                break;
            }
        }

        $scope.selectMonth(month < 12 ? month : undefined);
    };

    $scope.selectMonth = function (month) {
        $scope.selectedMonth = month;
    };

    dbService.getAllRecords()
        .then(function (records) {
            organizeRecords(records);
            orderRecords($scope.records);

            var years = Object.keys($scope.records);

            if (years.length > 0) {
                $scope.selectYear(years.reduce(function (a, b) {
                    return a > b ? a : b;
                }));
            }
        });
};
