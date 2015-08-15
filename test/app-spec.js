
describe("app module", function () {

    beforeEach(module('app'));

    describe("lock service", function () {
        var service;

        beforeEach(inject(function (lockService) {
            service = lockService;
        }));

        it("should start locked", function () {
            expect(service.locked()).toBeTruthy();
        });

        it("should be locked and unlocked", function () {
            service.unlock();
            expect(service.locked()).toBeFalsy();
            service.lock();
            expect(service.locked()).toBeTruthy();
        });
    });

    describe("encryption service", function () {
        var service;

        beforeEach(inject(function (encryptionService) {
            service = encryptionService;
        }));

        it("should change input string", function () {
            var s = "input string";
            service.setPassphrase("passphrase");
            expect(service.encrypt(s)).not.toBe(s);
        });

        it("should decrypt to original", function () {
            var s = "input string";
            var encrypted, decrypted;

            service.setPassphrase("passphrase");
            encrypted = service.encrypt(s);
            decrypted = service.decrypt(encrypted);

            expect(decrypted).toBe(s);
        });
    });

    describe("db service", function () {
        var service;

        beforeEach(inject(function (errorService) {
            service = dbService(Q, errorService);
            service.init();
        }));

        it("should have no settings at the beginning", function (done) {
            service.getSettings()
                .then(function (settings) {
                    expect(settings).toEqual({});
                    done();
                });
        });

        it("should have no records at the beginning", function (done) {
            service.getAllRecords()
                .then(function (records) {
                    expect(records).toEqual([]);
                    done();
                });
        });
    });

});
