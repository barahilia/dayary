
describe("app module", function () {

    beforeEach(module('app'));

    describe("lock service", function () {
        var service;

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

    describe("encryption service", function () {
        var service;

        beforeEach(inject(function (encryptionService) {
            service = encryptionService;
        }));

        it("should change input string", function () {
            var s = "input string";
            service.setPassphrase("passphrase");
            expect(service.encrypt(s)).not.toBe(s);
        });

        it("should decrypt to original", function () {
            var s = "input string";
            var encrypted, decrypted;

            service.setPassphrase("passphrase");
            encrypted = service.encrypt(s);
            decrypted = service.decrypt(encrypted);

            expect(decrypted).toBe(s);
        });
    });

    describe("db service", function () {
        var service;
        var initialized;

        beforeEach(inject(function (errorService) {
            if (!service) {
                service = dbService(Q, errorService);
            }
        }));

        beforeEach(function (done) {
            if (initialized) {
                done();
            }
            else {
                initialized = true;
                // TODO: it's stupid to init before and after clean
                service.init()
                    .then(service.cleanDb)
                    .then(service.init)
                    .then(done);
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
            service.setSettings({ a: 42 })
                .then(function (results) {
                    expect(results.length).toBe(1);
                    expect(results[0].rowsAffected).toBe(1);
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
            service.addRecord({text: 'aa', created: 1, updated: 2 })
                .then(function (record) {
                    expect(record).toEqual(
                        { id: 1, text: 'aa', created: '1.0', updated: '2.0' }
                    );
                    done();
                });
        });

        it("should update a record", function (done) {
            service.updateRecord(
                { id: 1, text: 'bbb', created: '1', updated: '15' }
            ).then(function (data) {
                expect(data).toBeUndefined();
                done();
            });
        });

        it("should add another record", function (done) {
            service.addRecord({ text: null, created: 3, updated: 4 })
                .then(function (record) {
                    expect(record).toEqual(
                        { id: 2, text: null, created: '3.0', updated: '4.0' }
                    );
                    done();
                });
        });

        it("should have two records by now", function (done) {
            service.getAllRecords()
                .then(function (records) {
                    expect(records).toEqual([
                        { id: 1, created: '1', updated: '15' },
                        { id: 2, created: '3.0', updated: '4.0' }
                    ]);
                    done();
                });
        });

        it("should delete a record", function (done) {
            service.deleteRecord(1)
                .then(function (data) {
                    expect(data).toBeUndefined();
                    done();
                });
        });

        it("should have one record after deletion", function (done) {
            service.getAllRecords()
                .then(function (records) {
                    expect(records).toEqual([
                        { id: 2, created: '3.0', updated: '4.0' }
                    ]);
                    done();
                });
        });

        it("should fail updating non-existing record", function (done) {
            service.updateRecord({ id: 17, text: 'bbb', updated: '15' })
                .then(
                    null,
                    function (err) {
                        var s = 'update record: failure updating or no changes';
                        expect(err).toBe(s);
                        done();
                    }
                );
        });
    });

});

