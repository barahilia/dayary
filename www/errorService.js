var errorService = function () {
    var service = {};
    
    var callback;
    
    service.setCallback = function (fn) {
        callback = fn;
    };
    
    service.reportError = function (error) {
        if (callback) {
            callback(error);
        }
    };
    
    return service;
};

