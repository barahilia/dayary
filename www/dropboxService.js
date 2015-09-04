dropboxService = function ($q, settingsService) {

    // TODO: Make this completely generic service; get token
    // from the user, initialize and call authenticate from runApp.
    // See if need to throw for not authenticated at all.

    var client = new Dropbox.Client({ key: "4hxwutae96fhhbd" });
    var authenticated = false;
    var service = {};

    var throwIfNotAuthenticated = function () {
        if (!authenticated) {
            throw "Not authenticated";
        }
    }

    client.authenticate({interactive: false}, function(error) {
        authenticated = !error;
    });

    service.listFiles = function (path) {
        var deferred = $q.defer();

        throwIfNotAuthenticated();

        client.readdir(
            path,
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

        throwIfNotAuthenticated();

        client.readFile(
            path,
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

    service.writeFile = function (path, data) {
        var deferred = $q.defer();

        throwIfNotAuthenticated();

        client.writeFile(
            path, data,
            function (error) {
                if (error) {
                    deferred.reject(error);
                }
                else {
                    deferred.resolve();
                }
            }
        );

        return deferred.promise;
    };

    return service;
};
