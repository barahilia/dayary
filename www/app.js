angular.module("app", [])
    .factory("encryptionService", encryptionService)
    .factory("errorService", errorService)
    .controller("errorCtrl", errorCtrl)
    .factory("recordService", recordService)
    .controller("recordsCtrl", recordsCtrl)
    .controller("mainCtrl", mainCtrl)
    ;


