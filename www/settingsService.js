export var settingsService = function () {

    // TODO: consider removing this service; leave a constant only
    var service = {};

    var defaults = {
        autosaveIntervalSec: 30,
        lockTimeoutMin: 5,
        lockOnBlur: false,
        dropboxFolder: "/backups/dayary",
        // Filled in on the first run from what the user agent tells about
        // itself; see deviceService.
        device: "",
        // The single year the sync is limited to. Empty means all of them,
        // which is what the sync did before the choice existed and what a
        // complete sync goes back to. Kept here rather than asked for every
        // time: a device that only ever writes this year's entries has no
        // reason to walk the whole diary on each sync.
        syncYear: ""
    };

    service.settings = Object.assign({}, defaults);

    // Settings saved before a setting existed simply carry no key for it, so
    // the stored values go over the defaults instead of replacing them -
    // otherwise every setting added from here on reads as undefined for
    // everyone who already keeps a diary.
    service.init = function (settings) {
        service.settings = Object.assign({}, defaults, settings);
    };

    return service;
};

