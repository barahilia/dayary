var getCodeFromSearch = function () {
    var search = window.location.search;
    search = search.substr(1);

    var hashMap = {};

    search.split('&')
        .map(function (element) { return element.split('='); })
        .forEach(function (pair) { hashMap[pair[0]] = pair[1]; });

    return hashMap.code;
};

var clientId = "4hxwutae96fhhbd";
var redirectUrl = 'http://localhost:3000/www/login/dropbox.html';

var dbxAuth = new Dropbox.DropboxAuth({ clientId: clientId });

var hasRedirectedFromAuth = !!getCodeFromSearch();

if (hasRedirectedFromAuth) {
    dbxAuth.setCodeVerifier(sessionStorage.dropboxCodeVerifier);

    dbxAuth.getAccessTokenFromCode(redirectUrl, getCodeFromSearch())
        .then(response => {
            // XXX confirm is not needed and remove
            //sessionStorage.dropboxAccessToken = response.result.access_token;
            localStorage.dropboxRefreshToken = response.result.refresh_token;

            window.location.href = "/";
        });
}
else {
    dbxAuth.getAuthenticationUrl(
        redirectUrl, undefined, 'code', 'offline',
        undefined, undefined, true
    )
    .then(authUrl => {
        sessionStorage.dropboxCodeVerifier = dbxAuth.codeVerifier;
        window.location.href = authUrl;
    })
    .catch(
        error => console.error(error)
    );
}
