dropboxService = function ($q, settingsService) {

    // TODO: Make this completely generic service; get token
    // from the user, initialize and call authenticate from runApp.

    var client = new Dropbox.Client({ key: "4hxwutae96fhhbd" });
    var authenticated = false;
    var service = {};

    var throwIfNotAuthenticated = function () {
        if (!authenticated) {
            throw "Not authenticated";
        }
    };

    // All APIs are called in the similar way:
    //      client.func(arg1, ..., function (error, res1, ...) {
    //          if (error) { ... }
    //          else { ... }
    //      })
    // The wrapper simplifies this and also turns callbacks to promises
    var wrapDropboxApi = function (func, args, callback) {
        var deferred = $q.defer();

        var wrapCallback = function (error) {
            if (error) {
                deferred.reject(error);
            }
            else {
                deferred.resolve(
                    callback.apply(undefined, _.rest(arguments, 1))
                );
            }
        };

        throwIfNotAuthenticated();

        args.push(wrapCallback);
        func.apply(client, args);

        return deferred.promise;
    };

    client.authenticate({interactive: false}, function(error) {
        authenticated = ! error;
    });


    service.isAuthenticated = function () {
        return authenticated;
    };

    service.accountInfo = function () {
        return wrapDropboxApi(
            client.getAccountInfo,
            [],
            function (accountInfo) { return accountInfo; }
        );
    };

    service.listFiles = function (path) {
        return wrapDropboxApi(
            client.readdir,
            [path],
            function (names, dirData, entries) {
                return entries;
            }
        );
    };

    service.readFile = function (path) {
        return wrapDropboxApi(
            client.readFile,
            [path],
            function (data) { return data; }
        );
    };

    service.writeFile = function (path, data) {
        return wrapDropboxApi(client.writeFile, [path, data], _.noop);
    };

    return service;
};
