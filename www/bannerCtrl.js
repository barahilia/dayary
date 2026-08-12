import { isDevelopment } from './environment.js';

export var bannerCtrl = function ($scope, lockService, errorService) {

    // The template is bundled as a raw string, so it cannot see the module
    // and gets the flag through the scope.
    $scope.dev = isDevelopment;

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
