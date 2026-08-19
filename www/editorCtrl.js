import { format, formatISO } from 'date-fns';

export var editorCtrl = function (
    $scope, $timeout, $interval, $state,
    dbService, encryptionService, settingsService
) {
    var autosaving;

    var saveRecord = function () {
        var record;

        $scope.record.updated = formatISO(new Date());

        record = {
            id: $scope.record.id,
            created: $scope.record.created,
            updated: $scope.record.updated
        };

        // A save rebuilds the record field by field, so the device it was
        // written on has to be carried over or it would be dropped here on
        // the first edit. Records from before the field have none, and stay
        // that way rather than claiming the device editing them now.
        if ($scope.record.device) {
            record.device = $scope.record.device;
        }

        record.text = encryptionService.encrypt($scope.record.text);

        dbService.updateRecord(record)
            .then(function () {
                $scope.textChanged = false;
                $scope.saved = "saved on " + format(new Date(), 'hh:mm');

                // TODO: move to alert service
                $timeout(
                    function () {
                        $scope.saved = "";
                    },
                    3000
                );
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

editorCtrl.$inject = ['$scope', '$timeout', '$interval', '$state', 'dbService', 'encryptionService', 'settingsService'];
