var dbService = function () {
    var db;

    var service = {};
    // TODO: take care of errors and successes and all the callbacks
    service.init = function () {
        db = openDatabase("dayary", "0.8", "Dayary DB", 5 * 1000 * 1000);

        db.transaction(function (tx) {
            tx.executeSql(
                "CREATE TABLE IF NOT EXISTS Records (" +
                    "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                    "created TEXT," +
                    "updated TEXT," +
                    "text TEXT" +
                ")"
            );
        });
    };

    service.add = function (record) {
        db.transaction(function (tx) {
            tx.executeSql(
                "INSERT INTO Records (created, updated) VALUES (?, ?)",
                [record.created, record.updated]
            );
        });
    };

    return service;
};

