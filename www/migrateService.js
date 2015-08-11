migrateService = function ($http, $q, dbService) {

    var service = {};

    service.migrate = function (message, done) {
        // TODO: fix multiple issues:
        //      - too long function
        //      - reused data
        //      - use promises

        $http.get("/api/records")
            .success(function (data) {
                message("got " + data.length + " records metadata");

                dbService.setAllRecords(
                    data,
                    message,
                    function () {
                        dbService.getAllRecords(function (error, data) {
                            var processed = 0;

                            var processOne = function () {
                                processed++;
                                if (processed == data.length) {
                                    message("Finished getting all records text");
                                    done();
                                }
                            };

                            if (error) {
                                message(error);
                                done();
                                return;
                            }

                            _.each(data, function (record) {
                                $http.get("/api/records/" + record.id)
                                    .success(function (data) {
                                        dbService.updateRecord(
                                            data,
                                            function (error) {
                                                if (error) {
                                                    message(error);
                                                }
                                                else {
                                                    message(
                                                        "Saved text for record #" + record.id +
                                                        " from " + record.created
                                                    );
                                                }
                                                processOne();
                                            }
                                        );
                                    })
                                    .error(function () {
                                        message("error getting record id " + record.id);
                                        processOne();
                                    });
                            });
                        });
                    }
                );
            })
            .error(function () {
                message("error getting metadata");
                done();
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

