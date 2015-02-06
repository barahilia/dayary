var viewerCtrl = function (
    $scope, $http,
    $state, $stateParams,
    encryptionService, errorService
) {
    var recordId = $stateParams.id;
    $scope.$state = $state;

    $http.get("/api/records/" + recordId)
        .success(function (record) {
            try {
                record.text = encryptionService.decrypt(record.text);
                $scope.record = record;
            }
            catch (e) {
                errorService.reportError(
                    "Unable to decrypt [" + record.created + "]"
                );
            }
        })
        .error(function () {
            errorService.reportError(
                "failure while loading the data for record: " + recordId
            );
        });

    $scope.startEdit = function () {
        $state.go('.edit', $stateParams);
    };
};

