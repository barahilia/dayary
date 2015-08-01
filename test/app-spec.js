
describe("lock service", function () {

    beforeEach(module('app'));

    it("should simply pass at last", function () {
        expect(true).toBeTruthy();
    });

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
