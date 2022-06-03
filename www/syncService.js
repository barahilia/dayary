syncService = function ($q, settingsService, dbService, dropboxService) {

    var service = {};

    var yearToFile = function (year) {
        return settingsService.settings.dropboxFolder + '/' + year + '.json';
    };

    service.filesToImport = function (cloudFiles, status) {
        var actions = _.map(cloudFiles, function (file) {
            // If in status and lastImport after the file was modified
            if (status[file.path_display] &&
                status[file.path_display].lastImport &&
                moment(status[file.path_display].lastImport)
                    .isAfter(file.server_modified)) {
                // Do nothing
                return null;
            }
            else {
                // Should import file
                return file.path_display;
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
                status[path].lastExport &&
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
            // Load saved files status: { path: { lastImport, lastExport } }
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
                    return _.reduce(
                        JSON.parse(records),
                        function (previous, record) {
                            return previous.then(
                                _.partial(dbService.syncRecord, record)
                            );
                        },
                        $q.when(null)
                    );
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
            // Get cloud folder listing: [ { path, updated } ]
            dropboxService.listFiles(settingsService.settings.dropboxFolder),
            // Load saved files status: { path: { lastImport, lastExport } }
            dbService.getSyncStatus()
        ]).then(function (data) {
            var cloudFiles = data[0];
            var status = data[1];

            return _.reduce(
                service.filesToImport(cloudFiles, status),
                function (previous, path) {
                    return previous.then(_.partial(service.importFile, path));
                },
                $q.when(null)
            );
        });
    };

    service.sync = function () {
        return service.importFromCloud()
            .then(service.exportToCloud);
    };

    return service;
};
