var fs = require('fs'),
    _ = require('underscore'),
    sqlite = require('sqlite3').verbose(),
    jsonBackend = require('./json-backend');

var jsonFile = __dirname + "/../data/records.json";

var data;
var db;

var loadRecords = function () {
    if (fs.existsSync(jsonFile)) {
        // File from version < 0.4
        data = jsonBackend.getAllData();
    }
};

exports.openDb = function (dbFile) {
    var dbExists = fs.existsSync(dbFile);

    db = new sqlite.Database(dbFile);

    if ( ! dbExists) {
        db.serialize(function () {
            db.run("CREATE TABLE Settings (" +
                "key VARCHAR PRIMARY KEY," +
                "value VARCHAR" +
            ")");

            db.run("CREATE TABLE Records (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "created TEXT," +
                "updated TEXT," +
                "text TEXT" +
            ")");
        });
    }
};

exports.getSettings = function (callback) {
    db.all("SELECT key, value FROM Settings", function (err, rows) {
        if (err) {
            callback(err);
            return;
        }

        var settings = {};
        _.each(rows, function(row) {
            settings[row.key] = row.value;
        });

        callback(null, settings);
    });
};

// Object of all the settings excluding hash
exports.setSettings = function (settings, callback) {
    if ('hash' in settings) {
        callback("set settings: cannot accept hash");
        return;
    }

    db.serialize(function () {
        var sql = "INSERT OR REPLACE " +
            "INTO Settings (key, value) " +
            "VALUES (?, ?)";
        var stmt = db.prepare(sql);

        _.each(settings, function (value, key) {
            stmt.run(key, value);
        });

        stmt.finalize(callback);
    });
};

exports.setHash = function (hash, callback) {
    db.get(
        "SELECT value FROM Settings WHERE key = 'hash'",
        function (err, row) {
            if (row) {
                callback("set hash: cannot replace existing hash");
            }
            else {
                db.run(
                    "INSERT INTO Settings (key, value) VALUES ('hash', ?)",
                    hash,
                    callback
                );
            }
        }
    );
};

exports.getRecordsMetadata = function (callback) {
    db.all(
        "SELECT id, created, updated FROM Records",
        callback
    );
};

exports.getRecord = function (id, callback) {
    db.get(
        "SELECT * FROM Records WHERE id = ?",
        id,
        callback
    );
};

exports.addRecord = function (record, callback) {
    db.run(
        "INSERT INTO Records (created, updated, text) VALUES (?, ?, ?)",
        [record.created, record.updated, record.text],
        function (error) {
            if (error) {
                callback(error);
            }
            else {
                exports.getRecord(this.lastID, callback);
            }
        }
    );
};

exports.updateRecord = function (record, callback) {
    db.run(
        "UPDATE Records SET text = ?, updated = ? WHERE id = ?",
        [record.text, record.updated, record.id],
        callback
    );
};

exports.deleteRecord = function (record, callback) {
    db.run(
        "DELETE FROM Records WHERE id = ?",
        record.id,
        callback
    );
};
