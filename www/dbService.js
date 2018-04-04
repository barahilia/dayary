var dbService = function ($q, errorService) {
    var dbHandle;

    // TODO: add convenience functions: selectOne, selectAll, deleteOne, ...
    // TODO: split to framework websqlService and app-related dbService

    var db = function () {
        if ( ! dbHandle) {
            dbHandle = openDatabase(
                "dayary",
                "0.8",
                "Dayary DB",
                10 * 1000 * 1000
            );
        }
        return dbHandle;
    };

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

        db().transaction(function (tx) {
            tx.executeSql(query, input, success, failure);
        });

        return deferred.promise;
    };

    var selectMany = function (selectQuery, input) {
        return query(selectQuery, input)
            .then(function (result) {
                return _.map(
                    _.range(result.rows.length),
                    function (i) {
                        return _.clone(result.rows.item(i));
                    }
                );
            });
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
        return selectMany("SELECT key, value FROM Settings")
            .then(function (settings) {
                return _.object(
                    _.pluck(settings, 'key'),
                    _.map(
                        settings,
                        function (s) { return JSON.parse(s.value); }
                    )
                );
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
        return selectMany("SELECT id, created, updated FROM Records");
    };

    var getCreated = function (recordId) {
        if (recordId === undefined) {
            promise = query("SELECT max(created) AS date FROM Records");
        }
        else {
            promise = query(
                "SELECT created AS date FROM Records WHERE id = ?",
                [recordId]
            );
        }

        return promise
            .then(function (result) {
                if (result.rows.length === 0) {
                    return null;
                }
                else if (result.rows.length === 1) {
                    date = result.rows.item(0).date;
                    return moment(date);
                }
                else {
                    message = "internal error";
                    errorService.reportError(message);
                    throw message;
                }
            });
    };

    var getMonthlyRecordsAtDate = function (date) {
        if (date === null) {
            return [];
        }
        else {
            return selectMany(
                "SELECT id, created, updated " +
                "FROM Records WHERE created BETWEEN ? AND ?",
                [date.startOf('month').format(),
                 date.endOf('month').format()]
            );
        }
    };

    service.getMonthlyRecordsAt = function (recordId) {
        return getCreated(recordId)
            .then(getMonthlyRecordsAtDate);
    };

    service.getPreviousMonthlyRecords = function (recordId) {
        return getCreated(recordId)
            .then(function (date) {
                date = date.subtract(1, 'month');
                return getMonthlyRecordsAtDate(date);
            });
    };

    service.getNextMonthlyRecords = function (recordId) {
        return getCreated(recordId)
            .then(function (date) {
                date = date.add(1, 'month');
                return getMonthlyRecordsAtDate(date);
            });
    };

    service.yearsUpdated = function () {
        // TODO: move dates to UTC and get back to strftime('%Y', created)
        return selectMany(
            "SELECT substr(created, 1, 4) AS year," +
            "       max(updated) as updated " +
            "FROM records GROUP BY year"
        );
    };

    service.getYearlyRecords = function (strYear) {
        var year = +strYear;

        if ( _.isNaN(year) ) {
            throw "Expected numeric year, got " + JSON.stringify(strYear);
        }

        return selectMany(
            "SELECT * FROM Records WHERE created BETWEEN ? AND ?",
            [moment({ year: year }).format(),
             moment({ year: year + 1 }).format()]
        );
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

    service.syncRecord = function (record) {
        return selectMany(
            "SELECT * FROM Records WHERE created = ?",
            [record.created]
        ).then(function (local) {
            if (local.length === 0) {
                return service.addRecord(record);
            }
            else if (local.length === 1) {
                if (moment(local[0].updated).isBefore(record.updated)) {
                    return service.updateRecord({
                        id: local[0].id,
                        created: local[0].created,
                        updated: record.updated,
                        text: record.text
                    });
                }
            }
            else {
                throw "db integrity: multiple " + record.created;
            }
        });
    };


    // TODO: consider splitting this to import/export status
    service.getSyncStatus = function () {
        return selectMany("SELECT * FROM Sync")
            .then(function (sync) {
                return _.object(
                    _.pluck(sync, 'path'),
                    sync
                );
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

    service.updateLastExport = function (path) {
        return query(
            "INSERT OR REPLACE INTO Sync (path, lastExport, lastImport)" +
            "VALUES (?, ?, " +
            "   (SELECT lastImport FROM Sync WHERE path = ?))",
            [path, moment().format(), path]
        ).then(
            verifyOneRowAffected
        );
    };

    return service;
};
