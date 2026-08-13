import { isDevelopment, version } from './environment.js';

export var bannerCtrl = function ($scope, lockService, errorService) {

    // The template is bundled as a raw string, so it cannot see the module
    // and gets the flag and the version through the scope.
    $scope.dev = isDevelopment;
    $scope.version = version;

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

bannerCtrl.$inject = ['$scope', 'lockService', 'errorService'];
