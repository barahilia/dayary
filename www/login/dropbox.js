var getAuthTokenFromHash = function () {
    var hash = window.location.hash;
    hash = hash.substr(1);

    var hashMap = {};

    hash.split('&')
        .map(function (element) { return element.split('='); })
        .forEach(function (pair) { hashMap[pair[0]] = pair[1]; });

    return hashMap.access_token;
};

var authTokenFromHash = getAuthTokenFromHash();

if (authTokenFromHash) {
    localStorage.dropboxAuthToken = authTokenFromHash;
}

if (localStorage.dropboxAuthToken) {
    window.location.href = "/";
}
else {
    var dropbox = new Dropbox({ clientId: "4hxwutae96fhhbd" });
    var authUrl = dropbox.getAuthenticationUrl(
        'http://localhost:3000/www/login/dropbox.html'
    );
    window.location.href = authUrl;
}
