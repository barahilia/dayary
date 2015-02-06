var recordService = function () {
    var service = {};
    
    service.records = {
        empty: true,
        current: null
    };

    // TODO: move to the settingsService
    service.autosaveInterval = { seconds: 30 };

    return service;
};

