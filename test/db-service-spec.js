describe("db service", function () {
    var service;
    var initialized;

    // clear() empties a store but does not reset its key generator, and the
    // suites before this one have used the same database, so the ids here
    // are whatever the store hands out - remembered as the specs go.
    var firstId;
    var secondId;

    beforeEach(module('app'));

    beforeEach(inject(function (errorService) {
        if (!service) {
            service = dbService(Q, errorService);
        }
    }));

    // The whole suite is one sequence over one database: init it and empty it
    // once, then let every spec see what the previous ones left behind.
    beforeEach(function (done) {
        if (initialized) {
            done();
        }
        else {
            initialized = true;
            service.init()
                .then(service.cleanDb)
                // done() takes any argument as a failure, and cleanDb
                // resolves with the results of its clear requests.
                .then(function () { done(); });
        }
    });

    it("should have no settings at the beginning", function (done) {
        service.getSettings()
            .then(function (settings) {
                expect(settings).toEqual({});
                done();
            });
    });

    it("should set and get hash", function (done) {
        service.setHash("aba")
            .then(service.getHash)
            .then(function (hash) {
                expect(hash).toBe("aba");
                done();
            });
    });

    it("should fail resetting hash", function (done) {
        service.setHash("bcb")
            .then(
                null,
                function (err) {
                    var s = "set hash: cannot replace existing hash";
                    expect(err).toBe(s);
                    done();
                }
            );
    });

    it("should set one setting", function (done) {
        // IndexedDB resolves a write with the key of the written object.
        service.setSettings({ a: 42 })
            .then(function (keys) {
                expect(keys).toEqual(['a']);
                done();
            });
    });

    it("should get one setting now", function (done) {
        service.getSettings()
            .then(function (settings) {
                expect(settings).toEqual({ a: 42 });
                done();
            });
    });

    it("should have no records at the beginning", function (done) {
        service.getAllRecords()
            .then(function (records) {
                expect(records).toEqual([]);
                done();
            });
    });

    it("should add a record", function (done) {
        service.addRecord(
            { text: 'aa', created: '2015-05-01', updated: '2015-05-02' }
        ).then(function (record) {
            firstId = record.id;

            expect(firstId).toEqual(jasmine.any(Number));
            expect(record).toEqual({
                id: firstId, text: 'aa',
                created: '2015-05-01', updated: '2015-05-02'
            });
            done();
        });
    });

    it("should update a record", function (done) {
        service.updateRecord(
            { id: firstId, text: 'bbb', created: '2015-05-01',
              updated: '2015-05-15' }
        ).then(function (id) {
            expect(id).toBe(firstId);
            done();
        });
    });

    it("should add another record", function (done) {
        service.addRecord(
            { text: null, created: '2015-05-03', updated: '2015-05-04' }
        ).then(function (record) {
            secondId = record.id;

            expect(secondId).toBeGreaterThan(firstId);
            expect(record).toEqual({
                id: secondId, text: null,
                created: '2015-05-03', updated: '2015-05-04'
            });
            done();
        });
    });

    it("should have two records by now", function (done) {
        // Whole records, text included - unlike the Web SQL query this
        // replaced, getAll() cannot return a subset of the fields.
        service.getAllRecords()
            .then(function (records) {
                expect(records).toEqual([
                    { id: firstId, text: 'bbb',
                      created: '2015-05-01', updated: '2015-05-15' },
                    { id: secondId, text: null,
                      created: '2015-05-03', updated: '2015-05-04' }
                ]);
                done();
            });
    });

    it("should delete a record", function (done) {
        service.deleteRecord(firstId)
            .then(function (data) {
                expect(data).toBeUndefined();
                done();
            });
    });

    it("should have one record after deletion", function (done) {
        service.getAllRecords()
            .then(function (records) {
                expect(records).toEqual([
                    { id: secondId, text: null,
                      created: '2015-05-03', updated: '2015-05-04' }
                ]);
                done();
            });
    });

    it("should create a record when updating a missing one", function (done) {
        // put() upserts: unlike the Web SQL update this replaced, it cannot
        // report that no row matched.
        var record = { id: 17, text: 'bbb',
                       created: '2015-05-05', updated: '2015-05-06' };

        service.updateRecord(record)
            .then(function (id) {
                expect(id).toBe(17);
            })
            .then(function () {
                return service.getRecord(17);
            })
            .then(function (stored) {
                expect(stored).toEqual(record);
                done();
            });
    });
});
