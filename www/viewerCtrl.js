var viewerCtrl = function (
    $scope, $http,
    $state, $stateParams,
    recordService, encryptionService, errorService
) {
    var recordId = $stateParams.id;

    if (recordService.records.current === null ||
        recordId !== recordService.records.current.id) {

        $http.get("/api/records/" + recordId)
            .success(function (record) {
                try {
                    record.text = encryptionService.decrypt(record.text);
                    $scope.record = recordService.records.current = record;
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
    };

    $scope.record = recordService.records.current;

    $scope.startEdit = function () {
        $state.go('.editor', $stateParams);
    };
};

