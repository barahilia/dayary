dropboxService = function ($q, settingsService) {

    // TODO: Make this completely generic service; get token
    // from the user, initialize and call authenticate from runApp.

    var dropbox = function () {
        var dbxAuth = new Dropbox.DropboxAuth();
        dbxAuth.setAccessToken(localStorage.dropboxAuthToken);

        return new Dropbox.Dropbox({ auth: dbxAuth });
    };

    var service = {};

    service.isAuthenticated = function () {
        return !!localStorage.dropboxAuthToken;
    };

    service.expire = function () {
        localStorage.dropboxAuthToken = '';
    };

    service.accountInfo = function () {
        return dropbox().usersGetCurrentAccount();
    };

    service.listFiles = function (path) {
        return dropbox().filesListFolder({path: path})
            .then(function(response) {
                return response.result.entries;
            });
    };

    service.readFile = function (path) {
        var deferred = $q.defer();

        dropbox().filesDownload({path: path})
            .then(function (response) {
                var reader = new FileReader();

                reader.onload = function () {
                    deferred.resolve(reader.result);
                };

                reader.readAsText(response.result.fileBlob);
            });

        return deferred.promise;
    };

    service.writeFile = function (path, data) {
        return dropbox().filesUpload({
            path: path, contents: data,
            mode: {'.tag': 'overwrite'}
            // , mute: true // for muting client notification
        });
    };

    return service;
};
