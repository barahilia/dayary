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
var redirectUrl = 'https://barahilia.github.io/dayary/www/login/dropbox.html';

var dbxAuth = new Dropbox.DropboxAuth({ clientId: clientId });

var hasRedirectedFromAuth = !!getCodeFromSearch();

if (hasRedirectedFromAuth) {
    dbxAuth.setCodeVerifier(localStorage.dropboxCodeVerifier);

    dbxAuth.getAccessTokenFromCode(redirectUrl, getCodeFromSearch())
        .then(response => {
            localStorage.dropboxAuthToken = response.result.access_token;
            window.location.href = "/dayary";
        });
}
else {
    dbxAuth.getAuthenticationUrl(
        redirectUrl, undefined, 'code', 'offline',
        undefined, undefined, true
    )
    .then(authUrl => {
        localStorage.dropboxCodeVerifier = dbxAuth.codeVerifier;
        window.location.href = authUrl;
    })
    .catch(
        error => console.error(error)
    );
}
