migrateService = function ($http, $q, dbService) {

    var migrateRecord = function (record) {
        return $http.get("/api/records/" + record.id)
            .then(
                function (data) { return data.data; },
                function (error) {
                    message("error getting record id " + record.id);
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

    // TODO: use promise progress update instead of message
    service.migrate = function (message) {
        var records;

        return $http.get("/api/records")
            .then(
                function (data) {
                    message("got " + data.data.length + " records metadata");
                    return data.data;
                },
                function (error) {
                    message("error getting metadata");
                }
            )
            .then(dbService.setAllRecords)
            .then(function () {
                var processOne = function () {
                    if (processed == data.length) {
                        message("Finished getting all records text");
                    }
                };

                if (error) {
                    message(error);
                }

                $q.all(_.map(records, migrateRecord));
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

