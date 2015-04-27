var yearsCtrl = function ($scope, $http, errorService) {

    $http.get("/api/records")
        .success(function (records) {
            var years = _.map(
                records,
                function (record) {
                    return moment(record.created).year();
                }
            );

            $scope.years = _.countBy(years);
        })
        .error(function () {
            errorService.reportError("failure while loading records list");
        });
};

