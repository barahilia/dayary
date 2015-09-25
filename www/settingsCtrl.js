var settingsCtrl = function (
    $scope,
    settingsService, lockService, dbService
) {
    $scope.settings = settingsService.settings;

    $scope.save = function () {
        $scope.saving = true;

        dbService.setSettings($scope.settings)
            .finally(function () {
                $scope.saving = false;
            });
    };

    $scope.cleandb = function () {
        $scope.cleaningdb = true;

        // TODO: possibly better reload - need same actions as in runApp
        dbService.cleanDb()
            .then(dbService.init)
            .then(lockService.init)
            .finally(function () {
                $scope.cleaningdb = false;
            });
    };
};
