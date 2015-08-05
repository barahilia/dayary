var dbService = function (errorService) {
    var db;

    var executeSingleQuery = function (query, callback, input) {
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

    service.addRecord = function (record, callback) {
        executeSingleQuery(
            "INSERT INTO Records (created, updated) VALUES (?, ?)",
            function (error, data) {
                if (error) {
                    callback(error);
                }
                else {
                    service.getRecord(data.insertId, callback);
                }
            },
            [record.created, record.updated]
        );
    };

    service.getRecord = function (id, callback) {
        executeSingleQuery(
            "SELECT * FROM Records WHERE id = ?",
            function (error, data) {
                if (error) {
                    callback(error);
                }
                else {
                    callback(null, data.rows.item(0));
                }
            },
            [id]
        );
    };

    service.updateRecord = function (record, callback) {
        executeSingleQuery(
            "UPDATE Records " +
            "SET created = ?, updated = ?, text = ? " +
            "WHERE id = ?",
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
            },
            [record.created, record.updated, record.text, record.id]
        );
    };

    // TODO: think if return an error if record doesn't exist
    service.deleteRecord = function (id, callback) {
        executeSingleQuery(
            "DELETE FROM Records WHERE id = ?",
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
            },
            [id]
        );
    };

    return service;
};
