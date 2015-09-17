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
                            return dbService.updateRecord(
                                _.extend(local, record)
                            );
                        }
                    }
                    else { // Insert new
                        return dbService.addRecord(record);
                    }
                }));
            });
    };

    var yearToFile = function (year) {
        return settingsService.settings.dropboxFolder + '/' + year + '.json';
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

    service.yearsToExport = function (yearsUpdated, status) {
        var actions = _.map(yearsUpdated, function (yearUpdated) {
            var year = yearUpdated.year;
            var updated = yearUpdated.updated;
            var path = yearToFile(year);

            // If in status and lastExport after the year was updated
            if (status[path] &&
                moment(status[path].lastExport).isAfter(updated)) {
                // Do nothing
                return null;
            }
            else {
                return year;
            }
        });

        return _.compact(actions);
    };

    service.exportYear = function (year) {
        var path = yearToFile(year);

        return dbService.getYearlyRecords(year)
            .then(
                function (data) {
                    return dropboxService.writeFile(
                        path,
                        JSON.stringify(data)
                    );
                },
                function (error) {
                    // TODO: report with errorService
                    throw error;
                }
            )
            .then(function () {
                // Update status
                // TODO: make sure it isn't called in case of error
                return dbService.updateLastExport(path);
            });
    };

    service.exportToCloud = function () {
        return $q.all([
            // Last modification per years: [ { year, updated } ]
            dbService.yearsUpdated(),
            // Load saved files status: { name: { lastImport, lastExport } }
            dbService.getSyncStatus()
        ]).then(function (data) {
            var yearStatuses = data[0];
            var status = data[1];

            return $q.all(_.map(
                service.yearsToExport(yearStatuses, status),
                service.exportYear
            ));
        });
    };

    service.importFile = function (path) {
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

    service.importFromCloud = function () {
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
                service.importFile
            ));
        });
    };

    service.sync = function () {
        return service.importFromCloud()
            .then(service.exportToCloud);
    };

    return service;
};
