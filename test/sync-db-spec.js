describe("sync db", function () {
    var service;
    var db;
    var dropbox;
    var initialized;

    beforeEach(module('app'));

    beforeEach(inject(
        function (settingsService, errorService, dropboxService) {
            dropbox = dropboxService;
            db = dbService(Q, errorService);
            service = syncService(Q, settingsService, db, dropbox);
        }
    ));

    beforeEach(function (done) {
        if (initialized) {
            done();
        }
        else {
            initialized = true;
            db.cleanDb().then(db.init).then(done);
        }
    });

    it("should pass", function () {
        expect(true).toBeTruthy();
    });

    it("should export empty year", function (done) {
        spyOn(dropbox, "writeFile").and.returnValue({
            then: function (callback) {
                callback();
            }
        });

        service.exportYear("2000")
            .then(function (data) {
                expect(data).toBeUndefined();
            })
            .then(db.getSyncStatus)
            .then(function (data) {
                var path = "/backups/dayary/2000.json";
                expect(_.keys(data)).toEqual([path]);
                expect(data[path].lastImport).toBeNull();
                expect(data[path].lastExport).toBeDefined();
                done();
            });
    });
});
