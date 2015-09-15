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
        spyOn(dropbox, "writeFile").and.returnValue( Q(null) );

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

    it("should import empty file", function (done) {
        var file = "data.file";

        spyOn(dropbox, "readFile").and.returnValue( Q('[]') );

        service.importFile(file)
            .then(function (data) {
                expect(data).toBeUndefined();
            })
            .then(db.getSyncStatus)
            .then(function (data) {
                expect(_.keys(data))
                    .toEqual(["/backups/dayary/2000.json", file]);
                expect(data[file].lastExport).toBeNull();
                expect(data[file].lastImport).toBeDefined();
            })
            .then(db.getAllRecords)
            .then(function (data) {
                expect(data).toEqual([]);
                done();
            });
    });

    it("should import file with one record", function (done) {
        var file = "data.file";
        var records = '[{' +
            '"created": "2015-01-01", "updated": "2015-01-01", "text": ""' +
            '}]';

        spyOn(dropbox, "readFile").and.returnValue( Q(records) );

        service.importFile(file)
            .then(function (data) {
                expect(data).toBeUndefined();
            })
            .then(db.getAllRecords)
            .then(function (data) {
                expect(data).toEqual( [ {
                    id: 1,
                    created: "2015-01-01",
                    updated: "2015-01-01"
                } ] );
                done();
            });
    });
});
