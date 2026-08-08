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
