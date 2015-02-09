var encryptionService = function (
    $window, $interval, $state
) {
    var service = {};
    var locked = true;
    var lastUserAction = new Date();
    var passphrase;

    var lock = function () {
        passphrase = undefined;
        locked = true;
        $state.go("settings");
    };

    // TODO: move $window.onblur here too
    var updateUserAction = function () {
        lastUserAction = new Date();
    };

    // TODO: extract to the lock service
    // TODO: use moment.js for all date operations
    // TODO: choose $window.onclick vs angular.element($window).bind vs
    //       angular.element($window).on("click") vs ...
    $window.onclick = updateUserAction;
    $window.onkeypress = updateUserAction;

    $interval(
        function () {
            var now = new Date();
            //if ((now - lastUserAction) > 15 * 60 * 1000) { // 15 min
            if ((now - lastUserAction) > 15 * 1000) { // 15 sec
                lock();
            }
        },
        5 * 1000 // 5 sec
    );


    service.getPassphrase = function () {
        return passphrase;
    };

    service.setPassphrase = function (phrase) {
        passphrase = phrase;
        locked = false;
    };

    service.lock = function () {
        locked = true;
        passphrase = undefined;
    };

    service.hash = null;

    service.computeHash = function (phrase) {
        return CryptoJS.SHA256(phrase).toString();
    };

    service.encrypt = function (s) {
        var temp;

        if (locked) {
            throw "encryption error: locked";
        }

        if (s) {
            temp = CryptoJS.AES.encrypt(s, passphrase);
            return temp.toString();
        }
        else {
            return "";
        }
    };

    service.decrypt = function (s) {
        var temp;

        if (s) {
            // This can throw - user should catch and take care
            temp = CryptoJS.AES.decrypt(s, passphrase)
            temp = temp.toString(CryptoJS.enc.Utf8);
            
            if (temp) {
                return temp;
            }
            else {
                throw "decryption error: empty result for non-empty input";
            }
        }
        else {
            return "";
        }
    };

    return service;
};

