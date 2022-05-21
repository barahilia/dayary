var dbService = function ($q, errorService) {
    var dbHandle;
    var newDb;

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

    var queryIndexed = function (name, query, mode='readonly') { // jshint ignore:line
        var deferred = $q.defer();

        var request = query(
            newDb.transaction(name, mode)
                .objectStore(name)
        );

        request.onsuccess = function (event) {
            deferred.resolve(request.result);
        };

        request.onerror = function (event) {
            errorService.reportError("db error: " + event);
            deferred.reject(event);
        };

        return deferred.promise;
    };

    var simpleQuery = function (name, action, object) {
        var deferred = $q.defer();

        modes = {
            get: 'readonly',
            getAll: 'readonly',
            add: 'readwrite',
            put: 'readwrite',
            delete: 'readwrite',
            clear: 'readwrite'
        };

        if (! (action in modes)) {
            console.error('simpleQuery() mode error');
            deferred.reject('unsupported action ' + action);
        }

        var store = newDb
            .transaction(name, modes[action])
            .objectStore(name);

        var request;

        if (object === null) {
            request = store[action]();
        }
        else {
            request = store[action](object);
        }

        request.onsuccess = function (event) {
            deferred.resolve(request.result);
        };

        request.onerror = function (event) {
            errorService.reportError("db error: " + event);
            deferred.reject(event);
        };

        return deferred.promise;
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
        // == IndexedDB ==
        var request = window.indexedDB.open('db', 1);

        request.onsuccess = function (event) {
            newDb = request.result;
        };

        request.onupgradeneeded = function (event) {
            var upgradeDb = request.result;

            upgradeDb.createObjectStore('hash', {keyPath: 'id'});
            upgradeDb.createObjectStore('settings', {keyPath: 'key'});
            upgradeDb.createObjectStore('sync', {keyPath: 'path'});

            var store = upgradeDb.createObjectStore(
                'records',
                {keyPath: 'id', autoIncrement: true}
            );

            store.createIndex('created', 'created', {unique: true});
        };

        request.onerror = function (event) {
            // XXX how to report the error?
            console.error('in error');
        };

        // == Continue to the old good WebSQL ==
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
        var tables = ["hash", "settings", "records", "sync"];

        return $q.all(_.map(tables, function (table) {
            return simpleQuery(table, 'clear', null);
        }));
    };


    service.getHash = function () {
        return simpleQuery('hash', 'get', 0)
            .then(function (result) {
                if (result) {
                    return result.hash;
                }
                else {
                    return null;
                }
            });
    };

    service.setHash = function (hash) {
        return service.getHash()
            .then(function (oldHash) {
                if (oldHash) {
                    throw "set hash: cannot replace existing hash";
                }

                return simpleQuery('hash', 'add', {id: 0, hash: hash});
            });
    };

    service.getSettings = function () {
        return simpleQuery('settings', 'getAll', null)
            .then(function (settings) {
                return _.object(
                    _.pluck(settings, 'key'),
                    _.pluck(settings, 'value')
                );
            });
    };

    service.setSettings = function (settings) {
        return $q.all(
            _.map(settings, function (value, key) {
                return simpleQuery('settings', 'put', {key: key, value: value});
            })
        );
    };


    service.getAllRecords = function () {
        return simpleQuery('records', 'getAll', null);
    };

    var getCreated = function (recordId) {
        var promise;

        if (recordId === undefined) {
            promise = queryIndexed(
                'records',
                function (store) {
                    // Returns maximal value because of 'prev'
                    return store.index('created').openCursor(null, 'prev');
                }
            );
        }
        else {
            promise = simpleQuery('records', 'get', parseInt(recordId));
        }

        return promise
            .then(function (result) {
                if (result) {
                    // Support both the cursor and the direct get
                    result = result.value || result;
                    return moment(result.created);
                }
                else {
                    return null;
                }
            });
    };

    var getMonthlyRecordsAtDate = function (date) {
        if (date === null) {
            return [];
        }
        else {
            return queryIndexed(
                'records',
                function (store) {
                    return store.index('created').getAll(
                        IDBKeyRange.bound(
                            date.startOf('month').format(),
                            date.endOf('month').format()
                        )
                    );
                }
            ).then(function (result) {
                return result;
            });
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

                return queryIndexed(
                    'records',
                    function (store) {
                        var query = IDBKeyRange.upperBound(date.format());
                        return store.index('created').openCursor(query, 'prev');
                    }
                );
            })
            .then(function (result) {
                var date = null;

                if (result) {
                    date = moment(result.value.created);
                }

                return getMonthlyRecordsAtDate(date);
            });
    };

    service.getNextMonthlyRecords = function (recordId) {
        return getCreated(recordId)
            .then(function (date) {
                date = date.add(1, 'month');

                return queryIndexed(
                    'records',
                    function (store) {
                        var query = IDBKeyRange.lowerBound(date.format());
                        return store.index('created').openCursor(query, 'next');
                    }
                );
            })
            .then(function (result) {
                var date = null;

                if (result) {
                    date = moment(result.value.created);
                }

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
        return simpleQuery('records', 'get', id);
    };

    service.addRecord = function (record) {
        return simpleQuery('records', 'add', record)
            .then(function (id) {
                return service.getRecord(id);
            });
    };

    service.updateRecord = function (record) {
        return simpleQuery('records', 'put', record);
    };

    service.deleteRecord = function (id) {
        // XXX deleted records should be tracked to work with sync
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
