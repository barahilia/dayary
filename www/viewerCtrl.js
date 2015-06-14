var viewerCtrl = function (
    $scope, $state,
    recordsService, encryptionService, errorService
) {
    var recordId = $state.params.id;
    $scope.$state = $state;

    $scope.loadingRecord = true;

    recordsService.getRecord(recordId, function (err, record) {
        $scope.loadingRecord = false;

        if (err) {
            return;
        }

        try {
            // TODO: beware of security - locking to forget all decrypted ones
            record.text = encryptionService.decrypt(record.text);
            $scope.record = record;
        }
        catch (e) {
            errorService.reportError(
                "Unable to decrypt [" + record.created + "]"
            );
        }
    });

    $scope.startEdit = function () {
        $state.go('.edit', $state.params);
    };
};

