var dbService = function ($q, errorService) {
    var db;

    // TODO: add convenience functions: selectOne, selectAll, deleteOne, ...

    // A caveat to be remembered: returning value of result.rows.item() might
    // be read-only. Observed in Chrome and Safari in iPad. Clone before use.
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

    var verifyOneRowAffected = function (result) {
        var affected = result.rowsAffected;
        var message = "affected rows: expected one, was " + affected;

        if (affected !== 1) {
            errorService.reportError(message);
            throw message;
        }
    };


    var service = {};

    service.init = function () {
        var tables;

        db = openDatabase("dayary", "0.8", "Dayary DB", 5 * 1000 * 1000);

        // In SQLite TEXT can be used for DATETIME
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
            ")",
            "CREATE TABLE IF NOT EXISTS Sync (" +
                "path VARCHAR PRIMARY KEY," +
                "lastImport TEXT," +
                "lastExport TEXT" +
            ")"
        ];

        return $q.all(_.map(tables, _.partial(query, _, undefined)));
    };

    service.cleanDb = function () {
        var tables = ["Hash", "Settings", "Records", "Sync"];

        return $q.all(_.map(tables, function (table) {
            return query("DROP TABLE IF EXISTS " + table);
        }));
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
                    throw "set hash: cannot replace existing hash";
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
                    settings[s.key] = JSON.parse(s.value);
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

    service.getAllRecords = function () {
        return query("SELECT id, created, updated FROM Records")
            .then(function (result) {
                return _.map(
                    _.range(result.rows.length),
                    function (i) {
                        return _.clone(result.rows.item(i));
                    }
                );
            });
    };

    service.setAllRecords = function (records, message) {
        return query("DELETE FROM Records")
            .catch(message)
            .then(function () {
                return $q.all(_.map(records, function (record) {
                    return query(
                        "INSERT INTO Records (id, created, updated) " +
                        "VALUES (?, ?, ?)",
                        [record.id, record.created, record.updated]
                    ).catch(message);
                }));
            }).then(function () {
                message("Finished inserting records metadata");
            });
    };

    service.getYearlyRecords = function (year) {
        return query(
            "SELECT * FROM Records WHERE created BETWEEN ? AND ?",
            [moment({ year: year }).format(),
             moment({ year: year + 1 }).format()]
        ).then(function (result) {
            return _.map(
                _.range(result.rows.length),
                function (i) {
                    return _.clone(result.rows.item(i));
                }
            );
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

                return _.clone(result.rows.item(0));
            }
        );
    };

    service.addRecord = function (record) {
        return query(
            "INSERT INTO Records (created, updated, text) VALUES (?, ?, ?)",
            [record.created, record.updated, record.text]
        ).then(function (result) {
            return service.getRecord(result.insertId);
        });
    };

    service.updateRecord = function (record) {
        return query(
            "UPDATE Records " +
            "SET created = ?, updated = ?, text = ? " +
            "WHERE id = ?",
            [record.created, record.updated, record.text, record.id]
        ).then(
            verifyOneRowAffected
        );
    };

    service.deleteRecord = function (id) {
        return query("DELETE FROM Records WHERE id = ?", [id])
            .then(verifyOneRowAffected);
    };

    service.getSyncStatus = function () {
        return query("SELECT * FROM Sync")
            .then(function (result) {
                var status = {};

                _.each(_.range(result.rows.length), function (index) {
                    var item = result.rows.item(index);
                    status[item.path] = item;
                });

                return status;
            });
    };

    service.updateLastImport = function (path) {
        return query(
            "INSERT OR REPLACE INTO Sync (path, lastImport, lastExport)" +
            "VALUES (?, ?, " +
            "   (SELECT lastExport FROM Sync WHERE path = ?))",
            [path, moment().format(), path]
        ).then(
            verifyOneRowAffected
        );
    };

    return service;
};
