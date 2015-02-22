var editorCtrl = function (
    $scope, $http, $timeout, $interval,
    $state,
    encryptionService, errorService, recordService
) {
    var autosaving;

    var saveRecord = function () {
        if (!$scope.textChanged) {
            return;
        }

        var encrypted = encryptionService.encrypt($scope.record.text);
        var record = {
            id: $scope.record.id,
            text: encrypted,
            updated: moment().format()
        };

        $http.put("/api/records/" + record.id, record)
            .success(function () {
                $scope.textChanged = false;
                $scope.saved = "saved on " + moment().format('hh:mm');

                // TODO: move to alert service
                $timeout(
                    function () {
                        $scope.saved = "";
                    },
                    3000
                );
            })
            .error(function () {
                errorService.reportError("failure while saving the record");
            });
    };

    var stopAutosaving = function () {
        if (autosaving) {
            $interval.cancel(autosaving);
            autosaving = undefined;
        }
    };

    autosaving = $interval(
        function () {
            // TODO: check if any change was done
            saveRecord();
        },
        recordService.autosaveInterval.seconds * 1000
    );

    $scope.view = function () {
        $state.go('^');
    };

    $scope.$on('$destroy', function() {
        stopAutosaving();
        saveRecord();
    });
};
