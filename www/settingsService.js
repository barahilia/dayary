var settingsService = function () {
    var service = {};

    service.settings = {
        autosaveIntervalSec: 30,
        lockTimeoutMin: 5,
        lockOnBlur: true
    };

    service.hash = null;

    service.initialized = false;

    return service;
};

