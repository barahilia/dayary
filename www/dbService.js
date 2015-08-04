var dbService = function (errorService) {
    var db;

    var executeSingleQuery = function (query, callback, data) {
        callback = callback || function () {};

        db.transaction(function (tx) {
            tx.executeSql(
                query,
                data,
                function (txAgain, result) {}, // TODO: implement success callback
                function (txAgain, error) {
                    errorService.reportError("db error: " + error.message);
                    callback(error.message);
                }
            );
        });
    };


    var service = {};

    // TODO: take care of errors and successes and all the callbacks
    service.init = function () {
        db = openDatabase("dayary", "0.8", "Dayary DB", 5 * 1000 * 1000);

        executeSingleQuery(
            "CREATE TABLE IF NOT EXISTS Records (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "created TEXT," +
                "updated TEXT," +
                "text TEXT" +
            ")"
        );
    };

    service.getAllRecords = function (callback) {
        executeSingleQuery(
            "SELECT id, created, updated FROM Records",
            callback
        );
    };

    service.addRecord = function (record, callback) {
        executeSingleQuery(
            "INSERT INTO Records (created, updated) VALUES (?, ?)",
            callback,
            [record.created, record.updated]
        );
    };

    service.getRecord = function (id, callback) {
        executeSingleQuery(
            "SELECT * FROM Records WHERE id = ?",
            callback,
            [id]
        );
    };

    service.updateRecord = function (record, callback) {
        executeSingleQuery(
            "UPDATE Records " +
            "SET created = ?, updated = ?, text = ? " +
            "WHERE id = ?",
            callback,
            [record.created, record.updated, record.text, record.id]
        );
    };

    // TODO: think if return an error if record doesn't exist
    service.deleteRecord = function (id, callback) {
        executeSingleQuery(
            "DELETE FROM Records WHERE id = ?",
            callback,
            [id]
        );
    };

    return service;
};
