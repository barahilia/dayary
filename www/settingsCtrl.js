var settingsCtrl = function (
    $scope, $http, $state,
    errorService, settingsService, encryptionService, lockService
) {
    $scope.settings = settingsService.settings;

    $scope.save = function () {
        // TODO: return immediately if nothing has changed

        $scope.saving = true;

        $http.put("/api/settings", $scope.settings)
            .success(function () {
                $scope.saving = false;
            })
            .error(function () {
                $scope.saving = false;
                errorService.reportError("failure saving settings");
            });
    };
};
