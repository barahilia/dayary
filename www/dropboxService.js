dropboxService = function ($q, settingsService) {

    var clientId = "4hxwutae96fhhbd";

    var dbxAuth = new Dropbox.DropboxAuth({
        clientId: clientId,
        refreshToken: localStorage.dropboxRefreshToken
    });

    var dropbox;

    var service = {};

    service.isAuthenticated = function () {
        return !!localStorage.dropboxRefreshToken;
    };

    service.prepareDropbox = function () {
        return dbxAuth.checkAndRefreshAccessToken()
            .then(function () {
                dropbox = new Dropbox.Dropbox({ auth: dbxAuth });
            });
    };

    service.accountInfo = function () {
        return dropbox.usersGetCurrentAccount();
    };

    service.listFiles = function (path) {
        return dropbox.filesListFolder({path: path})
            .then(function(response) {
                return response.result.entries;
            });
    };

    service.readFile = function (path) {
        var deferred = $q.defer();

        dropbox.filesDownload({path: path})
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
        return dropbox.filesUpload({
            path: path, contents: data,
            mode: {'.tag': 'overwrite'}
            // , mute: true // for muting client notification
        });
    };

    return service;
};
