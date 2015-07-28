angular.module("app", ['ui.router'])
    .config(configApp)
    .run(runApp)
    .factory("encryptionService", encryptionService)
    .factory("lockService", lockService)
    .controller("lockCtrl", lockCtrl)
    .factory("errorService", errorService)
    .controller("errorCtrl", errorCtrl)
    .factory("settingsService", settingsService)
    .controller("settingsCtrl", settingsCtrl)
    .controller("dropboxCtrl", dropboxCtrl)
    .factory("recordsService", recordsService)
    .controller("yearsCtrl", yearsCtrl)
    .controller("recordsCtrl", recordsCtrl)
    .controller("viewerCtrl", viewerCtrl)
    .controller("editorCtrl", editorCtrl)
    .directive("scrollIfClass", function () {
        return function (scope, element, attributes) {
            var scrollToClass = attributes.scrollIfClass;

            scope.$watch(
                function () { return element.attr('class'); },
                function (newValue) {
                    console.log(element);
                }
            );
        };
    })
    ;
