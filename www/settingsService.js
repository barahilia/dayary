var settingsService = function () {
    var service = {};

    service.initialized = false;

    service.settings = {
        autosaveIntervalSec: 30,
        lockTimeoutMin: 5,
        lockOnBlur: true,
        dropboxFolder: "backups/dayary"
    };

    service.hash = null;

    service.initialize = function (settings) {
        // TODO: save serialized values in backend, not string - then
        // no need to parse here
        service.settings.autosaveIntervalSec = +settings.autosaveIntervalSec;
        service.settings.lockTimeoutMin = +settings.lockTimeoutMin;
        service.settings.lockOnBlur = settings.lockOnBlur == 1 ? true : false;
        service.settings.dropboxFolder = settings.dropboxFolder;

        service.hash = settings.hash;

        service.initialized = true;
    };

    return service;
};

