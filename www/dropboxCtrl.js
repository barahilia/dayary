var dropboxCtrl = function (
    $scope, errorService, settingsService, syncService, dropboxService
) {
    $scope.isAuthenticated = dropboxService.isAuthenticated();
    $scope.dropboxUser = "N/A";

    $scope.getData = function () {
        dropboxService.accountInfo()
            .then(
                function (accountInfo) {
                    $scope.dropboxUser = accountInfo.name;
                },
                function () {
                    errorService.reportError(
                        "failure accessing Dropbox account info"
                    );
                }
            );
    };

    $scope.listFiles = function () {
        $scope.listing = true;

        dropboxService.listFiles(settingsService.settings.dropboxFolder)
            .finally(function () {
                $scope.listing = false;
            })
            .then(function (entries) {
                $scope.files = entries;
            });
    };

    $scope.autoSync = function () {
        syncService.sync();
    };
};
