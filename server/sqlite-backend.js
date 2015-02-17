var fs = require('fs'),
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

var db = new sqlite3.Database(dbFile);

if ( ! dbExists) {
    db.serialize(function () {
        db.run("CREATE TABLE Settings (
            key varchar,
            value varchar
        )");

        db.run("CREATE TABLE Records (
            id int,
            created date,
            updated date,
            text text
        )");
    });
}

exports.getSettings = function () {
    var settings = {};

    db.each("SELECT key, value FROM Settings", function (err, row) {
        settings[key] = value;
    });

    // TODO: verify if db.each runs asynchronously; then run this so too
    return settings;
};

// Object of all the settings excluding hash
exports.setSettings = function (settings) {
    throw "not implemented";
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
