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
            [{path_display: "a"}, {path_display: "b"}],
            {}
        );

        expect(res).toEqual(["a", "b"]);
    });

    it("should import everything for unrelated status", function () {
        var res = service.filesToImport(
            [{path_display: "a"}, {path_display: "b"}],
            {"c": null, "d": null}
        );

        expect(res).toEqual(["a", "b"]);
    });

    it("should import everything for outdated status", function () {
        var res = service.filesToImport(
            [
                {path_display: "a", server_modified: "2015-01-01"},
                {path_display: "b", server_modified: "2015-01-01"}
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
                {path_display: "a", server_modified: "2015-01-01"},
                {path_display: "b", server_modified: "2015-01-01"},
                {path_display: "c", server_modified: "2015-01-01"},
            ],
            {
                a: {lastImport: "2015-02-02"},
                b: {lastImport: "2014-01-01"},
                d: {lastImport: "2014-01-01"}
            }
        );

        expect(res).toEqual(["b", "c"]);
    });

    it("should export nothing for no years", function () {
        var res = service.yearsToExport([], {});
        expect(res).toEqual([]);
    });

    it("should export everything for empty status", function () {
        var res = service.yearsToExport(
            [{year: "2000"}, {year: "2001"}],
            {}
        );

        expect(res).toEqual(["2000", "2001"]);
    });

    it("should export everything for unrelated status", function () {
        var res = service.yearsToExport(
            [{year: "2000"}, {year: "2001"}],
            {"2002": null, "2003": null}
        );

        expect(res).toEqual(["2000", "2001"]);
    });

    it("should export everything for outdated status", function () {
        var res = service.yearsToExport(
            [
                {year: "2000", updated: "2015-01-01"},
                {year: "2001", updated: "2015-01-01"}
            ],
            {
                '/backups/dayary/2000.json': {lastExport: "2014-01-01"},
                '/backups/dayary/2001.json': {lastExport: "2014-01-01"}
            }
        );

        expect(res).toEqual(["2000", "2001"]);
    });

    it("should export recently updated and new years only", function () {
        var res = service.yearsToExport(
            [
                {year: "2000", updated: "2015-01-01"},
                {year: "2001", updated: "2015-01-01"},
                {year: "2002", updated: "2015-01-01"},
            ],
            {
                '/backups/dayary/2000.json': {lastExport: "2015-02-02"},
                '/backups/dayary/2001.json': {lastExport: "2014-01-01"},
                '/backups/dayary/2003.json': {lastExport: "2014-01-01"}
            }
        );

        expect(res).toEqual(["2001", "2002"]);
    });
});
