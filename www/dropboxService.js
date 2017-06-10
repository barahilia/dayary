dropboxService = function ($q, settingsService) {

    // TODO: Make this completely generic service; get token
    // from the user, initialize and call authenticate from runApp.

    var dropbox = new Dropbox({
        accessToken: localStorage.dropboxAuthToken
    });

    var service = {};

    service.isAuthenticated = function () {
        return !!dropbox.accessToken;
    };

    service.accountInfo = function () {
        return dropbox.usersGetCurrentAccount();
    };

    service.listFiles = function (path) {
        return dropbox.filesListFolder({path: path})
            .then(function(response) {
                return response.entries;
            });
    };

    service.readFile = function (path) {
        var deferred = $q.defer();

        dropbox.filesDownload({path: path})
            .then(function (result) {
                var reader = new FileReader();

                reader.onload = function () {
                    deferred.resolve(reader.result);
                };

                reader.readAsText(result.fileBlob);
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
