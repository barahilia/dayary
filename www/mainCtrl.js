var mainCtrl = function (
    $scope, $http, $timeout, $interval,
    errorService, recordService, encryptionService
) {
    // TODO: make it list of states
    $scope.settingsEdit = { show: false };

    $scope.states = {
        viewing: true,
        editing: false//,
        //settings: false
    };
}

