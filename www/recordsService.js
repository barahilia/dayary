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

    // Create
    // Read
    // Update
    // Delete

    return service;
};

