var lockCtrl = function ($scope, lockService) {

    $scope.showPassphrase = true;


    $scope.invalidPassphrase = function () {
        return $scope.passphrase &&
               ! lockService.validPassphrase($scope.passphrase);
    };

    $scope.enter = function () {
        var hash;

        if ($scope.invalidPassphrase()) {
            return;
        }

        lockService.unlock($scope.passphrase);
    };
};

