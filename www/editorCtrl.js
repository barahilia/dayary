var editorCtrl = function (
    $scope, $timeout, $interval, $state,
    recordsService, encryptionService, settingsService
) {
    var autosaving;

    var saveRecord = function () {
        var record;

        $scope.record.updated = moment().format();

        record = _.pick($scope.record, "id", "created", "updated");
        record.text = encryptionService.encrypt($scope.record.text);

        recordsService.updateRecord(record, function (err) {
            if (!err) {
                $scope.textChanged = false;
                $scope.saved = "saved on " + moment().format('hh:mm');

                // TODO: move to alert service
                $timeout(
                    function () {
                        $scope.saved = "";
                    },
                    3000
                );
            }
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

