import { Dropbox, DropboxAuth } from 'dropbox';

export var dropboxService = function ($q, settingsService) {

    var clientId = "4hxwutae96fhhbd";

    var dbxAuth = new DropboxAuth({
        clientId: clientId,
        refreshToken: localStorage.dropboxRefreshToken
    });

    var dropbox;

    // Preparing the service is a network round trip refreshing the access
    // token. The progress is kept here and not in a controller: the app
    // starts it in the background, the banner shows how it goes and the
    // Dropbox page reuses whatever is done by the time it opens.
    var preparing = false;
    var ready = false;
    var preparation = null;

    var service = {};

    service.isAuthenticated = function () {
        return !!localStorage.dropboxRefreshToken;
    };

    service.isPreparing = function () {
        return preparing;
    };

    service.isReady = function () {
        return ready;
    };

    service.prepareDropbox = function () {
        // One refresh in flight is enough - later callers join it. Once it
        // settles the promise is dropped, so a call after the token expires
        // refreshes again; on a still valid token that costs no request.
        if (preparation) {
            return preparation;
        }

        // A re-check of an already usable service is silent, with no reason
        // to take the banner back to the preparing sign.
        preparing = !ready;

        // $q, and not the native promise the SDK returns, so that the flags
        // above reach the templates within the same digest they change in.
        preparation = $q.when(dbxAuth.checkAndRefreshAccessToken())
            .then(function () {
                dropbox = new Dropbox({ auth: dbxAuth });
                ready = true;
            })
            .finally(function () {
                preparing = false;
                preparation = null;
            });

        return preparation;
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

dropboxService.$inject = ['$q', 'settingsService'];
