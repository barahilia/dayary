var settingsService = function () {
    var service = {};

    service.settings = {
        passphrase: "",
        autosaveIntervalSec: 30,
        lockTimeoutMin: 5,
        lockOnBlur: true
    };

    service.initialized = false;

    return service;
};
