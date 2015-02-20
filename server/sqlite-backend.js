var fs = require('fs'),
    _ = require('underscore'),
    sqlite = require('sqlite3').verbose(),
    jsonBackend = require('./json-backend');

var jsonFile = __dirname + "/../data/records.json";

var data;

var loadRecords = function () {
    if (fs.existsSync(jsonFile)) {
        // File from version < 0.4
        data = jsonBackend.getAllData();
    }
};

var dbFile = __dirname + "/../data/records.sqlite";
var dbExists = fs.existsSync(dbFile);

var db = new sqlite.Database(dbFile);

if ( ! dbExists) {
    db.serialize(function () {
        db.run("CREATE TABLE Settings (" +
            "key varchar PRIMARY KEY," +
            "value varchar" +
        ")");

        db.run("CREATE TABLE Records (" +
            "id int PRIMARY KEY," +
            "created date," +
            "updated date," +
            "text text" +
        ")");
    });
}

exports.getSettings = function (callback) {
    db.all("SELECT key, value FROM Settings", function (err, rows) {
        var settings = {};
        _.each(rows, function(row) {
            settings[row.key] = row.value;
        });

        callback(settings);
    });
};

// Object of all the settings excluding hash
exports.setSettings = function (settings, callback) {
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

exports.setHash = function (hash) {
    throw "not implemented";
};

exports.getRecordsMetadata = function () {
    throw "not implemented";
};

exports.getRecord = function (id) {
    throw "not implemented";
};

exports.addRecord = function (record) {
    throw "not implemented";
};

exports.updateRecord = function (record) {
    throw "not implemented";
};

exports.deleteRecord = function (record) {
    throw "not implemented";
};
