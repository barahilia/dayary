bannerCtrl = function ($scope, lockService, errorService) {

    errorService.setCallback(function (error) {
        $scope.error = error;
    });

    $scope.lock = function () {
        lockService.lock();
    };

    $scope.locked = lockService.locked;

    $scope.showMenu = false;

    $scope.toggleMenu = function () {
        $scope.showMenu = ! $scope.showMenu;
    };

    $scope.unsetError = function () {
        $scope.error = null;
    };
};
