var yearsCtrl = function ($scope, $http, errorService) {

    var records;

    $scope.selectMonth = function (month) {
        // Find all its days
        // Present them
    };

    $scope.selectYear = function (year) {
        $scope.selectedYear = year;
        console.log(year);
        // Generate all months for this year
        $scope.months = _.map(
            moment.months(),
            function (month, index) {
                return {
                    name: month,
                    index: index,
                    count: _.filter(
                        records,
                        function (record) {
                            var date = moment(record.created);
                            return date.year() == year && date,month() == index;
                        }
                    )
                };
            }
        );

        // Count days in each
        // Select first non-empty month
    };

    $http.get("/api/records")
        .success(function (data) {
            records = data;

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

