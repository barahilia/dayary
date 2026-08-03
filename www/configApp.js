// Templates are bundled as strings rather than fetched at runtime, so the
// app has no template round-trips to make once it is loaded.
import bannerHtml from './banner.html?raw';
import lockHtml from './lock.html?raw';
import settingsHtml from './settings.html?raw';
import dropboxHtml from './dropbox.html?raw';
import yearsHtml from './years.html?raw';
import recordsHtml from './records.html?raw';
import viewerHtml from './viewer.html?raw';
import editorHtml from './editor.html?raw';

export var configApp = function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state("root", {
            abstract: true,
            views: {
                "banner": {
                    template: bannerHtml,
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
            template: lockHtml,
            controller: "lockCtrl"
        })
        .state("settings", {
            parent: "root",
            url: "/settings",
            template: settingsHtml,
            controller: "settingsCtrl"
        })
        .state("dropbox", {
            parent: "root",
            url: "/dropbox",
            template: dropboxHtml,
            controller: "dropboxCtrl"
        })
        .state("years", {
            parent: "root",
            url: "/years",
            template: yearsHtml,
            controller: "yearsCtrl"
        })
        .state("records", {
            parent: "root",
            url: "/records",
            template: recordsHtml,
            controller: "recordsCtrl"
        })
        .state("records.item", {
            url: "/:id",
            template: viewerHtml,
            controller: "viewerCtrl"
        })
        .state("records.item.edit", {
            url: "/edit",
            template: editorHtml,
            controller: "editorCtrl"
        })
        ;
};

configApp.$inject = ['$stateProvider', '$urlRouterProvider'];
