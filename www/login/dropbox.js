import { DropboxAuth } from 'dropbox';

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

// This script only ever runs on the login page itself, so its own URL is the
// redirect URI - exact both under the GitHub Pages project path and locally.
// Dropbox matches it verbatim, hence stripping any query string it added.
var redirectUrl = window.location.origin + window.location.pathname;

// The app root, three levels up from www/login/dropbox.html.
var appUrl = redirectUrl.replace(/www\/login\/dropbox\.html$/, '');

var dbxAuth = new DropboxAuth({ clientId: clientId });

var hasRedirectedFromAuth = !!getCodeFromSearch();

if (hasRedirectedFromAuth) {
    dbxAuth.setCodeVerifier(sessionStorage.dropboxCodeVerifier);

    dbxAuth.getAccessTokenFromCode(redirectUrl, getCodeFromSearch())
        .then(response => {
            // XXX confirm is not needed and remove
            //sessionStorage.dropboxAccessToken = response.result.access_token;
            localStorage.dropboxRefreshToken = response.result.refresh_token;

            window.location.href = appUrl;
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
