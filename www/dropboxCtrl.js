export var dropboxCtrl = function (
    $scope, errorService, settingsService, syncService, dropboxService
) {
    $scope.isAuthenticated = dropboxService.isAuthenticated();

    // The service knows whether it is ready: the app prepares it in the
    // background on load, so by the time this page opens the wait is usually
    // over already and the buttons show up at once.
    $scope.isReady = dropboxService.isReady;

    if ($scope.isAuthenticated) {
        dropboxService.prepareDropbox()
            .catch(function (message) {
                message = JSON.stringify(message).substring(0, 100);
                errorService.reportError("Dropbox prepare: " + message);
            });
    }
    else {
        // XXX go directly to the login/dropbox.html?
    }

    $scope.dropboxUser = "N/A";

    // The live settings, not a copy: the view says which years the sync
    // covers - `syncYear`, empty for all of them - and the choice is made in
    // Settings, so a change there has to show here without a reload.
    $scope.settings = settingsService.settings;

    $scope.getData = function () {
        dropboxService.accountInfo()
            .then(function (response) {
                var accountInfo = response.result;
                $scope.dropboxUser = accountInfo.name.display_name;
            })
            .catch(function (message) {
                var error = message.error && message.error.error;
                var tag = error && error['.tag'];

                if (tag === "expired_access_token") {
                    dropboxService.expire();
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
                $scope.files = entries.slice().sort(function (a, b) {
                    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
                });
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

dropboxCtrl.$inject = ['$scope', 'errorService', 'settingsService', 'syncService', 'dropboxService'];
