var recordsService = function ($http, $q, errorService, dbService) {

    // TODO: this service might become redundant after dbService is operational

    // Design decision: this service should depend on errorService and report
    // errors itself. While it might not stricly follow the SRP and introduce
    // eliminatable dependency, the benefits are strong enough: the user can
    // do nothing about an error here and this service has all the information
    // needed to report error properly.


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

        $http.get("/api/records")
            .success(function (data) {
                message("got " + data.length + " records metadata");

                dbService.setAllRecords(data, message, done);
                //done();
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
                $http.get("/api/records/" + id)
                    .success(function (data) {
                        _.extend(record, data);
                        callback(null, data);
                    })
                    .error(function () {
                        errorService.reportError(
                            "failure while loading the data for record: " + recordId
                        );
                        callback(true);
                    });
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

