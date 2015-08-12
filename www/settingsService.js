var settingsService = function () {

    // TODO: consider removing this service; leave a constant only
    var service = {};

    service.settings = {
        autosaveIntervalSec: 30,
        lockTimeoutMin: 5,
        lockOnBlur: true,
        dropboxFolder: "backups/dayary"
    };

    service.init = function (settings) {
        service.settings = settings;
    };

    return service;
};

