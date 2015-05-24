var yearsCtrl = function ($scope, $http, errorService) {

    $scope.selectMonth = function (month) {
        // Find all its days
        // Present them
    };

    $scope.selectYear = function (year) {
        $scope.selectedYear = year;
        console.log(year);
        // Generate all months for this year
        // Count days in each
        // Select first non-empty month
    };

    $http.get("/api/records")
        .success(function (records) {
            var years = _.map(
                records,
                function (record) {
                    return moment(record.created).year();
                }
            );

            $scope.years = _.countBy(years);

            if (_.some(years)) {
                $scope.selectYear(_.min(years));
            }
        })
        .error(function () {
            errorService.reportError("failure while loading records list");
        });
};

