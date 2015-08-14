var settingsCtrl = function (
    $scope,
    settingsService, migrateService, dbService
) {
    $scope.settings = settingsService.settings;

    $scope.save = function () {
        $scope.saving = true;

        dbService.setSettings($scope.settings)
            .finally(function () {
                $scope.saving = false;
            });
    };

    $scope.migrate = function () {
        $scope.migrating = true;
        $scope.migrateMessages = [];

        migrateService.migrate(
            _.bind(Array.prototype.push, $scope.migrateMessages)
        ).finally(function () {
            $scope.migrating = false;
        });
    };
};
