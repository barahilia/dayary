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
        // TODO: replace with scroll-if-state="records.item id"
        //       listent to the state change event; remember to remove listener
        //       at controller destroy

        return function (scope, element, attributes) {
            var scrollToClass = attributes.scrollIfClass;

            scope.$watch(
                function () { return element.attr('class'); },
                function (newValue) {
                    var e;

                    if (element.hasClass(scrollToClass)) {
                        var e = element[0];
                        // TODO: magical constant - why
                        e.parentElement.scrollTop = e.offsetTop - 160;
                    }
                }
            );
        };
    })
    ;
