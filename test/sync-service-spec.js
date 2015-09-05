describe("sync service", function () {
    var service;

    beforeEach(module('app'));

    beforeEach(inject(function (syncService) {
        service = syncService;
    }));

    it("should import nothing for no files", function () {
        var res = service.filesToImport([], {});
        expect(res).toEqual([]);
    });

    it("should import everything for empty status", function () {
        var res = service.filesToImport(
            [{path: "a"}, {path: "b"}],
            {}
        );

        expect(res).toEqual(["a", "b"]);
    });

    it("should import everything for unrelated status", function () {
        var res = service.filesToImport(
            [{path: "a"}, {path: "b"}],
            {"c": null, "d": null}
        );

        expect(res).toEqual(["a", "b"]);
    });

    it("should import everything for outdated status", function () {
        var res = service.filesToImport(
            [
                {path: "a", modifiedAt: "2015-01-01"},
                {path: "b", modifiedAt: "2015-01-01"}
            ],
            {
                a: {lastImport: "2014-01-01"},
                b: {lastImport: "2014-01-01"}
            }
        );

        expect(res).toEqual(["a", "b"]);
    });

    it("should import recently updated and new files only", function () {
        var res = service.filesToImport(
            [
                {path: "a", modifiedAt: "2015-01-01"},
                {path: "b", modifiedAt: "2015-01-01"},
                {path: "c", modifiedAt: "2015-01-01"},
            ],
            {
                a: {lastImport: "2015-02-02"},
                b: {lastImport: "2014-01-01"},
                d: {lastImport: "2014-01-01"}
            }
        );

        expect(res).toEqual(["b", "c"]);
    });
});
