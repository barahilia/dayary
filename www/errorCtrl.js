var errorCtrl = function ($scope, errorService) {
    errorService.setCallback(function (error) {
        $scope.error = error;
    });

    $scope.unsetError = function () {
        $scope.error = null;
    };
};

