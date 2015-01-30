var encryptionService = function () {
    var service = {};
    var passphrase;

    service.setPassphrase = function (phrase) {
        passphrase = phrase;
    };

    service.computeHash = function (phrase) {
        return CryptoJS.SHA256(phrase).toString();
    };

    service.encrypt = function (s) {
        var temp;

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

