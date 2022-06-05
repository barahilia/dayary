var dropboxCtrl = function (
    $scope, errorService, settingsService, syncService, dropboxService
) {
    $scope.isAuthenticated = dropboxService.isAuthenticated();
    $scope.dropboxUser = "N/A";

    $scope.getData = function () {
        dropboxService.accountInfo()
            .then(function (accountInfo) {
                $scope.dropboxUser = accountInfo.name.display_name;
            })
            .catch(function (message) {
                var tag = message.error && message.error['.tag'];

                if (tag === "expired_access_token") {
                    $scope.isAuthenticated = false;
                }

                message = JSON.stringify(message).substring(0, 100);

                errorService.reportError(
                    "failure accessing Dropbox account info: " + message
                );
            });
    };

    $scope.listFiles = function () {
        $scope.listing = true;

        dropboxService.listFiles(settingsService.settings.dropboxFolder)
            .then(function (entries) {
                $scope.listing = false;
                $scope.files = _.sortBy(entries, 'name');
            })
            .catch(function (message) {
                $scope.listing = false;
                errorService.reportError(
                    "failure accessing Dropbox list of files: " + message
                );
            });
    };

    $scope.autoSync = function () {
        $scope.syncing = true;

        syncService.sync()
            .then(function () {
                $scope.syncing = false;
                console.log("Auto sync finished successfully");
            })
            .catch(function (message) {
                $scope.syncing = false;
                message = JSON.stringify(message).substring(0, 100);
                errorService.reportError("auto sync fail: " + message);
            });
    };
};
