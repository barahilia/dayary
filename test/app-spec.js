
describe("lock service", function () {

    beforeEach(module('app'));

    it("should start locked", inject(function (lockService) {
        expect(lockService.locked()).toBeTruthy();
    }));

    it("should be locked and unlocked", inject(function (lockService) {
        lockService.unlock();
        expect(lockService.locked()).toBeFalsy();
        lockService.lock();
        expect(lockService.locked()).toBeTruthy();
    }));
});

describe("encryption service", function () {

    beforeEach(module('app'));

    it("should change input string", inject(function (encryptionService) {
        var s = "input string";
        encryptionService.setPassphrase("passphrase");
        expect(encryptionService.encrypt(s)).not.toBe(s);
    }));

    it("should decrypt to original", inject(function (encryptionService) {
        var s = "input string";
        var encrypted, decrypted;

        encryptionService.setPassphrase("passphrase");
        encrypted = encryptionService.encrypt(s);
        decrypted = encryptionService.decrypt(encrypted);

        expect(decrypted).toBe(s);
    }));
});

describe("db service", function () {

    beforeEach(module('app'));

    it("should have no settings at the beginning", function (done) {
        inject(function (errorService) {
            var service = dbService(Q, errorService);
            service.init();
            service.getSettings()
                .then(function (settings) {
                    expect(settings).toEqual({});
                    done();
                });
        });
    });
});
