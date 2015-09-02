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

    return service;
};
