import { isDevelopment, version } from './environment.js';

export var bannerCtrl = function (
    $scope, lockService, errorService, dropboxService
) {

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

    // A small sign for the background token refresh the app starts on its
    // own - spinning while it runs, a Dropbox mark once the service can be
    // used, and nothing at all before it starts or after it fails.
    $scope.dropboxPreparing = dropboxService.isPreparing;
    $scope.dropboxReady = dropboxService.isReady;

    $scope.showMenu = false;

    $scope.toggleMenu = function () {
        $scope.showMenu = ! $scope.showMenu;
    };

    $scope.unsetError = function () {
        $scope.error = null;
    };
};

bannerCtrl.$inject = ['$scope', 'lockService', 'errorService', 'dropboxService'];
