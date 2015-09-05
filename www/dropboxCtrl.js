var dropboxCtrl = function (
    $scope, errorService, settingsService, syncService
) {
    // TODO: remove this completely or use dropboxService

    var client = new Dropbox.Client({ key: "4hxwutae96fhhbd" });

    $scope.isAuthenticated = false;
    $scope.dropboxUser = "N/A";

    $scope.year = moment().year();

    client.authenticate({interactive: false}, function(error, client) {
        if (error) {
            console.log(error);
            errorService.reportError("failure checking Dropbox authentication");
            return;
        }

        if (client.isAuthenticated()) {
            $scope.isAuthenticated = true;
        }
    });

    $scope.getData = function () {
        client.getAccountInfo(function(error, accountInfo) {
            if (error) {
                console.log(error);
                errorService.reportError("failure accessing Dropbox account info");
                return;
            }

            $scope.dropboxUser = accountInfo.name;
        });
    };

    $scope.backupYear = function (year) {
        var timestamp = moment().format("YYYYMMDDHHmmss");
        var filename = "" + year + '.' + timestamp + ".json";

        $scope.backupMessages = [];
        $scope.backuping = true;
        $scope.backupResult = "- in progress";

        syncService.getYearForBackup(year)
            .then(function (records) {
                client.writeFile(
                    settingsService.settings.dropboxFolder + '/' + filename,
                    JSON.stringify(records),
                    function (error /*, stat*/) {
                        if (error) {
                            errorService.reportError(
                                "failure saving the backup to Dropbox"
                            );
                        }

                        $scope.backuping = false;
                        $scope.backupResult = "- finished";
                    }
                );
            });
    };

    $scope.listFiles = function () {
        $scope.listing = true;

        client.readdir(
            settingsService.settings.dropboxFolder,
            function (error, names, dirData, entries) {
                if (error) {
                    errorService.reportError(
                        "failure listing Dropbox files"
                    );
                }

                $scope.listing = false;
                $scope.files = entries;
            }
        );
    };

    $scope.migrateFile = function (path) {
        $scope.migrating = true;
        $scope.migrationResult = " - in progress";

        client.readFile(
            settingsService.settings.dropboxFolder + '/' + path,
            function (error, data) {
                if (error) {
                    data = "[]";
                    errorService.reportError(
                        "failure reading the file from Dropbox"
                    );
                }

                syncService.updateLocalRecords(JSON.parse(data))
                    .finally(function () {
                        $scope.migrating = false;
                        $scope.migrationResult = " - finished";
                    });
            }
        );
    };

    $scope.autoSync = function () {
        syncService.sync();
    };
};
