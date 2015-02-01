var editorCtrl = function () {
    var stopAutosave;

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

    var savePrevious = function () {
        if ($scope.selected && $scope.states.editing) {
            saveRecord($scope.selected);
        }
    };

    var stopAutosaving = function () {
        if (stopAutosave) {
            $interval.cancel(stopAutosave);
        }
    };

    // TODO: rename to autosaving; leave here
    stopAutosave = $interval(
        function () {
            saveRecord($scope.selected);
        },
        recordService.autosaveInterval.seconds * 1000
    );

    $scope.stopEdit = function (record) {
        $scope.states.editing = false;
        stopAutosaving();

        if (record) {
            saveRecord(record);
        }
    };

    $scope.view = function (record) {
        $scope.stopEdit(record);
    };

    $scope.$on('$destroy', function() {
        // Make sure that the interval is destroyed too
        stopAutosaving();

        saveRecord($scope.selected);
    });
};

