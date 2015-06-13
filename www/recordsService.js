var recordsService = function ($http) {

    var simulateSuccessfulResponse = function () {
        var ret = {
            success: function (callback) {
                callback();
                return ret;
            },
            error: function () {
                return ret;
            }
        };

        return ret;
    };


    var service = {};


    // Local representation of the records db/collection
    // TODO: decide if the array index should be by id (remember deletions)
    // TODO: decide if to leave this directly accessible or through getAll()
    service.records = null;

    service.getAll = function () {
        if (service.records === null) {
            return $http.get("/api/records")
                .success(function (data) {
                    data = _.sortBy(data, 'created');
                    data = data.reverse();

                    service.records = data;
                });
        }
        else {
            return simulateSuccessfulResponse();
        }
    };

    // Create
    // Read
    // Update
    // Delete

    return service;
};

