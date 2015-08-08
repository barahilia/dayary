var dbService = function (errorService) {
    var db;

    var executeSingleQuery = function (query, input, callback) {
        var success = function (tx, result) {
            callback(null, result);
        };

        var failure = function (tx, error) {
            errorService.reportError("db error: " + error.message);
            callback(error.message);
        };

        callback = callback || function () {};

        db.transaction(function (tx) {
            tx.executeSql(query, input, success, failure);
        });
    };


    var service = {};

    service.init = function () {
        db = openDatabase("dayary", "0.8", "Dayary DB", 5 * 1000 * 1000);

        executeSingleQuery(
            "CREATE TABLE IF NOT EXISTS Records (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "created TEXT," +
                "updated TEXT," +
                "text TEXT" +
            ")"
        );
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

    // TODO: think if return an error if record doesn't exist
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
