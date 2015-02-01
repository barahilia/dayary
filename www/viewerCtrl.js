var viewerCtrl = function (
    $scope, $http, recordService, encryptionService, errorService
) {
    var select = function (recordId) {
        $http.get("/api/records/" + recordId)
            .success(function (record) {
                try {
                    record.text = encryptionService.decrypt(record.text);

                    $scope.states.editing = false;
                    $scope.states.viewing = true;
                    $scope.record = recordService.current = record;
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

    recordService.setCallback(select);
    //select(recordService.id);

    $scope.startEdit = function () {
        $scope.states.editing = true;
    };
};

