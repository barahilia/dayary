migrateService = function ($http, $q, dbService) {

    var migrateRecord = function (record, message) {
        return $http.get("/api/records/" + record.id)
            .then(
                function (data) { return data.data; },
                function (error) {
                    message("Error getting record id " + record.id);
                }
            )
            .then(dbService.updateRecord)
            .then(
                function () {
                    message(
                        "Saved text for record #" + record.id +
                        " from " + record.created
                    );
                },
                function (error) { message(error); }
            );
    };

    var service = {};

    service.migrate = function (message) {
        var records;

        return $http.get("/api/records")
            .then(
                function (data) {
                    records = data.data;
                    message("Got " + records.length + " records metadata");
                    return records;
                },
                function (error) {
                    message("Error getting metadata");
                }
            )
            .then(
                _.partial(dbService.setAllRecords, _, message),
                message
            )
            .then(function () {
                return $q.all(
                    _.map(records, _.partial(migrateRecord, _, message))
                );
            })
            .then(function () {
                message("Finished getting all records text");
            });
    };

    service.getYearForBackup = function (year) {
        return dbService.getYearlyRecords(year);
    };

    return service;
};
