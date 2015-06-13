var recordsService = function ($http) {
    var service = {};

    // Local representation of the records db/collection
    // TODO: consider not touching the original array so external references
    // won't be harmed
    // TODO: decide if the array index should be by id (remember deletions)
    // TODO: decide if to leave this directly accessible or through getAll()
    service.records = [];

    // CRUD:
    // Get all
    service.getAll = function () {
        // TODO: Decide if to return internal array if it exists. It might
        // inadvertently change in backend... But this is only in case of bug
        // since we have only one user. So the only real difficulty is to create
        // an $http-like return object with success and error functions

        return $http.get("/api/records")
            .success(function (data) {
                data = _.sortBy(data, 'created');
                data = data.reverse();

                service.records = data;
            })
    };
    // Create
    // Read
    // Update
    // Delete

    return service;
};

