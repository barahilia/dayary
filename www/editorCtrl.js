var editorCtrl = function (
    $scope, $http, $timeout, $interval,
    encryptionService, errorService, recordService
) {
    var autosaving;

    var saveRecord = function (record) {
        var encrypted = encryptionService.encrypt(record.text);

        $http.put("/api/records/" + record.id, encrypted)
            .success(function () {
                // TODO: use moment.js instead of Date
                $scope.saved = "saved on " + (new Date());

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
            saveRecord($scope.record);
        },
        recordService.autosaveInterval.seconds * 1000
    );

    $scope.record = recordService.current;
    $scope.states.viewing = false;

    $scope.view = function () {
        $scope.states.viewing = true;
    };

    $scope.$on('$destroy', function() {
        // Make sure that the interval is destroyed too
        stopAutosaving();

        saveRecord($scope.record);
    });
};

