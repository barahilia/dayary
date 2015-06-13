var recordsService = function ($http, errorService) {

    // Design decision: this service should depend on errorService and report
    // errors itself. While it might not stricly follow the SRP and introduce
    // eliminatable dependency, the benefits are strong enough: the user can
    // do nothing about an error here and this service has all the information
    // needed to report error properly.


    var service = {};

    // Local representation of the records db/collection
    // TODO: decide if the array index should be by id (remember deletions)
    var records;


    service.records = function () {
        return records;
    };

    service.getAll = function (callback) {
        if (records) {
            callback(null, records);
        }
        else {
            // TODO: call this once automatically at service init or call
            // from app.run
            $http.get("/api/records")
                .success(function (data) {
                    data = _.sortBy(data, 'created');
                    data = data.reverse();

                    records = data;
                    callback(null, records);
                })
                .error(function () {
                    errorService.reportError("failure loading records list");
                    callback(true);
                });
        }
    };

    service.addRecord = function (record, callback) {
        $http.post("/api/records", record)
            .success(function (newRecord) {
                records.unshift(newRecord);
                callback(null, newRecord);
            })
            .error(function () {
                errorService.reportError("can't add new record");
                callback(true);
            });
    };

    service.getRecord = function (id, callback) {
    };

    service.updateRecord = function (record, callback) {
    };

    service.deleteRecord = function (id, callback) {
        $http.delete("/api/records/" + record.id)
            .success(function () {
                records = _.without(records, record);
                callback(null);
            })
            .error(function () {
                errorService.reportError("can't remove this record");
                callback(true);
            });
    };

    return service;
};

