describe("lock service", function () {
    var service;

    beforeEach(module('app'));

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
