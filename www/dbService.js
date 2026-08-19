import {
    addMonths, endOfMonth, formatISO, getYear, isBefore, parseISO,
    startOfMonth, subMonths
} from 'date-fns';

export var dbService = function ($q, errorService) {
    var newDb;

    // TODO: add convenience functions: selectOne, selectAll, deleteOne, ...
    // TODO: split to framework websqlService and app-related dbService

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

        var modes = {
            get: 'readonly',
            getAll: 'readonly',
            add: 'readwrite',
            put: 'readwrite',
            delete: 'readwrite',
            clear: 'readwrite'
        };

        if (! (action in modes)) {
            var message = 'unsupported action ' + action;
            errorService.reportError(message);
            deferred.reject(message);
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


    var service = {};

    service.init = function () {
        var deferred = $q.defer();

        var request = window.indexedDB.open('db', 1);

        request.onsuccess = function (event) {
            newDb = request.result;
            deferred.resolve(null);
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
            var message = 'Get IndexedDB error';
            errorService.reportError(message);
            deferred.reject(message);
        };

        return deferred.promise;
    };

    service.cleanDb = function () {
        var tables = ["hash", "settings", "records", "sync"];

        return $q.all(tables.map(function (table) {
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
                return settings.reduce(function (result, setting) {
                    result[setting.key] = setting.value;
                    return result;
                }, {});
            });
    };

    service.setSettings = function (settings) {
        return $q.all(
            Object.keys(settings).map(function (key) {
                return simpleQuery(
                    'settings', 'put', {key: key, value: settings[key]}
                );
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
                    return parseISO(result.created);
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
                            formatISO(startOfMonth(date)),
                            formatISO(endOfMonth(date))
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
                date = subMonths(endOfMonth(date), 1);

                return queryIndexed(
                    'records',
                    function (store) {
                        var query = IDBKeyRange.upperBound(formatISO(date));
                        return store.index('created').openCursor(query, 'prev');
                    }
                );
            })
            .then(function (result) {
                var date = null;

                if (result) {
                    date = parseISO(result.value.created);
                }

                return getMonthlyRecordsAtDate(date);
            });
    };

    service.getNextMonthlyRecords = function (recordId) {
        return getCreated(recordId)
            .then(function (date) {
                date = addMonths(startOfMonth(date), 1);

                return queryIndexed(
                    'records',
                    function (store) {
                        var query = IDBKeyRange.lowerBound(formatISO(date));
                        return store.index('created').openCursor(query, 'next');
                    }
                );
            })
            .then(function (result) {
                var date = null;

                if (result) {
                    date = parseISO(result.value.created);
                }

                return getMonthlyRecordsAtDate(date);
            });
    };

    service.yearsUpdated = function () {
        return service.getAllRecords()
            .then(function (records) {
                var groups = records.reduce(function (result, record) {
                    var year = getYear(parseISO(record.created));
                    (result[year] = result[year] || []).push(record);
                    return result;
                }, {});

                return Object.keys(groups).map(function (year) {
                    var updated = groups[year].map(function (record) {
                        return record.updated;
                    });

                    var lastUpdated = updated.reduce(function (a, b) {
                        return a > b ? a : b;
                    });

                    return {year: year, updated: lastUpdated};
                });
            });
    };

    service.getYearlyRecords = function (strYear) {
        var year = +strYear;

        if ( Number.isNaN(year) ) {
            throw "Expected numeric year, got " + JSON.stringify(strYear);
        }

        return queryIndexed(
            'records',
            function (store) {
                return store.index('created').getAll(
                    IDBKeyRange.bound(
                        formatISO(new Date(year, 0, 1)),
                        formatISO(new Date(year + 1, 0, 1))
                    )
                );
            }
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
        return simpleQuery('records', 'delete', id);
    };

    service.syncRecord = function (record) {
        return queryIndexed(
            'records',
            function (store) {
                return store.index('created').getAll(record.created);
            }
        )
        .then(function (local) {
            if (local.length === 0) {
                delete record.id;
                return service.addRecord(record);
            }
            else if (local.length === 1) {
                if (isBefore(parseISO(local[0].updated), parseISO(record.updated))) {
                    var merged = {
                        id: local[0].id,
                        created: local[0].created,
                        updated: record.updated,
                        text: record.text
                    };

                    // Both copies are the same record, so both should name
                    // the device it was written on; keep the local answer and
                    // take the incoming one only where there is none, which
                    // backfills records made before the field existed.
                    var device = local[0].device || record.device;

                    if (device) {
                        merged.device = device;
                    }

                    return service.updateRecord(merged);
                }
            }
            else {
                throw "db integrity: multiple " + record.created;
            }
        });
    };


    service.getSyncStatus = function () {
        return simpleQuery('sync', 'getAll', null)
            .then(function (sync) {
                return sync.reduce(function (result, item) {
                    result[item.path] = item;
                    return result;
                }, {});
            });
    };

    service.updateLastImport = function (path) {
        return simpleQuery('sync', 'get', path)
            .then(function (result) {
                return simpleQuery('sync', 'put', {
                    path: path,
                    lastImport: formatISO(new Date()),
                    lastExport: result ? result.lastExport : null
                });
            });
    };

    service.updateLastExport = function (path) {
        return simpleQuery('sync', 'get', path)
            .then(function (result) {
                return simpleQuery('sync', 'put', {
                    path: path,
                    lastImport: result ? result.lastImport : null,
                    lastExport: formatISO(new Date())
                });
            });
    };

    return service;
};

dbService.$inject = ['$q', 'errorService'];
