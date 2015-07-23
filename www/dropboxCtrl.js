var dropboxCtrl = function ($scope, settingsService) {

    var client = new Dropbox.Client({ key: "4hxwutae96fhhbd" });

    $scope.isAuthenticated = false;
    $scope.dropboxUser = "N/A";

    client.authenticate({interactive: false}, function(error, client) {
        if (error) {
            console.log(error);
            return;
        }

        if (client.isAuthenticated()) {
            $scope.isAuthenticated = true;
            client.getAccountInfo(function(error, accountInfo) {
                $scope.dropboxUser = accountInfo.name
            });
        }
    });

    $scope.login = function () {
        console.log("logging in...");
        client.authenticate(function(error, client) {
            if (error) {
                console.log(error);
            }
        });
    };
};
