var fs = require('fs'),
    backend = require('../../server/sqlite-backend');

var db = "test/records.sqlite";

try {
    fs.unlinkSync(db);
}
catch (err) {
    // Nothing doing
}

backend.openDb(db);


describe("sqlite backend", function () {

    it("should fail resetting hash", function (done) {
        backend.setHash("bcb", function (err) {
            expect(err).toBe("set hash: cannot replace existing hash");
            done();
        });
    });


    it("should fail updating non-existing record", function (done) {
        backend.updateRecord(
            { id: 17, text: 'bbb', updated: '15' },
            function (err) {
                expect(err).toBe('update record: failure updating or no changes');
                done();
            }
        )
    });
});
