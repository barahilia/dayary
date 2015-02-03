// TODO: replace this with ui-router state
var recordService = function () {
    var service = {};
    
    var callback;
    
    service.setCallback = function (fn) {
        callback = fn;
    };
    
    service.setRecordId = function (recordId) {
        service.records.empty = false;

        if (callback) {
            callback(recordId);
        }
    };

    service.records = {
        empty: true,
        current: null
    };
    service.autosaveInterval = { seconds: 30 };

    return service;
};

