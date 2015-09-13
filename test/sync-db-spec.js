describe("sync db", function () {
    var service;
    var db;
    var initialized;

    beforeEach(module('app'));

    beforeEach(inject(function (settingsService, errorService) {
        var fakeDropboxService = null;

        db = dbService(Q, errorService);

        if (!service) {
            service = syncService(Q, settingsService, db, fakeDropboxService);
        }
    }));

    beforeEach(function (done) {
        if (initialized) {
            done();
        }
        else {
            initialized = true;

            db.cleanDb()
                .then(db.init)
                .then(done);
        }
    });

    it("should pass", function () {
        expect(true).toBeTruthy();
    });
});
