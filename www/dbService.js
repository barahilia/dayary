var dbService = function ($q, errorService) {
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

        modes = {
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
                date = date.endOf('month').subtract(1, 'month');

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
                date = date.startOf('month').add(1, 'month');

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
        return service.getAllRecords()
            .then(function (records) {
                var groups = _.groupBy(records, function (value) {
                    return moment(value.created).year();
                });

                var yearLastUpdated = {};

                _.forEach(groups, function(value, key) {
                    var updated = _.map(value, function (record) {
                        return record.updated;
                    });

                    var lastUpdated = _.reduce(updated, function(a, b) {
                        return a > b ? a : b;
                    });

                    yearLastUpdated[key] = lastUpdated;
                });

                yearLastUpdated = _.map(yearLastUpdated, function (value, key) {
                    return {year: key, updated: value};
                });

                return yearLastUpdated;
            });
    };

    service.getYearlyRecords = function (strYear) {
        var year = +strYear;

        if ( _.isNaN(year) ) {
            throw "Expected numeric year, got " + JSON.stringify(strYear);
        }

        return queryIndexed(
            'records',
            function (store) {
                return store.index('created').getAll(
                    IDBKeyRange.bound(
                        moment({ year: year }).format(),
                        moment({ year: year + 1 }).format()
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


    service.getSyncStatus = function () {
        return simpleQuery('sync', 'getAll', null)
            .then(function (sync) {
                return _.object(
                    _.pluck(sync, 'path'),
                    sync
                );
            });
    };

    service.updateLastImport = function (path) {
        return simpleQuery('sync', 'get', path)
            .then(function (result) {
                return simpleQuery('sync', 'put', {
                    path: path,
                    lastImport: moment().format(),
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
                    lastExport: moment().format()
                });
            });
    };

    return service;
};
