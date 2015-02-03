// TODO: replace this with ui-router state
var recordService = function () {
    var service = {};
    
    var callback;
    
    service.setCallback = function (fn) {
        callback = fn;
    };
    
    service.setRecordId = function (recordId) {
        if (callback) {
            callback(recordId);
        }
    };

    service.current;
    service.autosaveInterval = { seconds: 30 };

    return service;
};

