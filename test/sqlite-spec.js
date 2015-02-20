var fs = require('fs'),
    backend = require('../server/sqlite-backend');

var db = "test/records.sqlite";

try {
    fs.unlinkSync(db);
}
catch (err) {
    // Nothing doing
}

backend.openDb(db);


describe("sqlite backend", function () {

    it("should have no settings at the beginning", function (done) {
        backend.getSettings(function (err, settings) {
            expect(err).toBe(null);
            expect(settings).toEqual({});
            done();
        });
    });

    it("should set setting with no error", function (done) {
        backend.setSettings({ a: 42 }, function (error) {
            expect(error).toBe(undefined);
            done();
        });
    });

    it("should refuse to set hash the common way", function (done) {
        backend.setSettings({ hash: 42 }, function (error) {
            expect(error).toBe("set settings: cannot accept hash");
            done();
        });
    });

    it("should get one setting now", function (done) {
        backend.getSettings(function (err, settings) {
            expect(err).toBe(null);
            expect(settings).toEqual({ a: "42" });
            done();
        });
    });

    it("should succeed setting hash", function (done) {
        backend.setHash("aba", function (err) {
            expect(err).toBe(null);
            done();
        });
    });

    it("should fail resetting hash", function (done) {
        backend.setHash("bcb", function (err) {
            expect(err).toBe("set hash: cannot replace existing hash");
            done();
        });
    });

    it("should get have 'a' and 'hash' settings now", function (done) {
        backend.getSettings(function (err, settings) {
            expect(err).toBe(null);
            expect(settings).toEqual({ a: "42", hash: "aba" });
            done();
        });
    });


    it("should have no records at the beginning", function (done) {
        backend.getRecordsMetadata(function (err, records) {
            expect(err).toBe(null);
            expect(records).toEqual([]);
            done();
        });
    });

    it("should add a record", function (done) {
        backend.addRecord(
            {text: 'aa', created: 1, updated: 2 },
            function (err, record) {
                expect(err).toBe(null);
                expect(record).toEqual(
                    { id: 1, text: 'aa', created: '1', updated: '2' }
                );
                done();
            }
        );
    });
});
