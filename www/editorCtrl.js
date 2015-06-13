var editorCtrl = function (
    $scope, $http, $timeout, $interval,
    $state,
    encryptionService, errorService, settingsService
) {
    var autosaving;

    var saveRecord = function () {
        var encrypted, record;

        $scope.record.updated = moment().format();

        encrypted = encryptionService.encrypt($scope.record.text);
        // TODO: use clone
        record = {
            id: $scope.record.id,
            created: $scope.record.created,
            updated: $scope.record.updated,
            text: encrypted
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
            if ($scope.textChanged) {
                saveRecord();
            }
        },
        settingsService.settings.autosaveIntervalSec * 1000
    );

    $scope.view = function () {
        $state.go('^');
    };

    $scope.setCreated = function () {
        if ($scope.settingCreated) {
            $scope.settingCreated = false;
            // TODO: add recordsService and update the creation date there
            saveRecord();
        }
        else {
            $scope.settingCreated = true;
        }
    };

    $scope.$on('$destroy', function() {
        stopAutosaving();
        if ($scope.textChanged) {
            saveRecord();
        }
    });
};
