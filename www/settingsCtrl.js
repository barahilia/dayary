export var settingsCtrl = function (
    $scope,
    settingsService, lockService, dbService
) {
    $scope.settings = settingsService.settings;

    // The sync covers a single year or the whole diary. One setting holds
    // both answers - the year, empty for all of them - while the view needs
    // two controls, so they are put back together on save.
    //
    // The year is a number here and a string in the setting: an
    // `<input type="number">` renders nothing at all for a string model,
    // while past this view the year names a file and is compared against the
    // years the records are grouped by, which are object keys.
    $scope.singleYear = !! settingsService.settings.syncYear;
    $scope.syncYear = settingsService.settings.syncYear ?
        Number(settingsService.settings.syncYear) :
        new Date().getFullYear();

    $scope.save = function () {
        $scope.saving = true;

        // Only saving makes the choice count: the sync reads the settings,
        // so an edit left here changes nothing until this runs.
        $scope.settings.syncYear =
            $scope.singleYear ? String($scope.syncYear) : "";

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

settingsCtrl.$inject = ['$scope', 'settingsService', 'lockService', 'dbService'];
