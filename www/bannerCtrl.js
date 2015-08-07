bannerCtrl = function ($scope, lockService, errorService) {

    $scope.lock = function () {
        lockService.lock();
    };

    $scope.locked = lockService.locked;

    errorService.setCallback(function (error) {
        $scope.error = error;
    });

    $scope.unsetError = function () {
        $scope.error = null;
    };
};
