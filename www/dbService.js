var dbService = function (errorService) {
    var db;

    var executeSingleQuery = function (query, input) {
        var deferred = $q.deferred;

        var success = function (tx, result) {
            deferred.resolve(
                result.rows,
                result.rowsAffected,
                result.insertId
            );
        };

        var failure = function (tx, error) {
            errorService.reportError("db error: " + error.message);
            deferred.reject(error.message);
        };

        db.transaction(function (tx) {
            tx.executeSql(query, input, success, failure);
        });

        return deferred.promise; // TODO: promise() ?
    };


    var service = {};

    service.init = function () {
        db = openDatabase("dayary", "0.8", "Dayary DB", 5 * 1000 * 1000);

        executeSingleQuery(
            "CREATE TABLE IF NOT EXISTS Hash (" +
                "hash VARCHAR" +
            ")"
        );
        executeSingleQuery(
            "CREATE TABLE IF NOT EXISTS Settings (" +
                "key VARCHAR PRIMARY KEY," +
                "value VARCHAR" +
            ")"
        );
        executeSingleQuery(
            "CREATE TABLE IF NOT EXISTS Records (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "created TEXT," +
                "updated TEXT," +
                "text TEXT" +
            ")"
        );
    };

    service.getHash = function (callback) {
        executeSingleQuery(
            "SELECT hash FROM Hash",
            null,
            function (error, data) {
                if (error) {
                    callback(error);
                }
                else if (data.rows.length === 0) {
                    // It's OK - not set yet
                    callback(null, null);
                }
                else {
                    callback(null, data.rows.item(0).hash);
                }
            }
        );
    };

    service.setHash = function (hash, callback) {
        // TODO: ensure cannot override existing one
        executeSingleQuery(
            "INSERT INTO Hash (hash) VALUES (?)",
            [hash],
            function (error, data) {
                if (error) {
                    callback(error);
                }
                else {
                    callback(null);
                }
            }
        );
    };

    service.getSettings = function (callback) {
        executeSingleQuery(
            "SELECT key, value FROM Settings",
            null,
            function (error, data) {
                var settings = {};

                if (error) {
                    callback(error);
                }
                else {
                    _.each(_.range(data.rows.length), function (index) {
                        var s = data.rows.item(index);
                        settings[s.key] = JSON.parse(s.value)
                    });

                    callback(null, settings);
                }
            }
        );
    };

    service.setSettings = function (settings, callback) {
        var processed = 0;

        _.each(settings, function (value, key) {
            executeSingleQuery(
                "INSERT OR REPLACE INTO Settings (key, value) VALUES (?, ?)",
                [key, JSON.stringify(value)],
                function (error) {
                    if (error) {
                        callback(error);
                    }

                    processed++;
                    if (processed === _.size(settings)) {
                        callback();
                    }
                }
            );
        });
    };

    service.getAllRecords = function (callback) {
        executeSingleQuery(
            "SELECT id, created, updated FROM Records",
            null,
            function (error, data) {
                if (error) {
                    callback(error);
                }
                else {
                    callback(
                        null,
                        _.map(_.range(data.rows.length), function (index) {
                            return data.rows.item(index);
                        })
                    );
                }
            }
        );
    };

    service.setAllRecords = function (records, message, done) {
        var processed = 0;

        executeSingleQuery(
            "DELETE FROM Records",
            null,
            message
        );

        _.each(records, function (record) {
            executeSingleQuery(
                "INSERT INTO Records (id, created, updated) VALUES (?, ?, ?)",
                [record.id, record.created, record.updated],
                function (error) {
                    if (error) {
                        message(error);
                    }

                    processed++;
                    if (processed == records.length) {
                        message("Finished inserting");
                        done();
                    }
                }
            );
        });
    };

    service.addRecord = function (record, callback) {
        executeSingleQuery(
            "INSERT INTO Records (created, updated) VALUES (?, ?)",
            [record.created, record.updated],
            function (error, data) {
                if (error) {
                    callback(error);
                }
                else {
                    service.getRecord(data.insertId, callback);
                }
            }
        );
    };

    service.getRecord = function (id, callback) {
        executeSingleQuery(
            "SELECT * FROM Records WHERE id = ?",
            [id],
            function (error, data) {
                if (error) {
                    callback(error);
                }
                else if (data.rows.length !== 1) {
                    message = "get record: not found or ambiguous id";
                    errorService.reportError(message);
                    callback(message);
                }
                else {
                    callback(null, data.rows.item(0));
                }
            }
        );
    };

    service.updateRecord = function (record, callback) {
        executeSingleQuery(
            "UPDATE Records " +
            "SET created = ?, updated = ?, text = ? " +
            "WHERE id = ?",

            [record.created, record.updated, record.text, record.id],

            function (error, data) {
                var message;

                if (error) {
                    callback(error);
                }
                else if (data.rowsAffected === 1) {
                    callback(null);
                }
                else {
                    message = "update record: failure updating or no changes";
                    errorService.reportError(message);
                    callback(message);
                }
            }
        );
    };

    service.deleteRecord = function (id, callback) {
        executeSingleQuery(
            "DELETE FROM Records WHERE id = ?",
            [id],
            function (error, data) {
                var message;

                if (error) {
                    callback(error);
                }
                else if (data.rowsAffected === 1) {
                    callback(null);
                }
                else {
                    message = "wasn't able to delete or no such id found";
                    errorService.reportError(message);
                    callback(message);
                }
            }
        );
    };

    return service;
};
