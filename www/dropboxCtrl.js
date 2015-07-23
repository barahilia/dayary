var dropboxCtrl = function ($scope, settingsService, errorService) {

    var client = new Dropbox.Client({ key: "4hxwutae96fhhbd" });

    $scope.isAuthenticated = false;
    $scope.dropboxUser = "N/A";

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
};
