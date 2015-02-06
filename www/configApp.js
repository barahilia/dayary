var configApp = function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state("home", {
            url: "/",
            controller: function ($state) {
                $state.go("settings");
            }
        })
        .state("settings", {
            url: "/settings",
            templateUrl: "settings.html",
            controller: "settingsCtrl"
        })
        .state("records", {
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
            url: "/:id/edit",
            templateUrl: "editor.html",
            controller: "editorCtrl"
        })
        ;
};

