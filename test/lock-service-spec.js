describe("lock service", function () {
    var service;

    beforeEach(module('app'));

    beforeEach(inject(function (lockService, dbService) {
        service = lockService;

        // Unlocking persists the passphrase hash. This suite is about the
        // lock state alone and never calls dbService.init(), so keep the
        // database out of it.
        spyOn(dbService, 'setHash');
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
