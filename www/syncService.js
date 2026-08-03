import moment from 'moment';

export var syncService = function ($q, settingsService, dbService, dropboxService) {

    var service = {};

    var yearToFile = function (year) {
        return settingsService.settings.dropboxFolder + '/' + year + '.json';
    };

    service.filesToImport = function (cloudFiles, status) {
        var actions = cloudFiles.map(function (file) {
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

        return actions.filter(Boolean);
    };

    service.yearsToExport = function (yearsUpdated, status) {
        var actions = yearsUpdated.map(function (yearUpdated) {
            var year = yearUpdated.year;
            var updated = yearUpdated.updated;
            var pathStatus = status[yearToFile(year)];

            // Last time this device's copy is known to match the cloud
            // copy: either because it was just exported, or because it
            // was just imported (e.g. a fresh device pulling everything
            // for the first time).
            var lastSynced = pathStatus && (
                pathStatus.lastExport && pathStatus.lastImport ?
                    moment.max(
                        moment(pathStatus.lastExport),
                        moment(pathStatus.lastImport)
                    ) :
                    (pathStatus.lastExport || pathStatus.lastImport)
            );

            // If lastSynced after the year was updated
            if (lastSynced && moment(lastSynced).isAfter(updated)) {
                // Do nothing
                return null;
            }
            else {
                return year;
            }
        });

        return actions.filter(Boolean);
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

            return $q.all(
                service.yearsToExport(yearStatuses, status)
                    .map(service.exportYear)
            );
        });
    };

    service.importFile = function (path) {
        return dropboxService.readFile(path)
            .then(
                function (records) {
                    return JSON.parse(records).reduce(
                        function (previous, record) {
                            return previous.then(function () {
                                return dbService.syncRecord(record);
                            });
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

            return service.filesToImport(cloudFiles, status).reduce(
                function (previous, path) {
                    return previous.then(function () {
                        return service.importFile(path);
                    });
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

syncService.$inject = ['$q', 'settingsService', 'dbService', 'dropboxService'];
