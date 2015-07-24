var dropboxCtrl = function ($scope, errorService, recordsService) {

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
        var timestamp = moment().format("YYYYMMDDhhmmss");
        var filename = "" + year + '_' + timestamp + ".json";
        // TODO: get this from settings; decide if should be configurable
        var folder = "backups/dayary";
        var records, json;

        $scope.backuping = true;
        $scope.backupResult = "";

        records = recordsService.getYear(year);
        json = JSON.stringify(records);

        client.writeFile(
            folder + '/' + filename,
            json,
            function (error /*, stat*/) {
                if (error) {
                    errorService.reportError(
                        "failure saving the backup to Dropbox"
                    );
                }

                $scope.backuping = false;
                $scope.backupResult = "finished";
            }
        );
    };
};
