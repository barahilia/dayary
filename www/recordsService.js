var recordsService = function ($http, $q, dbService) {

    // TODO: this service might become redundant after dbService is operational

    var service = {};

    // Local representation of the records db/collection
    // Text here is encrypted and decrypted only by the users - viewer & editor
    // Get returns a copy of the object to guard against accidental change
    // that won't persist.
    var records = [];


    service.records = function () {
        return records;
    };

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


    service.getAll = function (callback) {
        // TODO: complete this.
        if (_.any(records)) {
            callback(null, records);
            return;
        }

        // TODO: call this once automatically at service init or call
        // from app.run
        dbService.getAllRecords(function (error, data) {
            if (error) {
                callback(true);
                return;
            }

            data = _.sortBy(data, 'created');
            data = data.reverse();

            records = data;
            callback(null, records);
        });
    };

    service.addRecord = function (record, callback) {
        dbService.addRecord(record, function (error, newRecord) {
            if (error) {
                callback(error);
            }
            else {
                records.unshift(newRecord);
                callback(null, newRecord);
            }
        });
    };

    service.getRecord = function (id, callback) {
        var record = _.findWhere(records, {id: id});

        if (record.text) {
            callback(null, _.clone(record));
            return;
        }

        dbService.getRecord(id, function (error, data) {
            if (error) {
                callback(error);
            }
            else {
                _.extend(record, data);
                callback(null, data);
            }
        });
    };

    service.updateRecord = function (record, callback) {
        dbService.updateRecord(record, function (error) {
            if (error) {
                callback(error);
            }
            else {
                var internalRecord = _.findWhere(records, {id: record.id});
                _.extend(internalRecord, record);

                callback(null);
            }
        });
    };

    service.deleteRecord = function (record, callback) {
        dbService.deleteRecord(record.id, function (error) {
            if (error) {
                callback(error);
            }
            else {
                records = _.without(records, record);
                callback(null);
            }
        });
    };


    return service;
};

