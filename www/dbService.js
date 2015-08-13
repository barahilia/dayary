var dbService = function ($q, errorService) {
    var db;

    var query = function (query, input) {
        var deferred = $q.defer();

        var success = function (tx, result) {
            deferred.resolve(result);
        };

        var failure = function (tx, error) {
            errorService.reportError("db error: " + error.message);
            deferred.reject(error.message);
        };

        db.transaction(function (tx) {
            tx.executeSql(query, input, success, failure);
        });

        return deferred.promise;
    };


    var service = {};

    service.init = function () {
        var tables;

        db = openDatabase("dayary", "0.8", "Dayary DB", 5 * 1000 * 1000);

        tables = [
            "CREATE TABLE IF NOT EXISTS Hash (" +
                "hash VARCHAR" +
            ")",
            "CREATE TABLE IF NOT EXISTS Settings (" +
                "key VARCHAR PRIMARY KEY," +
                "value VARCHAR" +
            ")",
            "CREATE TABLE IF NOT EXISTS Records (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "created TEXT," +
                "updated TEXT," +
                "text TEXT" +
            ")"
        ];

        return $q.all(_.map(tables, _.partial(query, _, undefined)));
    };

    service.getHash = function () {
        return query("SELECT hash FROM Hash")
            .then(function (result) {
                if (result.rows.length === 0) {
                    // It's OK - not set yet
                    return null;
                }
                else {
                    return result.rows.item(0).hash;
                }
            });
    };

    service.setHash = function (hash) {
        return service.getHash()
            .then(function (oldHash) {
                if (oldHash) {
                    throw "Cannot override an existing hash";
                }

                return query("INSERT INTO Hash (hash) VALUES (?)", [hash]);
            });
    };

    service.getSettings = function () {
        return query("SELECT key, value FROM Settings")
            .then(function (result) {
                var settings = {};

                _.each(_.range(result.rows.length), function (index) {
                    var s = result.rows.item(index);
                    settings[s.key] = JSON.parse(s.value)
                });

                return settings;
            });
    };

    service.setSettings = function (settings) {
        return $q.all(
            _.map(settings, function (value, key) {
                return query(
                    "INSERT OR REPLACE INTO " +
                    "Settings (key, value) VALUES (?, ?)",
                    [key, JSON.stringify(value)]
                );
            })
        );
    };

    service.getAllRecords = function (callback) {
        return query("SELECT id, created, updated FROM Records")
            .then(function (result) {
                return _.map(
                    _.range(result.rows.length),
                    result.rows.item,
                    result.rows
                );
            });
    };

    service.setAllRecords = function (records, message, done) {
        var processed = 0;

        query(
            "DELETE FROM Records",
            null,
            message
        );

        _.each(records, function (record) {
            query(
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

    service.addRecord = function (record) {
        return query(
            "INSERT INTO Records (created, updated) VALUES (?, ?)",
            [record.created, record.updated]
        ).then(function (result) {
            return service.getRecord(result.insertId);
        });
    };

    service.getRecord = function (id) {
        return query("SELECT * FROM Records WHERE id = ?", [id])
            .then(function (result) {
                var message;

                if (result.rows.length !== 1) {
                    message = "get record: not found or ambiguous id";
                    errorService.reportError(message);
                    throw message;
                }

                return result.rows.item(0);
            }
        );
    };

    service.updateRecord = function (record) {
        return query(
            "UPDATE Records " +
            "SET created = ?, updated = ?, text = ? " +
            "WHERE id = ?",
            [record.created, record.updated, record.text, record.id]
        ).then(function (result) {
            var message;

            if (result.rowsAffected !== 1) {
                message = "update record: failure updating or no changes";
                errorService.reportError(message);
                throw message;
            }
        });
    };

    service.deleteRecord = function (id) {
        return query("DELETE FROM Records WHERE id = ?", [id])
            .then(function (result) {
                var message;

                if (result.rowsAffected !== 1) {
                    message = "wasn't able to delete or no such id found";
                    errorService.reportError(message);
                    throw message;
                }
            });
    };

    return service;
};
