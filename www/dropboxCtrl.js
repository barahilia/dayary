export var dropboxCtrl = function (
    $scope, errorService, settingsService, syncService, dropboxService,
    dbService
) {
    $scope.isAuthenticated = dropboxService.isAuthenticated();
    $scope.isReady = false;

    if ($scope.isAuthenticated) {
        dropboxService.prepareDropbox()
            .then(function () {
                $scope.isReady = true;
            })
            .catch(function (message) {
                message = JSON.stringify(message).substring(0, 100);
                errorService.reportError("Dropbox prepare: " + message);
            });
    }
    else {
        // XXX go directly to the login/dropbox.html?
    }

    $scope.dropboxUser = "N/A";

    // The sync covers a single year or the whole diary, and the choice holds
    // until it is changed: whatever is picked here goes to the settings and
    // is what the next sync does. The year offered by default is the current
    // one - the only year a running diary keeps writing to - while an empty
    // setting, as on a device that never chose, means a complete sync.
    $scope.singleYear = !! settingsService.settings.syncYear;
    $scope.syncYear = settingsService.settings.syncYear ||
        String(new Date().getFullYear());

    var saveSyncYear = function () {
        var year = "";

        if ($scope.singleYear) {
            // The number input hands over a number, and the year travels as
            // a string: it names a file and is compared against the years
            // the records are grouped by, which are object keys.
            year = String($scope.syncYear);
        }

        settingsService.settings.syncYear = year;

        return dbService.setSettings({ syncYear: year });
    };

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

        saveSyncYear()
            .then(syncService.sync)
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

dropboxCtrl.$inject = ['$scope', 'errorService', 'settingsService', 'syncService', 'dropboxService', 'dbService'];
