var configApp = function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state("root", {
            abstract: true,
            views: {
                "banner": {
                    templateUrl: "banner.html",
                    controller: "bannerCtrl"
                },
                "": {
                    template: "<ui-view />"
                }
            }
        })
        // TODO: decide if to name it and others "root.lock".
        // Currently two schemes - parent="root" and "records.item"
        .state("lock", {
            parent: "root",
            url: "/",
            templateUrl: "lock.html",
            controller: "lockCtrl"
        })
        .state("settings", {
            parent: "root",
            url: "/settings",
            templateUrl: "settings.html",
            controller: "settingsCtrl"
        })
        .state("dropbox", {
            parent: "root",
            url: "/dropbox",
            templateUrl: "dropbox.html",
            controller: "dropboxCtrl"
        })
        .state("years", {
            parent: "root",
            url: "/years",
            templateUrl: "years.html",
            controller: "yearsCtrl"
        })
        .state("records", {
            parent: "root",
            url: "/records",
            templateUrl: "records.html",
            controller: "recordsCtrl"
        })
        .state("records.item", {
            url: "/:id",
            templateUrl: "viewer.html",
            controller: "viewerCtrl"
        })
        .state("records.item.edit", {
            url: "/edit",
            templateUrl: "editor.html",
            controller: "editorCtrl"
        })
        ;
};

