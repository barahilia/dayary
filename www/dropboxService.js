dropboxService = function ($q, settingsService) {

    var client = new Dropbox.Client({ key: "4hxwutae96fhhbd" });

    var service = {};

    service.listFiles = function () {
        var deferred = $q.defer();

        client.readdir(
            settingsService.settings.dropboxFolder,
            function (error, names, dirData, entries) {
                if (error) {
                    deferred.reject(error);
                }
                else {
                    deferred.resolve(entries);
                }
            }
        );

        return deferred.promise;
    };

    service.readFile = function (path) {
        var deferred = $q.defer();

        client.readFile(
            settingsService.settings.dropboxFolder + '/' + path,
            function (error, data) {
                if (error) {
                    deferred.reject(error);
                }
                else {
                    deferred.resolve(data);
                }
            }
        );

        return deferred.promise;
    };

    return service;
};
