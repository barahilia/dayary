syncService = function ($q, settingsService, dbService, dropboxService) {

    var service = {};

    var updateLocalRecords = function (records) {
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

    var importFile = function (path) {
        return dropboxService.readFile(path)
            .then(
                function (records) {
                    return updateLocalRecords(JSON.parse(records));
                },
                function (error) {
                    // TODO: report with errorService
                    throw error;
                }
            )
            .then(function () {
                return dbService.updateLastImport(path);
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

            return $q.all(_.map(
                service.filesToImport(cloudFiles, status),
                importFile
            ));
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

    service.filesToImport = function (cloudFiles, status) {
        var actions = _.map(cloudFiles, function (file) {
            // If in status and lastImport after the file was modified
            if (status[file.path] &&
                moment(status[file.path].lastImport)
                    .isAfter(file.modifiedAt)) {
                // Do nothing
                return null;
            }
            else {
                // Should import file
                return file.path;
            }
        });

        return _.compact(actions);
    };

    service.sync = function () {
        return importFromCloud()
            .then(exportToCloud);
    };

    return service;
};
