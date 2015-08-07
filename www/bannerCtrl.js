bannerCtrl = function ($scope, lockService) {

    $scope.lock = function () {
        lockService.lock();
    };

    $scope.locked = lockService.locked;
};
