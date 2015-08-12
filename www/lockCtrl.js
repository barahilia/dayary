var lockCtrl = function ($scope, lockService) {

    $scope.invalidPassphrase = function () {
        return ! lockService.validPassphrase($scope.passphrase);
    };

    $scope.enter = function () {
        var hash;

        if ($scope.invalidPassphrase()) {
            return;
        }

        lockService.unlock($scope.passphrase);
    };
};

