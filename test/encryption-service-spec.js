describe("encryption service", function () {
    var service;

    beforeEach(module('app'));

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
