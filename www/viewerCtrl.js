var viewerCtrl = function (
    $scope, $http, recordService, encryptionService, errorService
) {
    var select = function (recordId) {
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
    $scope.states.editing = false;

    recordService.setCallback(select);

    $scope.startEdit = function () {
        $scope.states.editing = true;
    };
};

