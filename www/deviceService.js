// Where a record was written. No browser gives away the machine it runs on -
// `location.hostname` is the server, the same string on every device - so the
// best available stand-in is what the user agent says about itself. That names
// a browser profile rather than a machine: the same laptop in two browsers
// counts as two devices here, which is where the data actually lives, each
// profile having its own IndexedDB. It is only a first guess anyway; the user
// renames it in Settings.
export var deviceService = function ($q) {

    var service = {};

    var match = function (ua, table) {
        var found = table.find(function (entry) {
            return entry[1].test(ua);
        });

        return found ? found[0] : null;
    };

    // Order matters: Edge and Opera also name Chrome, Chrome names Safari,
    // and every iOS browser names Safari over the one WebKit it is given.
    var browsers = [
        ['Edge', /\bEdg(?:A|iOS)?\//],
        ['Opera', /\bOP(?:R|iOS|T)\//],
        ['Firefox', /\b(?:Firefox|FxiOS)\//],
        ['Chrome', /\b(?:Chrome|CriOS)\//],
        ['Safari', /\bSafari\//]
    ];

    var platforms = [
        ['Android', /\bAndroid\b/],
        ['iOS', /\b(?:iPhone|iPad|iPod)\b/],
        ['ChromeOS', /\bCrOS\b/],
        ['Windows', /\bWindows\b/],
        ['macOS', /\b(?:Macintosh|Mac OS X)\b/],
        ['Linux', /\bLinux\b/]
    ];

    // Chromium pads its brand list with a deliberately variable entry -
    // "Not_A Brand", the punctuation changing between releases - to break
    // exactly the kind of sniffing below; and it names Chromium beside the
    // browser built on it, of which the browser is the interesting one.
    var brandFromData = function (brands) {
        var named = (brands || []).filter(function (brand) {
            return ! /not.{0,3}brand/i.test(brand.brand);
        });

        var branded = named.filter(function (brand) {
            return brand.brand !== 'Chromium';
        });

        var chosen = branded[0] || named[0];

        // The brands carry the vendor - "Google Chrome", "Microsoft Edge" -
        // where the name alone is what anyone calls it. Only the vendor goes:
        // a fork keeps its whole name, which is the point of reading the
        // brands rather than sniffing the user agent string for "Chrome".
        return chosen ? chosen.brand.replace(/^(?:Google|Microsoft) /, '') : null;
    };

    var label = function (place, browser) {
        var parts = [place, browser].filter(Boolean);

        return parts.length ? parts.join(' ') : 'Unknown device';
    };

    service.detect = function () {
        var navigator = window.navigator;
        var data = navigator.userAgentData;
        var ua = navigator.userAgent || '';

        if (!data) {
            return $q.when(label(match(ua, platforms), match(ua, browsers)));
        }

        var browser = brandFromData(data.brands) || match(ua, browsers);
        // Chromium freezes the platform token in its user agent string, so
        // take the hint over the string wherever the hints exist at all.
        var platform = data.platform || match(ua, platforms);

        // `model` is the phone naming itself - "Pixel 8" - and is empty on
        // anything that is not a mobile. Worth the one async call: it is the
        // only place a browser comes near an actual device name.
        return $q.when(
            data.getHighEntropyValues ?
                data.getHighEntropyValues(['model']) :
                null
        ).then(
            function (values) {
                var model = values && values.model;

                return label(model || platform, browser);
            },
            function () {
                // The hints can be denied by permissions policy; the low
                // entropy ones are still in hand.
                return label(platform, browser);
            }
        );
    };

    return service;
};

deviceService.$inject = ['$q'];
