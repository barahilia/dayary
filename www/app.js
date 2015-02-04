angular.module("app", ['ui.router']) // TODO: make sure no need in ng-animate
    .config(configApp)
    .factory("encryptionService", encryptionService)
    .factory("errorService", errorService)
    .controller("errorCtrl", errorCtrl)
    .controller("settingsCtrl", settingsCtrl)
    .factory("recordService", recordService)
    .controller("recordsCtrl", recordsCtrl)
    .controller("viewerCtrl", viewerCtrl)
    .controller("editorCtrl", editorCtrl)
    .controller("mainCtrl", mainCtrl)
    ;


