var dropboxCtrl = function (
    $scope, errorService, settingsService, migrateService
) {

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

        migrateService.getYearForBackup(
            year,
            _.bind(Array.prototype.push, $scope.backupMessages),
            function (records) {
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
            }
        );
    };
};
