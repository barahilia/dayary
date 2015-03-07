var settingsService = function () {
    var service = {};

    // TODO: don't save passphrase in settingsService
    // TODO: save hash independently; save it here - no need in encryptionService
    service.settings = {
        passphrase: "",
        autosaveIntervalSec: 30,
        lockTimeoutMin: 5,
        lockOnBlur: true
    };

    service.initialized = false;

    return service;
};
