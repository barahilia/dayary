// TODO: replace with scroll-if-state="records.item id"
//       listent to the state change event; remember to remove listener
//       at controller destroy

scrollIfClass = function () {
    return function (scope, element, attributes) {
        var scrollToClass = attributes.scrollIfClass;

        scope.$watch(
            function () { return element.attr('class'); },
            function (newValue) {
                var e;

                if (element.hasClass(scrollToClass)) {
                    e = element[0];
                    // TODO: magical constant - why
                    e.parentElement.scrollTop = e.offsetTop - 160;
                }
            }
        );
    };
};
