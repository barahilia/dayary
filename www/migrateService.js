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

    service.getYearForBackup = function (year, messageCallback, doneCallback) {

        var callFor = function (record, message) {
            messageCallback(
                "#" + record.id +
                " - " + record.created +
                " - " + message
            );
        };

        var yearlyRecords = _.filter(
            records,
            function (record) {
                return year == moment(record.created).year();
            }
        );

        var startRetrievalFromServer = _.map(
            yearlyRecords,
            function (record) {
                if (record.text) {
                    callFor(record, "in memory");
                    return null;
                }

                return $http.get("/api/records/" + record.id)
                    .then(
                        function (data) {
                            record.text = data.data.text;
                            callFor(record, "retrieved");
                        },
                        function () { callFor(record, "failure"); }
                    );
            }
        );

        $q.all(
            _.filter(startRetrievalFromServer)
        ).then(
            function () {
                doneCallback(
                    _.map(
                        yearlyRecords,
                        function (record) {
                            // Clear Angular attributes
                            return _.omit(record, "$$hashKey");
                        }
                    )
                );
            }
        );
    };

    return service;
};
