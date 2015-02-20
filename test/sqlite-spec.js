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
        backend.getSettings(function (settings) {
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
        backend.getSettings(function (settings) {
            expect(settings).toEqual({ a: "42" });
            done();
        });
    });
});
