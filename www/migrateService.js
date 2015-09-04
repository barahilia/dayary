migrateService = function (
    $http, $q,
    settingsService, dbService, dropboxService
) {
    var migrateRecord = function (record, message) {
        return $http.get("/api/records/" + record.id)
            .then(
                function (data) { return data.data; },
                function (error) {
                    message("Error getting record id " + record.id);
                }
            )
            .then(dbService.updateRecord)
            .then(
                function () {
                    message(
                        "Saved text for record #" + record.id +
                        " from " + record.created
                    );
                },
                function (error) { message(error); }
            );
    };

    var service = {};

    service.migrate = function (message) {
        var records;

        return $http.get("/api/records")
            .then(
                function (data) {
                    records = data.data;
                    message("Got " + records.length + " records metadata");
                    return records;
                },
                function (error) {
                    message("Error getting metadata");
                }
            )
            .then(
                _.partial(dbService.setAllRecords, _, message),
                message
            )
            .then(function () {
                return $q.all(
                    _.map(records, _.partial(migrateRecord, _, message))
                );
            })
            .then(function () {
                message("Finished getting all records text");
            });
    };

    service.updateLocalRecords = function (records) {
        return dbService.getAllRecords()
            .then(function (metadata) {
                return $q.all(_.map(records, function (record) {
                    var criteria = { created: record.created };
                    var local = _.findWhere(metadata, criteria);

                    if (local) { // Update if needed
                        if (moment(local.updated).isBefore(record.updated)) {
                            return dbService.updateRecord(record);
                        }
                    }
                    else { // Insert new
                        return dbService.addRecord(record);
                    }
                }));
            });
    };

    var importFromCloud = function () {
        return $q.all([
            // Get cloud folder listing: [ { name, updated } ]
            dropboxService.listFiles(settingsService.settings.dropboxFolder),
            // Load saved files status: { name: { lastImport, lastExport } }
            dbService.getSyncStatus()
        ]).then(function (data) {
            var cloudFiles = data[0];
            var status = data[1];

            // For each name in listing:
            return $q.all(
                _.map(cloudFiles, function (file) {
                    var path = file.path;

                    // If in status and lastImport after the file was modified
                    if (status[path] &&
                        moment(status[path].lastImport)
                            .isAfter(file.modifiedAt)) {
                        // Do nothing
                    }
                    else {
                        // Import file
                        return dropboxService.readFile(file.path)
                            .then(function (data) {
                                var records = JSON.parse(data);
                                return service.updateLocalRecords(records);
                            })
                            .then(function () {
                                // Update status
                                // TODO: make sure it isn't called in case of error
                                return dbService.updateLastImport(file.path);
                            });
                    }
                })
            );
        });
    };

    var exportToCloud = function () {
        return $q.all([
            // Last modification per years: [ { year, updated } ]
            dbService.yearsUpdated(),
            // Load saved files status: { name: { lastImport, lastExport } }
            dbService.getSyncStatus()
        ]).then(function (data) {
            var yearStatuses = data[0];
            var status = data[1];

            // For each name in listing:
            return $q.all(
                _.map(yearStatuses, function (yearUpdated) {
                    var year = yearUpdated.year;
                    var updated = yearUpdated.updated;

                    var path = settingsService.settings.dropboxFolder;
                    path += '/' + year + '.json';

                    // If in status and lastImport after the file was modified
                    if (status[path] &&
                        moment(status[path].lastExport).isAfter(updated)) {
                        // Do nothing
                    }
                    else {
                        // Import file
                        return dbService.getYearlyRecords(year)
                            .then(function (data) {
                                return dropboxService.writeFile(
                                    path,
                                    JSON.stringify(data)
                                );
                            })
                            .then(function () {
                                // Update status
                                // TODO: make sure it isn't called in case of error
                                return dbService.updateLastExport(path);
                            });
                    }
                })
            );
        });
    };

    service.sync = function () {
        return importFromCloud()
            .then(exportToCloud);
    };

    return service;
};
