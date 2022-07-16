var viewerCtrl = function (
    $scope, $state,
    dbService, encryptionService, errorService
) {
    var recordId = + $state.params.id;
    $scope.$state = $state;

    $scope.loadingRecord = true;

    dbService.getRecord(recordId)
        .then(function (record) {
            try {
                // TODO: beware of security - locking to forget all decrypted ones
                record.text = encryptionService.decrypt(record.text);
                $scope.record = record;
                $scope.paragraphs = record.text.split('\n');
            }
            catch (e) {
                errorService.reportError(
                    "Unable to decrypt [" + record.created + "]"
                );
            }
        })
        .finally(function () {
            $scope.loadingRecord = false;
        });

    $scope.startEdit = function () {
        $state.go('.edit', $state.params);
    };
};

