var configApp = function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state("root", {
            abstract: true,
            views: {
                "banner": {
                    templateUrl: "www/banner.html",
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
            templateUrl: "www/lock.html",
            controller: "lockCtrl"
        })
        .state("settings", {
            parent: "root",
            url: "/settings",
            templateUrl: "www/settings.html",
            controller: "settingsCtrl"
        })
        .state("dropbox", {
            parent: "root",
            url: "/dropbox",
            templateUrl: "www/dropbox.html",
            controller: "dropboxCtrl"
        })
        .state("years", {
            parent: "root",
            url: "/years",
            templateUrl: "www/years.html",
            controller: "yearsCtrl"
        })
        .state("records", {
            parent: "root",
            url: "/records",
            templateUrl: "www/records.html",
            controller: "recordsCtrl"
        })
        .state("records.item", {
            url: "/:id",
            templateUrl: "www/viewer.html",
            controller: "viewerCtrl"
        })
        .state("records.item.edit", {
            url: "/edit",
            templateUrl: "www/editor.html",
            controller: "editorCtrl"
        })
        ;
};

