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

    // The exported JSON carries whatever key order a record happens to have
    // in the store, so compare the data written and not its text.
    var writtenFile = function () {
        var args = dropbox.writeFile.calls.mostRecent().args;

        return { path: args[0], records: JSON.parse(args[1]) };
    };

    // Like the db suite, this one is a sequence over a single database:
    // empty it once and let each spec build on what the previous left.
    beforeEach(function (done) {
        db.init().then(function () {
            if (initialized) {
                done();
            }
            else {
                initialized = true;
                // done() takes any argument as a failure, and cleanDb
                // resolves with the results of its clear requests.
                db.cleanDb().then(function () { done(); });
            }
        });
    });

    it("should export empty year", function (done) {
        var path = "/backups/dayary/2000.json";

        spyOn(dropbox, "writeFile").and.returnValue( Q(null) );

        service.exportYear("2000")
            .then(function (data) {
                // Resolves with the key of the written sync status.
                expect(data).toBe(path);
            })
            .then(db.getSyncStatus)
            .then(function (data) {
                expect(Object.keys(data)).toEqual([path]);
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
                expect(data).toBe(file);
            })
            .then(db.getSyncStatus)
            .then(function (data) {
                expect(Object.keys(data))
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
            '"created": "2015-05-01", "updated": "2015-05-01", "text": ""' +
            '}]';

        spyOn(dropbox, "readFile").and.returnValue( Q(records) );

        service.importFile(file)
            .then(function (data) {
                expect(data).toBe(file);
            })
            .then(db.getAllRecords)
            .then(function (data) {
                expect(data).toEqual( [ {
                    id: 1,
                    created: "2015-05-01",
                    updated: "2015-05-01",
                    text: ""
                } ] );
                done();
            });
    });

    it("should sync file with new records back and forth", function (done) {
        var file = "data.file";
        var records = '[' +
            '{"created": "2015-05-02", "updated": "2015-05-01", "text": ""},' +
            '{"created": "2015-05-03", "updated": "2015-05-01", "text": ""}' +
            ']';
        var dbRecords = [
            { id: 1, created: '2015-05-01', updated: '2015-05-01', text: "" },
            { id: 2, created: '2015-05-02', updated: '2015-05-01', text: "" },
            { id: 3, created: '2015-05-03', updated: '2015-05-01', text: "" }
        ];

        spyOn(dropbox, "listFiles").and.returnValue(
            Q([{path_display: file, server_modified: "9999-01-01"}])
        );
        spyOn(dropbox, "readFile").and.returnValue( Q(records) );
        spyOn(dropbox, "writeFile").and.returnValue( Q(null) );

        service.sync()
            .then(function () {
                expect(dropbox.listFiles).toHaveBeenCalled();
                expect(dropbox.readFile).toHaveBeenCalledWith(file);
                expect(writtenFile()).toEqual({
                    path: '/backups/dayary/2015.json',
                    records: dbRecords
                });
            })
            .then(db.getAllRecords)
            .then(function (data) {
                expect(data).toEqual(dbRecords);
            })
            .then(done);
    });

    it("should do nothing with old files", function (done) {
        var file = "data.file";
        var dbRecords = [
            { id: 1, created: '2015-05-01', updated: '2015-05-01', text: "" },
            { id: 2, created: '2015-05-02', updated: '2015-05-01', text: "" },
            { id: 3, created: '2015-05-03', updated: '2015-05-01', text: "" }
        ];

        spyOn(dropbox, "listFiles").and.returnValue(
            Q([{path_display: file, server_modified: "2000-01-01"}])
        );
        spyOn(dropbox, "readFile");
        spyOn(dropbox, "writeFile");

        service.sync()
            .then(function () {
                expect(dropbox.listFiles).toHaveBeenCalled();
                expect(dropbox.readFile.calls.any()).toBeFalsy();
                expect(dropbox.writeFile.calls.any()).toBeFalsy();
            })
            .then(db.getAllRecords)
            .then(function (data) {
                expect(data).toEqual(dbRecords);
            })
            .then(done);
    });

    it("should update only newer records", function (done) {
        var file = "data.file";
        var records = '[' +
            '{"created": "2015-05-01", "updated": "2015-05-02",' +
            ' "text": "newer"},' +
            '{"created": "2015-05-03", "updated": "2015-05-01",' +
            ' "text": "newer"}' +
            ']';
        var dbRecords = [
            { id: 1, created: '2015-05-01', updated: '2015-05-02',
              text: "newer" },
            { id: 2, created: '2015-05-02', updated: '2015-05-01', text: "" },
            { id: 3, created: '2015-05-03', updated: '2015-05-01', text: "" }
        ];

        spyOn(dropbox, "listFiles").and.returnValue(
            Q([{path_display: file, server_modified: "9999-01-01"}])
        );
        spyOn(dropbox, "readFile").and.returnValue( Q(records) );
        spyOn(dropbox, "writeFile");

        service.sync()
            .then(function () {
                expect(dropbox.listFiles).toHaveBeenCalled();
                expect(dropbox.readFile).toHaveBeenCalledWith(file);
                expect(dropbox.writeFile.calls.any()).toBeFalsy();
            })
            .then(function () {
                return db.getYearlyRecords("2015");
            })
            .then(function (data) {
                expect(data).toEqual(dbRecords);
            })
            .then(done);
    });

    it("should export year due to recently updated record", function (done) {
        var dbRecords = [
            { id: 1, created: '2015-05-01', updated: '2015-05-02',
              text: "newer" },
            { id: 2, created: '2015-05-02', updated: '2015-05-01',
              text: "" },
            { id: 3, created: '2015-05-03', updated: '9999-05-01',
              text: "recently updated" }
        ];

        spyOn(dropbox, "listFiles").and.returnValue( Q([]) );
        spyOn(dropbox, "readFile");
        spyOn(dropbox, "writeFile").and.returnValue( Q(null) );

        service.sync()
            .then(function () {
                expect(dropbox.listFiles).toHaveBeenCalled();
                expect(dropbox.readFile.calls.any()).toBeFalsy();
                expect(dropbox.writeFile.calls.any()).toBeFalsy();
            })
            .then(function () {
                return db.updateRecord(dbRecords[2]);
            })
            .then(service.sync)
            .then(function () {
                expect(dropbox.listFiles).toHaveBeenCalled();
                expect(dropbox.readFile.calls.any()).toBeFalsy();
                expect(writtenFile()).toEqual({
                    path: '/backups/dayary/2015.json',
                    records: dbRecords
                });
            })
            .then(done);
    });

    it("should import one of recurrent records in one file", function (done) {
        var file = "data.file";
        var fileRecords = [
            { id: 1, created: '2015-05-04', updated: '2015-05-06', text: "" },
            { id: 2, created: '2015-05-04', updated: '2015-05-05', text: "" }
        ];
        var dbRecords = [
            { id: 1, created: '2015-05-01', updated: '2015-05-02',
              text: "newer" },
            { id: 2, created: '2015-05-02', updated: '2015-05-01', text: "" },
            { id: 3, created: '2015-05-03', updated: '9999-05-01',
              text: "recently updated" },
            { id: 4, created: '2015-05-04', updated: '2015-05-06', text: "" }
        ];

        spyOn(dropbox, "listFiles").and.returnValue(
            Q([{path_display: file, server_modified: "9999-01-01"}])
        );
        spyOn(dropbox, "readFile").and.returnValue(
            Q(JSON.stringify(fileRecords))
        );
        spyOn(dropbox, "writeFile");

        service.sync()
            .then(function () {
                expect(dropbox.listFiles).toHaveBeenCalled();
                expect(dropbox.readFile).toHaveBeenCalled();
            })
            .then(db.getAllRecords)
            .then(function (data) {
                expect(data).toEqual(dbRecords);
            })
            .then(done);
    });

    it("should import one of recurrent records in two files", function (done) {
        var files = [
            {path_display: "0", server_modified: "9999-01-01"},
            {path_display: "1", server_modified: "9999-01-01"}
        ];
        var fileRecords = [
            { id: 1, created: '2015-05-05', updated: '2015-05-05', text: "" },
            { id: 2, created: '2015-05-05', updated: '2015-05-06', text: "" }
        ];
        var dbRecords = [
            { id: 1, created: '2015-05-01', updated: '2015-05-02',
              text: "newer" },
            { id: 2, created: '2015-05-02', updated: '2015-05-01', text: "" },
            { id: 3, created: '2015-05-03', updated: '9999-05-01',
              text: "recently updated" },
            { id: 4, created: '2015-05-04', updated: '2015-05-06', text: "" },
            { id: 5, created: '2015-05-05', updated: '2015-05-06', text: "" }
        ];

        spyOn(dropbox, "listFiles").and.returnValue( Q(files) );
        spyOn(dropbox, "readFile").and.callFake(function (path) {
            return Q( JSON.stringify( [ fileRecords[path] ] ) );
        });
        spyOn(dropbox, "writeFile");

        service.sync()
            .then(function () {
                expect(dropbox.listFiles).toHaveBeenCalled();
                expect(dropbox.readFile).toHaveBeenCalledWith("0");
                expect(dropbox.readFile).toHaveBeenCalledWith("1");
            })
            .then(db.getAllRecords)
            .then(function (data) {
                expect(data).toEqual(dbRecords);
            })
            .then(done);
    });

    it("should import the device a record was written on", function (done) {
        var file = "data.file";
        var records = '[{' +
            '"created": "2015-05-06", "updated": "2015-05-06",' +
            ' "text": "", "device": "Laptop"' +
            '}]';

        spyOn(dropbox, "readFile").and.returnValue( Q(records) );

        service.importFile(file)
            .then(function () {
                return db.getRecord(6);
            })
            .then(function (record) {
                expect(record).toEqual({
                    id: 6, created: "2015-05-06", updated: "2015-05-06",
                    text: "", device: "Laptop"
                });
                done();
            });
    });

    it("should keep that device when another one updates it", function (done) {
        var file = "data.file";
        var records = '[{' +
            '"created": "2015-05-06", "updated": "2015-05-07",' +
            ' "text": "newer", "device": "Phone"' +
            '}]';

        spyOn(dropbox, "readFile").and.returnValue( Q(records) );

        service.importFile(file)
            .then(function () {
                return db.getRecord(6);
            })
            .then(function (record) {
                expect(record).toEqual({
                    id: 6, created: "2015-05-06", updated: "2015-05-07",
                    text: "newer", device: "Laptop"
                });
                done();
            });
    });

    it("should take the device of a record having none", function (done) {
        var file = "data.file";
        var records = '[{' +
            '"created": "2015-05-05", "updated": "2015-05-08",' +
            ' "text": "newer", "device": "Phone"' +
            '}]';

        spyOn(dropbox, "readFile").and.returnValue( Q(records) );

        service.importFile(file)
            .then(function () {
                return db.getRecord(5);
            })
            .then(function (record) {
                expect(record).toEqual({
                    id: 5, created: "2015-05-05", updated: "2015-05-08",
                    text: "newer", device: "Phone"
                });
                done();
            });
    });
});
